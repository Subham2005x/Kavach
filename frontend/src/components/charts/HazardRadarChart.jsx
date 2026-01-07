import React, { useMemo } from "react";
import { Activity } from "lucide-react";

const HazardRadarChart = ({ riskData, simulatedRainfall }) => {
  const hazardMetrics = useMemo(() => {
    if (riskData) {
      return [
        { name: "Landslide", value: riskData.landslide_risk || 0, color: "#ef4444" },
        { name: "Flood", value: riskData.flood_risk || 0, color: "#3b82f6" },
        { name: "Slope", value: Math.min((riskData.slope_calculated || 0) * 2, 100), color: "#f59e0b" },
        { name: "Rainfall", value: Math.min((simulatedRainfall || 0) / 2, 100), color: "#06b6d4" },
        { name: "Overall", value: ((riskData.landslide_risk + riskData.flood_risk) / 2) || 0, color: "#8b5cf6" },
      ];
    }

    return [
      { name: "Landslide", value: 45, color: "#ef4444" },
      { name: "Flood", value: 35, color: "#3b82f6" },
      { name: "Slope", value: 60, color: "#f59e0b" },
      { name: "Rainfall", value: 25, color: "#06b6d4" },
      { name: "Overall", value: 42, color: "#8b5cf6" },
    ];
  }, [riskData, simulatedRainfall]);

  // Smaller chart parameters
  const svgSize = 260;          // was 300
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const maxRadius = 85;         // was 100
  const levels = 5;
  const angleStep = (Math.PI * 2) / hazardMetrics.length;

  const radarPoints = hazardMetrics.map((metric, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (metric.value / 100) * maxRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y, angle, ...metric };
  });

  const radarPath =
    radarPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
      .join(" ") + " Z";

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
        <Activity size={18} color="#8b5cf6" /> {/* was 20 */}
        <h3
          style={{
            fontSize: "13px", // was 15px
            fontWeight: 600,
            color: "#e2e8f0",
            margin: 0,
          }}
        >
          Multi-Hazard Risk Profile
        </h3>
      </div>

      {/* Radar Chart */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "14px", // was 20px
        }}
      >
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {/* Background circles */}
          {Array.from({ length: levels }).map((_, i) => {
            const radius = maxRadius * ((i + 1) / levels);
            return (
              <circle
                key={i}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis lines */}
          {hazardMetrics.map((_, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const endX = centerX + maxRadius * Math.cos(angle);
            const endY = centerY + maxRadius * Math.sin(angle);
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth="1"
              />
            );
          })}

          {/* Radar area */}
          <path
            d={radarPath}
            fill="url(#radarGradient)"
            stroke="#8b5cf6"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Data points */}
          {radarPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4" // was 5
              fill={point.color}
              stroke="white"
              strokeWidth="2"
            >
              <title>{`${point.name}: ${point.value.toFixed(1)}%`}</title>
            </circle>
          ))}

          {/* Labels */}
          {radarPoints.map((point, index) => {
            const labelRadius = maxRadius + 24; // was +30
            const labelX = centerX + labelRadius * Math.cos(point.angle);
            const labelY = centerY + labelRadius * Math.sin(point.angle);

            return (
              <g key={`label-${index}`}>
                <text
                  x={labelX}
                  y={labelY}
                  fill="#cbd5e1"
                  fontSize="10" // was 11
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {point.name}
                </text>
                <text
                  x={labelX}
                  y={labelY + 12} // was 14
                  fill={point.color}
                  fontSize="12" // was 13
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {point.value.toFixed(0)}%
                </text>
              </g>
            );
          })}

          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "6px", // was 8px
          paddingTop: "10px", // was 12px
          borderTop: "1px solid rgba(30, 41, 59, 0.6)",
        }}
      >
        {hazardMetrics.map((metric, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px", // was 12px
            }}
          >
            <div
              style={{
                width: "10px", // was 12px
                height: "10px",
                borderRadius: "2px",
                background: metric.color,
              }}
            />
            <span style={{ color: "#94a3b8" }}>{metric.name}</span>
            <span style={{ marginLeft: "auto", color: metric.color, fontWeight: 700 }}>
              {metric.value.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HazardRadarChart;
