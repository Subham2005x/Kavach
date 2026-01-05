import React, { useState, useCallback, useMemo } from "react";

// ===== IMPORT COMPONENTS =====
import LayerToggle from "@/components/map/LayerToggle";
import SimulationMode from "@/components/controls/SimulationMode";
import SafetyAdvisory from "@/components/panels/SafetyAdvisory";
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

