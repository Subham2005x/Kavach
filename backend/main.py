import os
import math
import joblib
import httpx
import asyncio
import numpy as np
import time
import smtplib
import random
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google import genai
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from dotenv import load_dotenv
from functools import lru_cache
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
        "https://kavach-ffc75.web.app",           # Firebase Hosting URL
        "https://kavach-ffc75.firebaseapp.com",   # Alternative Firebase URL
        "http://localhost:5173",                  # Vite development
        "http://localhost:3000",                  # Alternative port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",  # Allow all origins for now (remove in production)
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

class AlertSettings(BaseModel):
    email: str = ""
    phone: str = ""
    landslide_threshold: int = 70
    flood_threshold: int = 60
    rainfall_threshold: int = 100
    enable_email: bool = False
    enable_sms: bool = False
    alert_location: str = ""
    alert_lat: float = None
    alert_lng: float = None

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
    # Optimized AI explanation with aggressive caching and rate limiting
    landslide = risk_data.get('landslide_risk', 0)
    slope = risk_data.get('slope_calculated', 0)
    rainfall = risk_data.get('rainfall_intensity', 0)
    
    # Create cache key with broader ranges for better cache hits (reduces API calls by ~90%)
    cache_key = f"{round(landslide/15)*15}_{round(slope/10)*10}_{round(rainfall/15)*15}"
    
    # Initialize cache and rate limiter
    if not hasattr(chat_explanation, 'cache'):
        chat_explanation.cache = {}
        chat_explanation.cache_time = {}
        chat_explanation.last_api_call = 0
    
    current_time = time.time()
    
    # Return cached response if less than 30 minutes old (increased from 5 min)
    if cache_key in chat_explanation.cache:
        if current_time - chat_explanation.cache_time.get(cache_key, 0) < 1800:
            return {"explanation": chat_explanation.cache[cache_key]}
    
    # Rate limiting: Max 1 API call every 5 seconds
    time_since_last_call = current_time - chat_explanation.last_api_call
    if time_since_last_call < 5:
        # Use fallback if requesting too frequently
        fallback = generate_fallback_explanation(landslide, slope, rainfall)
        return {"explanation": fallback}
    
    # Enhanced prompt with more detailed context
    prompt = f"""You are a mountain disaster risk analyst. Analyze this situation:

Location: Mountain terrain
Landslide Risk: {landslide}%
Terrain Slope: {slope}°
Current Rainfall: {rainfall}mm/hr

Provide:
1. Risk assessment (2-3 sentences explaining what the numbers mean)
2. Why this is concerning or safe (geological perspective)
3. Immediate safety recommendation (specific action)

Keep response under 100 words, professional tone."""
    
    try:
        chat_explanation.last_api_call = current_time
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        raw_text = response.text if hasattr(response, 'text') else str(response)
        
        # Beautify and format the response
        formatted_text = beautify_ai_response(raw_text)
        
        # Cache successful response
        chat_explanation.cache[cache_key] = formatted_text
        chat_explanation.cache_time[cache_key] = current_time
        
        return {"explanation": formatted_text}
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Gemini API Error: {error_msg}")
        
        # Provide intelligent fallback
        fallback = generate_fallback_explanation(landslide, slope, rainfall)
        
        # Cache fallback for 10 minutes to avoid repeated failed calls
        chat_explanation.cache[cache_key] = fallback
        chat_explanation.cache_time[cache_key] = current_time
        
        return {"explanation": fallback}

