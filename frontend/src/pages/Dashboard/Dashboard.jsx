import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

// ===== IMPORT COMPONENTS =====
import LayerToggle from "@/components/map/LayerToggle";
import SimulationMode from "@/components/controls/SimulationMode";
import SafetyAdvisory from "@/components/panels/SafetyAdvisory";
import RiskMap from "@/components/map/RiskMap";
import RiskSummaryPanel from "@/components/panels/RiskSummaryPanel";
import WeatherPanel from "@/components/panels/WeatherPanel";
import TerrainElevationChart from "@/components/charts/TerrainElevationChart";
import HazardRadarChart from "@/components/charts/HazardRadarChart";
import RainfallTrendChart from "@/components/charts/RainfallTrendChart";

// ===== IMPORT SERVICES =====
import { simulateRisk, getAIExplanation, getCurrentUser, logout } from "@/services";

// ===== IMPORT STYLES =====
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [layers, setLayers] = useState({
    landslide: true,
    flood: true,
    rivers: false,
    elevation: false,
  });
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulatedRainfall, setSimulatedRainfall] = useState(0);

  // Profile dropdown (store {name, email})
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Backend integration state
  const [riskData, setRiskData] = useState(null);
  const [aiExplanation, setAIExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [terrainProfile, setTerrainProfile] = useState([]);
  const [loadingStage, setLoadingStage] = useState("");

  /* ---------- DERIVED ---------- */
  const effectiveRainfall = simulationActive ? simulatedRainfall : 0;

  const currentRisk = useMemo(() => {
    if (riskData?.alert_level) {
      const level = riskData.alert_level.toLowerCase();
      return level === "red" ? "severe" : level === "yellow" ? "high" : "moderate";
    }

    if (!selectedLocation) return "moderate";
    if (effectiveRainfall > 120) return "severe";
    if (effectiveRainfall > 80) return "high";
    return selectedLocation.riskLevel || "moderate";
  }, [riskData, selectedLocation, effectiveRainfall]);

  /* ---------- LOAD USER (Firebase currentUser) ---------- */
  useEffect(() => {
    const fbUser = getCurrentUser(); // Firebase user object (or null)
    if (fbUser) {
      setUser({
        name: fbUser.displayName || "User",
        email: fbUser.email || "",
      });
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout(); // Firebase signOut wrapper
      navigate("/"); // landing page
    } catch (e) {
      console.error("Logout failed", e);
    }
  }, [navigate]);

  /* ---------- BACKEND API CALLS ---------- */
  const fetchRiskAssessment = useCallback(async (location, rainfall) => {
    if (!location) return;

    const rainfallToUse = rainfall > 0 ? rainfall : 50;

    setIsLoading(true);
    setLoadingStage("Fetching terrain data...");
    try {
      const simulationData = {
        lat: location.coordinates.lat,
        lon: location.coordinates.lng,
        rainfall_intensity: rainfallToUse,
        duration_hours: 24,
        soil_moisture: 0.5,
        slope_angle: 0,
        elevation: 0,
        drainage_density: 1.5,
        use_live_weather: true,
      };

      setLoadingStage("Analyzing terrain and slope...");
      const response = await simulateRisk(simulationData);

      if (response.status === "success") {
        setLoadingStage("Calculating risk levels...");
        setRiskData(response.results);
        setTerrainProfile(response.results.elevation_profile || []);

        setLoadingStage("Generating AI insights...");
        try {
          const aiResponse = await getAIExplanation({
            landslide_risk: response.results.landslide_risk,
            slope_calculated: response.results.slope_calculated,
            rainfall_intensity: rainfall,
          });
          setAIExplanation(aiResponse.explanation || "");
        } catch (aiError) {
          console.error("AI explanation error:", aiError);
          setAIExplanation("AI analysis temporarily unavailable.");
        }
      }
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      setRiskData(null);
      setAIExplanation("");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchRiskAssessment(selectedLocation, effectiveRainfall);
    }
  }, [selectedLocation, effectiveRainfall, fetchRiskAssessment]);

  /* ---------- HANDLERS ---------- */
  const handleLayerToggle = useCallback((layerId) => {
    setLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  }, []);

  const handleLocationSelect = useCallback((location) => {
    const normalizedLocation = {
      ...location,
      coordinates: location.coordinates || {
        lat: location.lat,
        lng: location.lng,
      },
    };
    setSelectedLocation(normalizedLocation);
  }, []);

  const handleResetSimulation = useCallback(() => {
    setSimulatedRainfall(0);
    setSimulationActive(false);
    setRiskData(null);
    setAIExplanation("");
    setTerrainProfile([]);
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLoc = {
          name: "My Current Location",
          lat: latitude,
          lng: longitude,
          risk: "moderate",
          coordinates: { lat: latitude, lng: longitude },
        };
        handleLocationSelect(currentLoc);
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please enable location services.");
        setIsLoading(false);
      }
    );
  }, [handleLocationSelect]);

  /* =============================
       RENDER
  ============================== */
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        {/* LEFT: Logo + Use My Location */}
        <div className="header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="header-logo">
            <div className="logo-icon">K</div>
            <div>
              <div className="logo-text-title">Kavach</div>
              <div className="logo-text-subtitle">Disaster Risk Intelligence</div>
            </div>
          </div>

          <button onClick={handleUseMyLocation} className="location-button">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Use My Location
          </button>
        </div>

        {/* RIGHT: Loading + Live + Profile */}
        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isLoading && (
            <div className="loading-indicator">
              <span>🔄</span>
              <span>Analyzing...</span>
            </div>
          )}

          <div className="live-indicator">● Live</div>

          {/* Profile */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                border: "1px solid rgba(148, 163, 184, 0.5)",
                background: "rgba(15, 23, 42, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Profile"
            >
              <User size={18} color="#e2e8f0" />
            </button>

            {isProfileOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  marginTop: 8,
                  padding: 12,
                  minWidth: 200,
                  background: "rgba(15, 23, 42, 0.98)",
                  borderRadius: 8,
                  border: "1px solid rgba(30, 41, 59, 0.8)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                  zIndex: 2000,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                    {user?.name || "User"}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {user?.email || ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    borderRadius: 6,
                    color: "#ef4444",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN GRID ================= */}
      <div className="dashboard-grid">
        {/* Global Loading Overlay */}
        {isLoading && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2, 6, 23, 0.8)",
              backdropFilter: "blur(8px)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <div className="loading-spinner"></div>
            <div style={{ textAlign: "center" }}>
              <div className="loading-title">Analyzing Location...</div>
              <div className="loading-stage">{loadingStage}</div>
              <div className="loading-subtitle">Please wait</div>
            </div>
          </div>
        )}

        {/* ===== ROW 1: RISK SUMMARY + MAP + WEATHER ===== */}

        {/* Risk Summary - Left Column */}
        <div className="feature-card row1-left">
          <div className="feature-card-header">
            <span className="feature-card-icon">🎯</span>
            <h2 className="feature-card-title">Risk Summary</h2>
          </div>
          <div className="feature-card-body">
            <RiskSummaryPanel
              location={selectedLocation}
              simulatedRainfall={effectiveRainfall}
              riskLevel={currentRisk}
              riskData={riskData}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Interactive Map - Center, Spans 2 rows */}
        <div className="feature-card map-card">
          <div className="feature-card-header">
            <span className="feature-card-icon">🗺️</span>
            <h2 className="feature-card-title">Interactive Risk Map</h2>
          </div>
          <div className="feature-card-body">
            <RiskMap
              selectedLocation={selectedLocation}
              layers={layers}
              simulatedRainfall={effectiveRainfall}
              onLocationSelect={handleLocationSelect}
              riskData={riskData}
            />
          </div>
        </div>

        {/* Weather Conditions - Right Column */}
        <div className="feature-card row1-right">
          <div className="feature-card-header">
            <span className="feature-card-icon">🌦️</span>
            <h2 className="feature-card-title">Weather Conditions</h2>
          </div>
          <div className="feature-card-body">
            <WeatherPanel simulatedRainfall={effectiveRainfall} location={selectedLocation} />
          </div>
        </div>

        {/* AI Analysis Card - Positioned under Risk Summary on left */}
        {(aiExplanation || (isLoading && loadingStage.includes("AI"))) && (
          <div className="feature-card row2-left">
            <div className="feature-card-header">
              <span className="feature-card-icon">🤖</span>
              <h2 className="feature-card-title">AI Expert Analysis</h2>
            </div>
            <div className="feature-card-body">
              <div className="ai-panel-content">
                {isLoading && loadingStage.includes("AI") ? (
                  <div className="ai-loading">
                    <div className="ai-loading-spinner"></div>
                    Generating expert analysis...
                  </div>
                ) : (
                  aiExplanation
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== ROW 2: RISK METRICS (with Safety Advisory inside) + TERRAIN + HAZARD ===== */}

        {/* Risk Metrics with Safety Advisory - Left */}
        {riskData && (
          <div className="feature-card row2-content-left">
            <div className="feature-card-header">
              <span className="feature-card-icon">📈</span>
              <h2 className="feature-card-title">Detailed Risk Metrics</h2>
            </div>
            <div className="feature-card-body">
              <div className="risk-metrics-grid">
                <div className="risk-metric-item">
                  <div className="risk-metric-label">Landslide Risk</div>
                  <div className="risk-metric-value landslide">{riskData.landslide_risk}%</div>
                </div>
                <div className="risk-metric-item">
                  <div className="risk-metric-label">Flood Risk</div>
                  <div className="risk-metric-value flood">{riskData.flood_risk}%</div>
                </div>
                <div className="risk-metric-item">
                  <div className="risk-metric-label">Slope Angle</div>
                  <div className="risk-metric-value slope">{riskData.slope_calculated}°</div>
                </div>
                <div className="risk-metric-item">
                  <div className="risk-metric-label">Alert Level</div>
                  <div className={`risk-metric-value ${riskData.alert_level.toLowerCase()}`}>
                    {riskData.alert_level}
                  </div>
                </div>
              </div>

              <div className={`risk-recommendation ${riskData.alert_level.toLowerCase()}`}>
                <div className="recommendation-label">Recommendation</div>
                <div className="recommendation-text">{riskData.recommendation}</div>
              </div>

              {/* SAFETY ADVISORY MOVED INSIDE THIS CARD */}
              <div className="safety-advisory-section">
                <SafetyAdvisory riskLevel={currentRisk} />
              </div>
            </div>
          </div>
        )}

        {/* Terrain Elevation Chart - Center */}
        <div className="feature-card row2-center">
          <div className="feature-card-header">
            <span className="feature-card-icon">⛰️</span>
            <h2 className="feature-card-title">Terrain Elevation Profile</h2>
          </div>
          <div className="feature-card-body">
            <TerrainElevationChart terrainProfile={terrainProfile} location={selectedLocation} />
          </div>
        </div>

        {/* Hazard Radar Chart - Right */}
        <div className="feature-card row2-right">
          <div className="feature-card-header">
            <span className="feature-card-icon">📡</span>
            <h2 className="feature-card-title">Multi-Hazard Risk Profile</h2>
          </div>
          <div className="feature-card-body">
            <HazardRadarChart riskData={riskData} simulatedRainfall={effectiveRainfall} />
          </div>
        </div>

        {/* ===== ROW 3: RAINFALL + MAP LAYERS + SIMULATION ===== */}

        {/* 24-Hour Rainfall Forecast - Left */}
        <div className="feature-card row3-left">
          <div className="feature-card-header">
            <span className="feature-card-icon">🌧️</span>
            <h2 className="feature-card-title">24-Hour Rainfall Forecast</h2>
          </div>
          <div className="feature-card-body">
            <RainfallTrendChart simulatedRainfall={effectiveRainfall} />
          </div>
        </div>

        {/* Map Layers - Center */}
        <div className="feature-card row3-center">
          <div className="feature-card-header">
            <span className="feature-card-icon">🗺️</span>
            <h2 className="feature-card-title">Map Layers</h2>
          </div>
          <div className="feature-card-body">
            <LayerToggle layers={layers} onToggle={handleLayerToggle} />
          </div>
        </div>

        {/* Simulation Mode - Right */}
        <div className="feature-card row3-right">
          <div className="feature-card-header">
            <span className="feature-card-icon">🔬</span>
            <h2 className="feature-card-title">Simulation Mode</h2>
          </div>
          <div className="feature-card-body">
            <SimulationMode
              isActive={simulationActive}
              onToggle={setSimulationActive}
              rainfall={simulatedRainfall}
              onRainfallChange={setSimulatedRainfall}
              onReset={handleResetSimulation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}