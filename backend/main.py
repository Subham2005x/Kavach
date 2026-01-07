import os
import math
import joblib
import httpx
import numpy as np
from google import genai
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from dotenv import load_dotenv

# --- 1. CONFIG & API KEYS ---
load_dotenv()  # Load environment variables from .env file
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI()

# Configure CORS to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # Alternative port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = "ml_models"
os.makedirs(MODEL_DIR, exist_ok=True)

# --- 2. SCHEMAS ---
class SimulationInput(BaseModel):
    lat: float
    lon: float
    rainfall_intensity: float    
    duration_hours: int
    soil_moisture: float         
    slope_angle: float = 0.0     
    elevation: float = 0.0       
    drainage_density: float = 1.5 
    use_live_weather: bool = False

# --- 3. SERVICES ---
class ElevationService:
    def __init__(self):
        self.url = "https://api.open-meteo.com/v1/elevation"

    async def get_slope_and_elevation(self, lat: float, lon: float):
        # Fetches elevation for center and 4 surrounding points to calculate slope
        delta = 0.0008 
        coords = [(lat, lon), (lat + delta, lon), (lat - delta, lon), (lat, lon + delta), (lat, lon - delta)]
        lats = ",".join([str(c[0]) for c in coords])
        lons = ",".join([str(c[1]) for c in coords])
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(self.url, params={"latitude": lats, "longitude": lons})
                elevs = resp.json().get("elevation", [500]*5)
                z_c, z_n, z_s, z_e, z_w = elevs
                dist = 90.0 
                dz_dx = (z_e - z_w) / (2 * dist)
                dz_dy = (z_n - z_s) / (2 * dist)
                slope = math.degrees(math.atan(math.sqrt(dz_dx**2 + dz_dy**2)))
                return round(slope, 2), z_c
            except: return 15.0, 500.0

    async def get_profile(self, lat: float, lon: float):
        # Generates 10 points for the Terrain Profile Chart
        lats = [lat + (i * 0.001) for i in range(-5, 5)]
        lons = [lon] * 10
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(self.url, params={
                    "latitude": ",".join(map(str, lats)), 
                    "longitude": ",".join(map(str, lons))
                })
                return resp.json().get("elevation", [])
            except: return [500] * 10

# --- 4. ROUTES ---
elevation_service = ElevationService()

@app.post("/simulate")
async def simulate(input_data: SimulationInput):
    slope, elev = await elevation_service.get_slope_and_elevation(input_data.lat, input_data.lon)
    profile = await elevation_service.get_profile(input_data.lat, input_data.lon)
    
    # Simple risk logic for demonstration
    risk = min(100, (slope * 2) + (input_data.rainfall_intensity / 2))
    level = "RED" if risk > 70 else "YELLOW" if risk > 40 else "GREEN"
    
    res = {
        "landslide_risk": round(risk, 2),
        "flood_risk": round(input_data.rainfall_intensity * 0.4, 2),
        "alert_level": level,
        "recommendation": "Evacuate" if level == "RED" else "Stay Alert",
        "elevation_profile": profile, # Necessary for Terrain Chart
        "slope_calculated": slope
    }
    return {"status": "success", "results": res}

@app.post("/chat_explanation")
async def chat_explanation(risk_data: dict = Body(...)):
    # Calls Gemini AI to explain the risk factors
    prompt = f"""
    Act as a disaster expert. Explain these risks:
    Landslide Risk: {risk_data.get('landslide_risk')}%
    Slope: {risk_data.get('slope_calculated')}°
    Rainfall: {risk_data.get('rainfall_intensity')}mm/hr
    Provide a professional 2-sentence explanation and one safety tip.
    """
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        return {"explanation": response.text}
    except:
        return {"explanation": "AI service temporarily offline."}

# Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")
@app.get("/")
async def index(): return FileResponse('static/index.html')