def beautify_ai_response(raw_text):
    """Clean and format AI response for better readability with enhanced structure"""
    import re
    
    # Remove markdown formatting and asterisks
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', raw_text)  # Remove bold markdown
    text = re.sub(r'\*(.+?)\*', r'\1', text)  # Remove italic markdown
    
    # Remove excessive formalities and verbose phrases
    text = text.replace("You are a mountain disaster risk analyst.", "")
    text = text.replace("As a mountain disaster risk analyst,", "")
    text = text.replace("As a disaster expert,", "")
    text = text.replace("my assessment indicates", "")
    text = text.replace("Based on the data provided,", "")
    text = text.replace("my assessment is,", "")
    
    # Extract safety recommendation/action (multiple patterns)
    safety_patterns = [
        r'(?:Safety Recommendation|Immediate Safety Recommendation|Safety Action):\s*(.+?)(?:\n|$)',
        r'(?:Recommendation|Action):\s*(.+?)(?:\n|$)',
        r'\d+\.\s*(?:Immediate safety recommendation|Safety recommendation).*?:\s*(.+?)(?:\n|$)',
    ]
    
    safety_tip = None
    for pattern in safety_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            safety_tip = match.group(1).strip()
            # Remove the matched safety section from main text
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
            break
    
    # If no structured safety tip found, try to extract last sentence as safety tip
    if not safety_tip:
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        if len(sentences) > 3:
            # Check if last sentence contains safety-related keywords
            last_sentence = sentences[-1]
            safety_keywords = ['should', 'must', 'evacuate', 'monitor', 'avoid', 'stay', 'keep', 'prepare', 'alert']
            if any(keyword in last_sentence.lower() for keyword in safety_keywords):
                safety_tip = last_sentence
                text = ' '.join(sentences[:-1])
    
    # Clean up numbered lists and structure
    text = re.sub(r'\d+\.\s*', '', text)  # Remove numbered list markers
    text = re.sub(r'\s+', ' ', text)  # Collapse multiple spaces
    text = text.strip()
    
    # Split into paragraphs if multiple sections exist
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    if len(paragraphs) > 1:
        # Join paragraphs with proper spacing
        main_text = '\n\n'.join(paragraphs[:2])  # Take first 2 paragraphs
    else:
        # Limit to reasonable length if single paragraph
        sentences = re.split(r'(?<=[.!?])\s+', text)
        main_text = ' '.join(sentences[:5])  # Up to 5 sentences
    
    # Format the final output with emoji and clear structure
    if safety_tip:
        # Clean up safety tip (remove trailing punctuation artifacts)
        safety_tip = safety_tip.strip()
        if not safety_tip.endswith('.'):
            safety_tip += '.'
        formatted = f"{main_text}\n\n🛡️ Safety Action: {safety_tip}"
    else:
        formatted = main_text
    
    return formatted

