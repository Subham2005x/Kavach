import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

// ===== IMPORT COMPONENTS =====
import LayerToggle from "@/components/map/LayerToggle";
import SimulationMode from "@/components/controls/SimulationMode";
import SafetyAdvisory from "@/components/panels/SafetyAdvisory";
import SafeZones from "@/components/panels/SafeZones";
import PreparednessChecklist from "@/components/panels/PreparednessChecklist";
import LocalNews from "@/components/panels/LocalNews";
import AlertSettings from "@/components/panels/AlertSettings";
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
  const [showAlertSettings, setShowAlertSettings] = useState(false);

  // Backend integration state
  const [riskData, setRiskData] = useState(null);
  const [aiExplanation, setAIExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [terrainProfile, setTerrainProfile] = useState([]);
  const [loadingStage, setLoadingStage] = useState("");

  /* ---------- DERIVED ---------- */
  const effectiveRainfall = simulationActive ? simulatedRainfall : 0;

  const currentRisk = useMemo(() => {
    // Use backend risk data if available
    if (riskData?.alert_level) {
      const level = riskData.alert_level.toLowerCase();
      // Map backend alert levels (RED/YELLOW/GREEN) to frontend risk levels
      if (level === "red") return "severe";
      if (level === "yellow") return "high";
      if (level === "green") return "low";
      return "moderate"; // fallback
    }
    
    // Fallback to client-side calculation when backend data not available
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
    <div className={`dashboard-container ${isLoading ? 'is-loading' : ''}`}>
      <header className="dashboard-header">
        {/* LEFT: Logo + Use My Location */}
        <div className="header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="header-logo">
            <div className="logo-icon">🛡</div>
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

          {/* Alert Bell */}
          <button
            onClick={() => setShowAlertSettings(true)}
            className="alert-bell-button"
            style={{
              background: 'rgba(251, 146, 60, 0.15)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: '#fb923c',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(251, 146, 60, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(251, 146, 60, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.3)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Alerts
          </button>

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

      {/* ================= MAIN CONTENT WITH FLEXBOX ROWS ================= */}
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
            {/* Hide all interactive elements below loading overlay */}
            <style>{`
              .dashboard-grid * {
                pointer-events: none !important;
              }
              .feature-card-body input,
              .feature-card-body [role="search"],
              .row-1-center input {
                display: none !important;
              }
            `}</style>
            <div className="loading-spinner"></div>
            <div style={{ textAlign: "center" }}>
              <div className="loading-title">Analyzing Location...</div>
              <div className="loading-stage">{loadingStage}</div>
              <div className="loading-subtitle">Please wait</div>
            </div>
          </div>
        )}

        {/* ===== ROW 1: Safe Zones + Map + Right Panel ===== */}
        <div className="row-1">
          {/* Safe Zones - Left */}
          <div className="row-1-left feature-card">
            <div className="feature-card-header">
              <span className="feature-card-icon">🛡️</span>
              <h2 className="feature-card-title">Safe Zones & Evacuation Routes</h2>
            </div>
            <div className="feature-card-body">
              <SafeZones location={selectedLocation} />
            </div>
          </div>

          {/* Interactive Map - Center */}
          <div className="row-1-center feature-card map-card">
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
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Right Panel - Risk Summary + Weather */}
          <div className="row-1-right">
            {/* Risk Summary - Top Right */}
            <div className="row-1-right-top feature-card">
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

            {/* Weather - Bottom Right */}
            <div className="row-1-right-bottom feature-card">
              <div className="feature-card-header">
                <span className="feature-card-icon">🌦️</span>
                <h2 className="feature-card-title">Weather Conditions</h2>
              </div>
              <div className="feature-card-body">
                <WeatherPanel simulatedRainfall={effectiveRainfall} location={selectedLocation} />
              </div>
            </div>
          </div>
        </div>

        {/* ===== ROW 2: Risk Metrics + Terrain + Hazard ===== */}
        <div className="row-2">
          {/* Risk Metrics - Left */}
          <div className="row-2-left feature-card">
            <div className="feature-card-header">
              <span className="feature-card-icon">📈</span>
              <h2 className="feature-card-title">Detailed Risk Metrics</h2>
            </div>
            <div className="feature-card-body">
              {riskData ? (
                <>
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

                  <div className="safety-advisory-section">
                    <SafetyAdvisory riskLevel={currentRisk} hasData={!!riskData} />
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  color: '#64748b',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📊</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#94a3b8' }}>
                    No Risk Data Available
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Select a location on the map to get detailed risk metrics
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terrain Elevation - Center */}
          <div className="row-2-center feature-card">
            <div className="feature-card-header">
              <span className="feature-card-icon">⛰️</span>
              <h2 className="feature-card-title">Terrain Elevation Profile</h2>
            </div>
            <div className="feature-card-body">
              <TerrainElevationChart terrainProfile={terrainProfile} location={selectedLocation} />
            </div>
          </div>

          {/* Hazard Radar - Right */}
          <div className="row-2-right feature-card">
            <div className="feature-card-header">
              <span className="feature-card-icon">📡</span>
              <h2 className="feature-card-title">Multi-Hazard Risk Profile</h2>
            </div>
            <div className="feature-card-body">
              <HazardRadarChart riskData={riskData} simulatedRainfall={effectiveRainfall} />
            </div>
          </div>
        </div>

        {/* ===== ROW 3: Rainfall + Map Layers + Simulation ===== */}
        <div className="row-3">
          {/* 24-Hour Rainfall - Left */}
          <div className="row-3-left feature-card">
            <div className="feature-card-header">
              <span className="feature-card-icon">🌧️</span>
              <h2 className="feature-card-title">24-Hour Rainfall Forecast</h2>
            </div>
            <div className="feature-card-body">
              <RainfallTrendChart 
                simulatedRainfall={effectiveRainfall} 
                location={selectedLocation}
              />
            </div>
          </div>

          {/* Map Layers - Center */}
          <div className="row-3-center feature-card">
            <div className="feature-card-header">
              <span className="feature-card-icon">🗺️</span>
              <h2 className="feature-card-title">Map Layers</h2>
            </div>
            <div className="feature-card-body">
              <LayerToggle layers={layers} onToggle={handleLayerToggle} />
            </div>
          </div>

          {/* Simulation Mode - Right */}
          <div className="row-3-right feature-card">
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

        {/* ===== ROW 4: Emergency Preparedness + AI Analysis (EQUAL WIDTH) ===== */}
        <div className="row-4">
          {/* Emergency Preparedness - Left (50% width) */}
          <div className="row-4-left feature-card">
            <div className="feature-card-header">
              <span className="feature-card-icon">✅</span>
              <h2 className="feature-card-title">Emergency Preparedness</h2>
            </div>
            <div className="feature-card-body">
              <PreparednessChecklist riskLevel={currentRisk} />
            </div>
          </div>

          {/* AI Analysis - Right (50% width) */}
          <div className="row-4-right feature-card">
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
                ) : aiExplanation ? (
                  aiExplanation
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    color: '#64748b',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🤖</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#94a3b8' }}>
                      No Analysis Available
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Select a location on the map to get AI-powered risk analysis
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== ROW 5: Local News (Full Width) ===== */}
        <div className="row-5">
          <div className="row-5-full feature-card">
            <div className="feature-card-header">
              <span className="feature-card-icon">📰</span>
              <h2 className="feature-card-title">Local Weather & Disaster News</h2>
            </div>
            <div className="feature-card-body">
              <LocalNews location={selectedLocation} />
            </div>
          </div>
        </div>
      </div>

      <AlertSettings 
        isOpen={showAlertSettings}
        onClose={() => setShowAlertSettings(false)}
        riskData={riskData}
        location={selectedLocation}
      />
    </div>
  );
}