import React, { useMemo } from "react";
import { Mountain } from "lucide-react";

const TerrainElevationChart = ({ terrainProfile = [], location }) => {
  const chartData = useMemo(() => {
    if (!terrainProfile || terrainProfile.length === 0) {
      return Array.from({ length: 10 }, (_, i) => ({
        x: i * 10,
        elevation: 1500 + Math.sin(i * 0.5) * 300 + Math.random() * 100,
      }));
    }

    return terrainProfile.map((elevation, index) => ({
      x: index * 10,
      elevation,
    }));
  }, [terrainProfile]);

  const maxElevation = Math.max(...chartData.map((d) => d.elevation));
  const minElevation = Math.min(...chartData.map((d) => d.elevation));
  const elevationRangeRaw = maxElevation - minElevation;
  const elevationRange = elevationRangeRaw === 0 ? 1 : elevationRangeRaw; // avoid divide-by-zero
  const avgElevation = chartData.reduce((sum, d) => sum + d.elevation, 0) / chartData.length;

  // Smaller SVG sizing
  const svgWidth = 360; // was 400
  const svgHeight = 170; // was 200
  const padding = 18; // was 20

  const xScale = (svgWidth - 2 * padding) / (chartData.length - 1);
  const yScale = (svgHeight - 2 * padding) / elevationRange;

  const pathPoints = chartData.map((point, index) => {
    const x = padding + index * xScale;
    const y = svgHeight - padding - (point.elevation - minElevation) * yScale;
    return `${x},${y}`;
  });

  const areaPath = `
    M ${padding},${svgHeight - padding}
    L ${pathPoints.join(" L ")}
    L ${svgWidth - padding},${svgHeight - padding}
    Z
  `;

  const linePath = `M ${pathPoints.join(" L ")}`;

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.4)",
        borderRadius: "12px",
        padding: "14px", // was 20px
        border: "1px solid rgba(30, 41, 59, 0.6)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px", // was 16px
        }}
      >
        <Mountain size={18} color="#60a5fa" /> {/* was 20 */}
        <h3
          style={{
            fontSize: "13px", // was 15px
            fontWeight: 600,
            color: "#e2e8f0",
            margin: 0,
          }}
        >
          Terrain Elevation Profile
        </h3>
      </div>

      {/* Stats (smaller) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px", // was 12px
          marginBottom: "14px", // was 20px
        }}
      >
        <div
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            padding: "7px", // was 8px
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "3px" }}>Max</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#60a5fa" }}>
            {maxElevation.toFixed(0)}m
          </div>
        </div>

        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            padding: "7px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "3px" }}>Avg</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#34d399" }}>
            {avgElevation.toFixed(0)}m
          </div>
        </div>

        <div
          style={{
            background: "rgba(251, 191, 36, 0.1)",
            padding: "7px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "3px" }}>Min</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#fbbf24" }}>
            {minElevation.toFixed(0)}m
          </div>
        </div>
      </div>

      {/* Chart (smaller) */}
      <div
        style={{
          background: "rgba(2, 6, 23, 0.5)",
          borderRadius: "8px",
          padding: "10px", // was 12px
          position: "relative",
        }}
      >
        <svg
          width="100%"
          height="190" // was 220
          viewBox={`0 0 ${svgWidth} ${svgHeight + 18}`}
          style={{ overflow: "visible" }}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i * (svgHeight - 2 * padding)) / 4;
            const elevation = maxElevation - (i * elevationRangeRaw) / 4;
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={svgWidth - padding}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="9" // was 10
                  textAnchor="end"
                >
                  {elevation.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#elevationGradient)" opacity="0.6" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2.2" // was 2.5
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = padding + index * xScale;
            const y = svgHeight - padding - (point.elevation - minElevation) * yScale;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3.2" // was 3.5
                fill="#3b82f6"
                stroke="#60a5fa"
                strokeWidth="2"
                style={{ cursor: "pointer" }}
              >
                <title>{`Point ${index + 1}: ${point.elevation.toFixed(0)}m`}</title>
              </circle>
            );
          })}

          {/* X-axis labels */}
          {chartData
            .filter((_, i) => i % 2 === 0)
            .map((point, index) => {
              const actualIndex = index * 2;
              const x = padding + actualIndex * xScale;
              return (
                <text
                  key={actualIndex}
                  x={x}
                  y={svgHeight + 5}
                  fill="#64748b"
                  fontSize="9" // was 10
                  textAnchor="middle"
                >
                  {point.x}m
                </text>
              );
            })}

          <defs>
            <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Info footer (smaller) */}
      <div
        style={{
          marginTop: "10px", // was 12px
          paddingTop: "10px", // was 12px
          borderTop: "1px solid rgba(30, 41, 59, 0.6)",
          fontSize: "10px", // was 11px
          color: "#94a3b8",
        }}
      >
        <div>Elevation Range: {elevationRangeRaw.toFixed(0)}m</div>
        <div style={{ marginTop: "3px" }}>Sample Points: {chartData.length}</div>
      </div>
    </div>
  );
};

export default TerrainElevationChart;