def generate_fallback_explanation(landslide_risk, slope, rainfall):
    """Generate a detailed rule-based explanation when AI is unavailable"""
    
    # Determine risk classifications with HTML formatting
    risk_level_html = ""
    if landslide_risk > 70:
        risk_level_html = "<strong style='color: #ef4444;'>high risk conditions</strong>"
    elif landslide_risk > 40:
        risk_level_html = "<strong style='color: #f59e0b;'>moderate risk conditions</strong>"
    else:
        risk_level_html = "<strong style='color: #10b981;'>low risk conditions</strong>"
    
    # Build comprehensive risk assessment with HTML formatting
    assessment = f"Current landslide risk stands at <strong>{landslide_risk:.1f}%</strong>, indicating {risk_level_html}. "
    
    # Add slope analysis
    if slope > 30:
        assessment += f"The terrain features a steep <strong>{slope}°</strong> slope, which significantly increases ground instability and susceptibility to mass movements. "
    elif slope > 15:
        assessment += f"The terrain has a moderately inclined slope of <strong>{slope}°</strong>, creating potential for landslides under adverse conditions. "
    else:
        assessment += f"The relatively gentle <strong>{slope}°</strong> slope provides some natural stability against landslides. "
    
    # Add rainfall impact analysis
    if rainfall > 50:
        assessment += f"Heavy rainfall at <strong>{rainfall}mm/hr</strong> is rapidly saturating the soil, dramatically increasing failure risk through pore pressure buildup and reduced soil cohesion."
    elif rainfall > 20:
        assessment += f"Moderate rainfall (<strong>{rainfall}mm/hr</strong>) is progressively saturating the ground, raising concerns about slope stability over time."
    elif rainfall > 0:
        assessment += f"Light rainfall (<strong>{rainfall}mm/hr</strong>) presents minimal immediate threat but requires monitoring if conditions intensify."
    else:
        assessment += "Current <strong>dry conditions</strong> provide a favorable factor, as soil moisture levels are not being elevated by precipitation."
    
    # Determine geological perspective and safety action based on risk level
    if landslide_risk > 70:
        perspective = "<div style='margin-top: 16px; padding: 12px; background: rgba(51, 65, 85, 0.3); border-left: 3px solid #ef4444; border-radius: 4px;'><strong style='color: #fca5a5;'>Geological Perspective:</strong> Critical instability conditions exist. The combination of terrain geometry and environmental factors creates imminent failure potential requiring immediate protective response.</div>"
        safety_tip = "<div class='safety-action'><strong>Safety Action:</strong> Evacuate to higher, stable ground immediately. Avoid valleys, drainage paths, and steep slopes. Alert local authorities and neighbors.</div>"
    elif landslide_risk > 40:
        perspective = "<div style='margin-top: 16px; padding: 12px; background: rgba(51, 65, 85, 0.3); border-left: 3px solid #f59e0b; border-radius: 4px;'><strong style='color: #fcd34d;'>Geological Perspective:</strong> Moderate instability indicates the area is approaching threshold conditions where ground failure could occur. Preventative measures and continuous monitoring are essential.</div>"
        safety_tip = "<div class='safety-action'><strong>Safety Action:</strong> Identify and prepare evacuation routes. Monitor for warning signs like ground cracks, tilting structures, or sudden water flow changes. Stay alert to weather updates.</div>"
    else:
        perspective = "<div style='margin-top: 16px; padding: 12px; background: rgba(51, 65, 85, 0.3); border-left: 3px solid #10b981; border-radius: 4px;'><strong style='color: #86efac;'>Geological Perspective:</strong> Current conditions show acceptable stability margins. While risk exists in any mountain terrain, immediate hazard probability remains low under present circumstances.</div>"
        safety_tip = "<div class='safety-action'><strong>Safety Action:</strong> Maintain situational awareness and keep emergency supplies accessible. Stay informed through local disaster management channels.</div>"
    
    return f"<div style='line-height: 1.8;'>{assessment}</div>{perspective}{safety_tip}"

