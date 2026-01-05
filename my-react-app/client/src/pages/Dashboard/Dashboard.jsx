import React, { useState, useCallback, useMemo } from "react";

<<<<<<< HEAD
// ===== IMPORT COMPONENTS =====
import LayerToggle from "@/components/map/LayerToggle";
import SimulationMode from "@/components/controls/SimulationMode";
import SafetyAdvisory from "@/components/panels/SafetyAdvisory";
=======
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
>>>>>>> 1d77054754f168665480c5e7f645e822cf2a03ca

import RiskMap from "@/components/map/RiskMap";
import RiskSummaryPanel from "@/components/panels/RiskSummaryPanel";
import WeatherPanel from "@/components/panels/WeatherPanel";

// =============================
// DASHBOARD
// =============================
export default function Dashboard() {
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

  /* ---------- DERIVED ---------- */
  const effectiveRainfall = simulationActive ? simulatedRainfall : 0;

  const currentRisk = useMemo(() => {
    if (!selectedLocation) return "moderate";
    if (effectiveRainfall > 120) return "severe";
    if (effectiveRainfall > 80) return "high";
    return selectedLocation.riskLevel || "moderate";
  }, [selectedLocation, effectiveRainfall]);

  /* ---------- HANDLERS ---------- */
  const handleLayerToggle = useCallback((layerId) => {
    setLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  }, []);

  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
  }, []);

  const handleResetSimulation = useCallback(() => {
    setSimulatedRainfall(0);
    setSimulationActive(false);
  }, []);

  /* =============================
     RENDER
  ============================== */
  return (
<<<<<<< HEAD
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        gridTemplateRows: "64px 1fr",
        background: "#020617",
        color: "white",
      }}
    >
      {/* ================= TOP PANEL ================= */}
      <header
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          borderBottom: "1px solid #1e293b",
          background: "rgba(2,6,23,0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(16,185,129,0.15)",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>MountainGuard</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Disaster Risk Intelligence
=======
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">🏔️</div>
            <h2>Kavach</h2>
          </div>
          <button 
            className="mobile-close-btn" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a href="#" className="nav-item">
            <span className="icon">📈</span>
            <span>Analytics</span>
          </a>
          <a href="#" className="nav-item">
            <span className="icon">⚙️</span>
            <span>Settings</span>
          </a>
          <a href="#" className="nav-item">
            <span className="icon">👤</span>
            <span>Profile</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <h1>Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!</h1>
              <p>Here's what's happening with your account today.</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">
                    {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-info">
                <p className="user-name">{user?.displayName || 'User'}</p>
                <p className="user-email">{user?.email || 'No email'}</p>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Total Views</h3>
              <p className="stat-value">12,543</p>
              <span className="stat-change positive">+12.5%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Active Users</h3>
              <p className="stat-value">2,345</p>
              <span className="stat-change positive">+8.2%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Revenue</h3>
              <p className="stat-value">$45,231</p>
              <span className="stat-change negative">-3.1%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Rating</h3>
              <p className="stat-value">4.8/5</p>
              <span className="stat-change positive">+0.3</span>
>>>>>>> 1d77054754f168665480c5e7f645e822cf2a03ca
            </div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", color: "#34d399", fontSize: 14 }}>
          ● Live
        </div>
      </header>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 320px",
          gap: 16,
          padding: 16,
        }}
      >
        {/* ===== LEFT COLUMN ===== */}
        <aside
  style={{
    background: "rgba(15,23,42,0.7)",
    borderRadius: 12,
    padding: 16,
    overflowY: "auto",
  }}
>
  <LayerToggle layers={layers} onToggle={handleLayerToggle} />

  <div style={{ marginTop: 16 }}>
    <SimulationMode
      isActive={simulationActive}
      onToggle={setSimulationActive}
      rainfall={simulatedRainfall}
      onRainfallChange={setSimulatedRainfall}
      onReset={handleResetSimulation}
    />
  </div>

  <div style={{ marginTop: 16 }}>
    <SafetyAdvisory riskLevel={currentRisk} />
  </div>
</aside>


        {/* ===== CENTER COLUMN ===== */}
        <main
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #1e293b",
          }}
        >
          <RiskMap
            selectedLocation={selectedLocation}
            layers={layers}
            simulatedRainfall={effectiveRainfall}
            onLocationSelect={handleLocationSelect}
          />
        </main>

        {/* ===== RIGHT COLUMN ===== */}
        <aside
          style={{
            background: "rgba(15,23,42,0.7)",
            borderRadius: 12,
            padding: 16,
            overflowY: "auto",
          }}
        >
          <RiskSummaryPanel
            location={selectedLocation}
            simulatedRainfall={effectiveRainfall}
            riskLevel={currentRisk}
          />

          <div style={{ marginTop: 16 }}>
            <WeatherPanel simulatedRainfall={effectiveRainfall} />
          </div>
        </aside>
      </div>
    </div>
  );
}

