import React, { useState, useEffect, useMemo } from 'react';
import { CloudRain } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RainfallTrendChart = ({ simulatedRainfall, location }) => {
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real weather forecast data
  useEffect(() => {
    const fetchForecast = async () => {
      const lat = location?.coordinates?.lat || location?.lat || 28.5;
      const lng = location?.coordinates?.lng || location?.lng || 82.0;

      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/weather_forecast?lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        
        if (data.status === 'success') {
          setForecastData(data.forecast);
        }
      } catch (error) {
        console.error('Weather forecast error:', error);
        setForecastData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
    // Refresh forecast every 30 minutes
    const interval = setInterval(fetchForecast, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  // Generate rainfall trend data (use real forecast or fallback to simulated)
  const trendData = useMemo(() => {
    const hours = 24;
    
    // If we have real forecast data, use it
    if (forecastData && forecastData.length > 0) {
      return forecastData.map((point, i) => ({
        hour: i,
        rainfall: point.rainfall || 0,
        accumulated: 0 // Will calculate below
      }));
    }
    
    // Fallback: Generate simulated data
    const baseRainfall = simulatedRainfall || 50;
    
    return Array.from({ length: hours }, (_, i) => {
      // Create a realistic rainfall pattern
      const variation = Math.sin(i * 0.3) * 20 + Math.random() * 15;
      const intensity = Math.max(0, baseRainfall + variation - (i * 2));
      
      return {
        hour: i,
        rainfall: intensity,
        accumulated: 0 // Will calculate below
      };
    });
  }, [forecastData, simulatedRainfall]);

  // Calculate accumulated rainfall
  let accumulated = 0;
  trendData.forEach(point => {
    accumulated += point.rainfall;
    point.accumulated = accumulated;
  });

  const maxRainfall = Math.max(...trendData.map(d => d.rainfall));
  const totalAccumulated = accumulated;

  // Chart dimensions
  const width = 300;
  const height = 190;
  const padding = 40;
  const chartWidth = width - 1 * padding;
  const chartHeight = height - 2 * padding;

  // Scales
  const xScale = chartWidth / (trendData.length - 1);
  const yScale = chartHeight / maxRainfall;

  // Create bar positions
  const bars = trendData.map((point, index) => ({
    x: padding + index * xScale,
    height: point.rainfall * yScale,
    rainfall: point.rainfall,
    hour: point.hour
  }));

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.4)',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid rgba(30, 41, 59, 0.6)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CloudRain size={20} color="#06b6d4" />
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#e2e8f0',
            margin: 0
          }}>
            Rainfall Forecast
          </h3>
          {isLoading && (
            <span style={{ fontSize: 10, color: '#64748b', marginLeft: 4 }}>
              Updating.
            </span>
          )}
          {!isLoading && forecastData && (
            <span style={{ fontSize: 10, color: '#22c55e', marginLeft: 4 }}>
              ● Live
            </span>
          )}
        </div>
        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#06b6d4'
        }}>
          Total: {totalAccumulated.toFixed(0)}mm
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          padding: '8px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
            {forecastData ? 'Now' : 'Current'}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#06b6d4' }}>
            {forecastData ? (forecastData[0]?.rainfall || 0).toFixed(1) : (simulatedRainfall || 50)}mm
          </div>
        </div>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '8px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Peak</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>
            {maxRainfall.toFixed(1)}mm
          </div>
        </div>
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          padding: '8px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Avg</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
            {(totalAccumulated / 24).toFixed(1)}mm
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: 'rgba(2, 6, 23, 0.5)',
        borderRadius: '8px',
        padding: '12px',
        overflowX: 'auto'
      }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i * chartHeight / 4);
            const value = maxRainfall * (1 - i / 4);
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                >
                  {value.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {bars.map((bar, index) => {
            const barWidth = xScale * 0.6;
            const intensity = bar.rainfall / maxRainfall;
            const color = intensity > 0.8 ? '#ef4444' : 
                         intensity > 0.5 ? '#f59e0b' : '#06b6d4';
            
            return (
              <g key={index}>
                <rect
                  x={bar.x - barWidth / 2}
                  y={height - padding - bar.height}
                  width={barWidth}
                  height={bar.height}
                  fill={color}
                  opacity="0.7"
                  rx="2"
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`Hour ${bar.hour}: ${bar.rainfall.toFixed(1)}mm`}</title>
                </rect>
              </g>
            );
          })}

          {/* X-axis labels */}
          {bars.filter((_, i) => i % 4 === 0).map((bar, index) => (
            <text
              key={index}
              x={bar.x}
              y={height - padding + 20}
              fill="#64748b"
              fontSize="10"
              textAnchor="middle"
            >
              {bar.hour}h
            </text>
          ))}

          {/* Axis labels */}
          <text
            x={padding - 30}
            y={padding - 10}
            fill="#94a3b8"
            fontSize="11"
            textAnchor="middle"
            transform={`rotate(-90, ${padding - 30}, ${padding - 10})`}
          >
            Rainfall (mm/h)
          </text>
        </svg>
      </div>

      {/* Risk indicator */}
      <div style={{
        marginTop: '12px',
        padding: '10px',
        borderRadius: '8px',
        background: maxRainfall > 100 ? 'rgba(239, 68, 68, 0.1)' :
                   maxRainfall > 60 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(34, 197, 94, 0.1)',
        borderLeft: `3px solid ${maxRainfall > 100 ? '#ef4444' : maxRainfall > 60 ? '#fbbf24' : '#22c55e'}`,
        fontSize: '14px',
        color: '#cbd5e1'
      }}>
        <strong>
          {maxRainfall > 100 ? '⚠️ Heavy Rainfall Warning' : 
           maxRainfall > 60 ? '⚡ Moderate Rainfall Expected' : '✓ Light Rainfall Predicted'}
        </strong>
        <div style={{ marginTop: '4px', fontSize: '14px', color: '#94a3b8' }}>
          {maxRainfall > 100 ? 'High risk of flash floods and landslides' :
           maxRainfall > 60 ? 'Monitor conditions closely' : 'Normal weather conditions'}
        </div>
      </div>
    </div>
  );
};

export default RainfallTrendChart;