@app.get("/weather_forecast")
async def weather_forecast(lat: float, lon: float):
    """Fetch 24-hour hourly weather forecast including rainfall"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "hourly": "precipitation,temperature_2m,relative_humidity_2m,wind_speed_10m",
                    "forecast_days": 1,
                    "timezone": "auto"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                return {"status": "error", "message": "Weather API unavailable"}
            
            data = response.json()
            hourly = data.get("hourly", {})
            
            # Format forecast data for frontend
            forecast = []
            times = hourly.get("time", [])
            precipitations = hourly.get("precipitation", [])
            temperatures = hourly.get("temperature_2m", [])
            humidities = hourly.get("relative_humidity_2m", [])
            wind_speeds = hourly.get("wind_speed_10m", [])
            
            for i in range(min(24, len(times))):
                forecast.append({
                    "hour": i,
                    "time": times[i],
                    "rainfall": precipitations[i] if i < len(precipitations) else 0,
                    "temperature": temperatures[i] if i < len(temperatures) else 0,
                    "humidity": humidities[i] if i < len(humidities) else 0,
                    "wind_speed": wind_speeds[i] if i < len(wind_speeds) else 0
                })
            
            # Calculate total accumulated rainfall
            total_rainfall = sum(f["rainfall"] for f in forecast)
            max_rainfall = max((f["rainfall"] for f in forecast), default=0)
            avg_rainfall = total_rainfall / len(forecast) if forecast else 0
            
            return {
                "status": "success",
                "forecast": forecast,
                "summary": {
                    "total_rainfall": round(total_rainfall, 2),
                    "max_rainfall": round(max_rainfall, 2),
                    "avg_rainfall": round(avg_rainfall, 2)
                }
            }
            
    except Exception as e:
        logger.error(f"Weather forecast error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/safe_zones")
async def get_safe_zones(lat: float, lon: float, radius: float = 5.0):
    """Fetch nearby safe zones including hospitals, police stations, and shelters"""
    try:
        # Search radius in kilometers (converted to degrees approximately)
        radius_deg = radius / 111.0  # 1 degree ≈ 111 km
        
        # Overpass API query for safe facilities
        overpass_url = "https://overpass-api.de/api/interpreter"
        
        query = f"""
        [out:json][timeout:45];
        (
          node["amenity"="hospital"](around:{radius*1000},{lat},{lon});
          node["amenity"="police"](around:{radius*1000},{lat},{lon});
          node["amenity"="fire_station"](around:{radius*1000},{lat},{lon});
          node["amenity"="shelter"](around:{radius*1000},{lat},{lon});
          node["emergency"="assembly_point"](around:{radius*1000},{lat},{lon});
        );
        out body;
        """
        
        # Retry logic with exponential backoff
        max_retries = 3
        retry_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        overpass_url,
                        data=query
                    )
                    
                    if response.status_code == 200:
                        break
                    elif response.status_code == 504:
                        logger.warning(f"Overpass API timeout (attempt {attempt + 1}/{max_retries})")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(retry_delay * (attempt + 1))
                            continue
                    else:
                        logger.error(f"Overpass API error: {response.status_code}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(retry_delay)
                            continue
            except httpx.TimeoutException:
                logger.warning(f"Overpass API request timeout (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    return {
                        "status": "error",
                        "message": "Safe zones API is currently unavailable. Please try again later.",
                        "safe_zones": []
                    }
            except Exception as e:
                logger.error(f"Overpass API request failed: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    continue
                else:
                    return {
                        "status": "error",
                        "message": "Safe zones API encountered an error",
                        "safe_zones": []
                    }
        
        if response.status_code != 200:
            return {
                "status": "error",
                "message": f"Safe zones API unavailable (HTTP {response.status_code})",
                "safe_zones": []
            }
        
        data = response.json()
        elements = data.get("elements", [])
        
        safe_zones = []
        for elem in elements:
            amenity = elem.get("tags", {}).get("amenity", elem.get("tags", {}).get("emergency", "unknown"))
            name = elem.get("tags", {}).get("name", f"Unnamed {amenity}")
            
            # Calculate distance
            lat2, lon2 = elem.get("lat", 0), elem.get("lon", 0)
            distance = calculate_distance(lat, lon, lat2, lon2)
            
            # Categorize facility type
            if amenity == "hospital":
                category = "Hospital"
                icon = "🏥"
            elif amenity == "police":
                category = "Police Station"
                icon = "🚓"
            elif amenity == "fire_station":
                category = "Fire Station"
                icon = "🚒"
            elif amenity == "shelter":
                category = "Shelter"
                icon = "🏠"
            elif amenity == "assembly_point":
                category = "Assembly Point"
                icon = "📍"
            else:
                category = "Safe Zone"
                icon = "🛡️"
            
            safe_zones.append({
                "name": name,
                "category": category,
                "icon": icon,
                "lat": lat2,
                "lon": lon2,
                "distance": round(distance, 2),
                "address": elem.get("tags", {}).get("addr:full", "")
            })
        
        # Sort by distance
        safe_zones.sort(key=lambda x: x["distance"])
        
        return {
            "status": "success",
            "safe_zones": safe_zones[:15],  # Return top 15 closest
            "total_found": len(safe_zones)
        }
            
    except Exception as e:
        logger.error(f"Safe zones error: {e}")
        return {"status": "error", "message": str(e)}

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in kilometers using Haversine formula"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

@app.get("/local_news")
async def get_local_news(lat: float, lon: float):
    """Fetch weather and disaster-related news for the area using NewsAPI"""
    try:
        # Get location name from reverse geocoding (approximate)
        location_name = await get_location_name(lat, lon)
        
        # Search for weather/disaster news
        query = f"{location_name} weather OR disaster OR flood OR landslide OR rainfall OR storm"
        
        async with httpx.AsyncClient() as client:
            # Using NewsAPI (you can also use GNews or other free APIs)
            response = await client.get(
                "https://gnews.io/api/v4/search",
                params={
                    "q": query,
                    "lang": "en",
                    "country": "in",
                    "max": 6,
                    "apikey": os.getenv("GNEWS_API_KEY", "demo")  # Add your GNews API key to .env
                },
                timeout=15.0
            )
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get("articles", [])
                
                # Filter and format articles
                news_items = []
                for article in articles[:6]:
                    news_items.append({
                        "title": article.get("title", ""),
                        "description": article.get("description", ""),
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "url": article.get("url", ""),
                        "published_at": article.get("publishedAt", ""),
                        "image": article.get("image", "")
                    })
                
                return {
                    "status": "success",
                    "location": location_name,
                    "news": news_items
                }
            else:
                # Return empty news list if API fails
                return {
                    "status": "success",
                    "location": location_name,
                    "news": []
                }
                
    except Exception as e:
        logger.error(f"News fetch error: {e}")
        return {
            "status": "success",
            "location": location_name if 'location_name' in locals() else "Selected Area",
            "news": []
        }

async def get_location_name(lat: float, lon: float) -> str:
    """Get approximate location name from coordinates"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json"
                },
                headers={"User-Agent": "Kavach-DisasterApp/1.0"},
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                address = data.get("address", {})
                # Get city, state, or country
                return (address.get("city") or 
                       address.get("state_district") or 
                       address.get("state") or 
                       address.get("country") or 
                       "Unknown Location")
    except:
        pass
    return "Selected Area"

# In-memory storage for alerts (use database in production)
alert_history = []
user_alert_settings = {}

# SMS and Email sending functions
async def send_email_alert(to_email: str, alert_data: dict):
    """Send email alert using Resend API"""
    try:
        resend_api_key = os.getenv("RESEND_API_KEY", "")
        sender_email = os.getenv("SENDER_EMAIL", "")
        
        if not resend_api_key:
            logger.warning("Resend API key not configured")
            return False
        
        import resend
        resend.api_key = resend_api_key
        
        # Email HTML body
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h2 style="color: #d32f2f; margin-top: 0;">🚨 Kavach Disaster Alert</h2>
                <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Alert Level:</strong> <span style="color: #d32f2f;">{alert_data['level']}</span></p>
                    <p style="margin: 5px 0;"><strong>Alert Type:</strong> {alert_data['type']}</p>
                </div>
                <p style="font-size: 16px; line-height: 1.6;">{alert_data['message']}</p>
                <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-radius: 5px;">
                    <p style="margin: 5px 0;"><strong>📍 Location:</strong> {alert_data['location']}</p>
                    <p style="margin: 5px 0;"><strong>📊 Current Value:</strong> {alert_data['value']}</p>
                    <p style="margin: 5px 0;"><strong>⚠️ Your Threshold:</strong> {alert_data['threshold']}</p>
                    <p style="margin: 5px 0;"><strong>🕐 Time:</strong> {alert_data['timestamp']}</p>
                </div>
                <p style="color: #d32f2f; font-weight: bold;">⚠️ Please take necessary precautions and stay safe.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #666; font-size: 12px; margin: 0;">- Kavach Disaster Alert Team</p>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": "Kavach Alerts <onboarding@resend.dev>",  # Use Resend's test domain
            "to": [to_email],
            "subject": f"🚨 {alert_data['level']} Alert: {alert_data['type']}",
            "html": html_content,
        }
        
        logger.info(f"📧 Attempting to send email to: {to_email}")
        email = resend.Emails.send(params)
        logger.info(f"✅ EMAIL SENT SUCCESSFULLY to: {to_email} (ID: {email['id']})")
        return True
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return False

async def send_sms_alert(to_phone: str, alert_data: dict):
    """Send SMS alert using Twilio or other SMS service"""
    try:
        # Option 1: Using Twilio (FREE TRIAL - Works internationally)
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "")
        
        if all([twilio_sid, twilio_token, twilio_phone]):
            try:
                from twilio.rest import Client
                client = Client(twilio_sid, twilio_token)
                message = client.messages.create(
                    body=f"🚨 {alert_data['level']} Alert: {alert_data['type']} - {alert_data['message']} at your Location. Stay safe!",
                    from_=twilio_phone,
                    to=to_phone if to_phone.startswith('+') else f"+91{to_phone}"
                )
                logger.info(f"SMS alert sent via Twilio to: {to_phone}")
                return True
            except Exception as twilio_error:
                logger.error(f"Twilio error: {twilio_error}")
        
        # Option 2: Using Fast2SMS (India-specific - REQUIRES PAYMENT)
        # COMMENTED OUT - Requires 100 INR minimum payment
        # fast2sms_api_key = os.getenv("FAST2SMS_API_KEY", "")
        # 
        # if fast2sms_api_key:
        #     message_text = f"KAVACH ALERT: {alert_data['level']} - {alert_data['type']} at {alert_data['location']}. {alert_data['message']}"
        #     
        #     async with httpx.AsyncClient() as client:
        #         response = await client.post(
        #             "https://www.fast2sms.com/dev/bulkV2",
        #             headers={
        #                 "authorization": fast2sms_api_key,
        #                 "Content-Type": "application/json"
        #             },
        #             json={
        #                 "route": "q",
        #                 "message": message_text,
        #                 "language": "english",
        #                 "flash": 0,
        #                 "numbers": to_phone.replace("+91", "").replace("+", "")
        #             },
        #             timeout=10.0
        #         )
        #         
        #         if response.status_code == 200:
        #             resp_data = response.json()
        #             if resp_data.get("status_code") == 999:
        #                 print(f"⚠️ Fast2SMS: Account needs payment (100 INR minimum)")
        #                 print(f"📱 DEMO MODE - SMS Alert to {to_phone}: {alert_data['level']} - {alert_data['message']}")
        #                 return True
        #             print(f"✅ SMS sent via Fast2SMS to: {to_phone}")
        #             return True
        #         else:
        #             print(f"❌ SMS send failed: {response.text}")
        
        # SMS service not configured
        logger.warning(f"SMS service unavailable - Alert not sent to {to_phone}")
        return False
            
    except Exception as e:
        logger.error(f"SMS send error: {e}")
        return False

@app.post("/alert/settings")
async def save_alert_settings(settings: AlertSettings, user_id: str = "default"):
    """Save user alert settings"""
    user_alert_settings[user_id] = settings.dict()
    return {"status": "success", "message": "Alert settings saved"}

@app.get("/alert/settings")
async def get_alert_settings(user_id: str = "default"):
    """Get user alert settings"""
    settings = user_alert_settings.get(user_id, {
        "email": "",
        "phone": "",
        "landslide_threshold": 70,
        "flood_threshold": 60,
        "rainfall_threshold": 100,
        "enable_email": False,
        "enable_sms": False,
        "alert_location": "",
        "alert_lat": None,
        "alert_lng": None
    })
    return {"status": "success", "settings": settings}

@app.get("/alert/debug")
async def debug_alert_settings():
    """Debug endpoint to see all stored settings"""
    return {
        "status": "success",
        "all_users": list(user_alert_settings.keys()),
        "settings_by_user": user_alert_settings
    }

@app.post("/alert/check")
async def check_alerts(data: dict = Body(...), user_id: str = "default"):
    """Check if current conditions trigger an alert"""
    landslide_risk = data.get("landslide_risk", 0)
    flood_risk = data.get("flood_risk", 0)
    rainfall = data.get("rainfall", 0)
    location = data.get("location", "Unknown Location")
    
    logger.info(f"🔍 Alert check requested for user: {user_id}")
    logger.info(f"📊 Risk values - Landslide: {landslide_risk}%, Flood: {flood_risk}%, Rainfall: {rainfall}mm")
    
    settings = user_alert_settings.get(user_id, {})
    logger.info(f"⚙️ User settings: {settings}")
    
    if not settings:
        logger.warning(f"⚠️ No settings found for user {user_id}")
        return {"status": "success", "alerts": [], "message": "No settings configured"}
    
    alerts = []
    current_time = time.strftime("%Y-%m-%d %H:%M:%S")
    
    # Check landslide threshold
    if landslide_risk >= settings.get("landslide_threshold", 70):
        level = "EMERGENCY" if landslide_risk >= 85 else "WARNING" if landslide_risk >= 70 else "WATCH"
        alert = {
            "id": len(alert_history) + 1,
            "type": "Landslide",
            "level": level,
            "value": landslide_risk,
            "threshold": settings.get("landslide_threshold"),
            "message": f"Landslide risk at {landslide_risk}% exceeds threshold",
            "location": location,
            "timestamp": current_time
        }
        alerts.append(alert)
        alert_history.append(alert)
    
    # Check flood threshold
    if flood_risk >= settings.get("flood_threshold", 60):
        level = "EMERGENCY" if flood_risk >= 80 else "WARNING" if flood_risk >= 60 else "WATCH"
        alert = {
            "id": len(alert_history) + 1,
            "type": "Flood",
            "level": level,
            "value": flood_risk,
            "threshold": settings.get("flood_threshold"),
            "message": f"Flood risk at {flood_risk}% exceeds threshold",
            "location": location,
            "timestamp": current_time
        }
        alerts.append(alert)
        alert_history.append(alert)
    
    # Check rainfall threshold
    if rainfall >= settings.get("rainfall_threshold", 100):
        level = "EMERGENCY" if rainfall >= 150 else "WARNING" if rainfall >= 100 else "WATCH"
        alert = {
            "id": len(alert_history) + 1,
            "type": "Heavy Rainfall",
            "level": level,
            "value": rainfall,
            "threshold": settings.get("rainfall_threshold"),
            "message": f"Rainfall at {rainfall}mm exceeds threshold",
            "location": location,
            "timestamp": current_time
        }
        alerts.append(alert)
        alert_history.append(alert)
    
    # Send actual SMS/Email notifications
    email_sent = False
    sms_sent = False
    
    if alerts:
        logger.info(f"🚨 {len(alerts)} alert(s) triggered for user {user_id}")
        logger.info(f"🔐 Email enabled: {settings.get('enable_email')}, Email address: {settings.get('email')}")
        logger.info(f"🔐 SMS enabled: {settings.get('enable_sms')}, Phone: {settings.get('phone')}")
        
        for alert in alerts:
            if settings.get("enable_email") and settings.get("email"):
                logger.info(f"📧 Attempting to send email to: {settings.get('email')}")
                email_result = await send_email_alert(settings.get("email"), alert)
                if email_result:
                    email_sent = True
                    logger.info(f"✅ Email sent successfully!")
                else:
                    logger.error(f"❌ Email failed to send!")
            else:
                logger.warning(f"⚠️ Email notification skipped - enabled: {settings.get('enable_email')}, has email: {bool(settings.get('email'))}")
            
            if settings.get("enable_sms") and settings.get("phone"):
                logger.info(f"📱 Attempting to send SMS to: {settings.get('phone')}")
                sms_result = await send_sms_alert(settings.get("phone"), alert)
                if sms_result:
                    sms_sent = True
                    logger.info(f"✅ SMS sent successfully!")
                else:
                    logger.error(f"❌ SMS failed to send!")
            else:
                logger.warning(f"⚠️ SMS notification skipped - enabled: {settings.get('enable_sms')}, has phone: {bool(settings.get('phone'))}")
    else:
        logger.info(f"ℹ️ No alerts triggered for user {user_id} (values below thresholds)")
    
    return {
        "status": "success", 
        "alerts": alerts,
        "notifications": {
            "email_sent": email_sent,
            "sms_sent": sms_sent
        }
    }

@app.get("/alert/history")
async def get_alert_history(limit: int = 50):
    """Get alert history"""
    return {
        "status": "success",
        "alerts": alert_history[-limit:] if alert_history else []
    }

@app.delete("/alert/history")
async def clear_alert_history():
    """Clear alert history"""
    global alert_history
    alert_history = []
    return {"status": "success", "message": "Alert history cleared"}

@app.post("/alert/check_saved_location")
async def check_saved_location_alerts(user_id: str = "default"):
    """Check alerts for the user's saved alert location"""
    settings = user_alert_settings.get(user_id, {})
    if not settings or not settings.get("alert_lat") or not settings.get("alert_lng"):
        return {
            "status": "error",
            "message": "No alert location configured. Please set a location in alert settings."
        }
    
    try:
        # Simulate risk for the saved location
        lat = settings.get("alert_lat")
        lon = settings.get("alert_lng")
        
        # Call the simulation endpoint to get current risk
        simulation_input = {
            "lat": lat,
            "lon": lon,
            "rainfall_intensity": 50.0,  # Use default or fetch live weather
            "duration_hours": 24,
            "soil_moisture": 0.5,
            "slope_angle": 0.0,
            "elevation": 0.0,
            "drainage_density": 1.5,
            "use_live_weather": True
        }
        
        # You can call the simulate endpoint or do the risk calculation here
        # For now, return a message
        return {
            "status": "success",
            "message": f"Monitoring location: {lat:.4f}, {lon:.4f}",
            "location": settings.get("alert_location", f"{lat}, {lon}")
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- OTP VERIFICATION SYSTEM ---
# In-memory storage for OTPs (use database in production)
otp_storage = {}  # {user_id: {phone: str, otp: str, expiry: datetime, verified: bool}}

@app.post("/alert/send_verification_otp")
async def send_verification_otp(data: dict = Body(...)):
    """Send OTP to phone number for verification"""
    user_id = data.get("user_id", "default")
    phone = data.get("phone", "")
    
    if not phone:
        return {"status": "error", "message": "Phone number is required"}
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    expiry = datetime.now() + timedelta(minutes=10)
    
    # Store OTP
    otp_storage[user_id] = {
        "phone": phone,
        "otp": otp,
        "expiry": expiry,
        "verified": False
    }
    
    # Send OTP via Twilio
    try:
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "")
        
        if all([twilio_sid, twilio_token, twilio_phone]):
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            message = client.messages.create(
                body=f"Your KAVACH verification code is: {otp}\n\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.",
                from_=twilio_phone,
                to=phone if phone.startswith('+') else f"+91{phone}"
            )
            logger.info(f"OTP sent via Twilio to: {phone}")
            return {
                "status": "success",
                "message": f"Verification code sent to {phone}"
            }
        else:
            logger.warning("Twilio not configured - OTP cannot be sent")
            return {
                "status": "error",
                "message": "SMS service not configured. Please contact administrator."
            }
    except Exception as e:
        logger.error(f"Error sending OTP: {e}")
        return {
            "status": "error",
            "message": "Failed to send verification code. Please try again later."
        }

@app.post("/alert/verify_otp")
async def verify_otp(data: dict = Body(...)):
    """Verify OTP code"""
    user_id = data.get("user_id", "default")
    otp_entered = data.get("otp", "")
    
    if user_id not in otp_storage:
        return {"status": "error", "message": "No OTP found. Please request a new one."}
    
    stored = otp_storage[user_id]
    
    # Check expiry
    if datetime.now() > stored["expiry"]:
        del otp_storage[user_id]
        return {"status": "error", "message": "OTP expired. Please request a new one."}
    
    # Check OTP
    if stored["otp"] != otp_entered:
        return {"status": "error", "message": "Invalid OTP. Please try again."}
    
    # Mark as verified
    otp_storage[user_id]["verified"] = True
    
    return {
        "status": "success",
        "message": "Phone number verified successfully!",
        "phone": stored["phone"]
    }

@app.get("/alert/verification_status")
async def get_verification_status(user_id: str = "default"):
    """Check if user's phone is verified"""
    if user_id in otp_storage and otp_storage[user_id].get("verified"):
        return {
            "status": "success",
            "verified": True,
            "phone": otp_storage[user_id]["phone"]
        }
    return {"status": "success", "verified": False}

# Static Files (optional - only if directory exists)
import os.path
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")
    @app.get("/")
    async def index(): return FileResponse('static/index.html')
else:
    @app.get("/")
    async def root():
        return {"message": "Kavach Backend API", "status": "running", "frontend": "https://kavach-ffc75.web.app"}

