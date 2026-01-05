import React from 'react';
import { Cloud, CloudRain, Wind, Droplets } from 'lucide-react';

const WeatherPanel = ({ simulatedRainfall }) => {
  return (
    <div style={{
      background: 'rgba(30,41,59,0.6)',
      backdropFilter: 'blur(12px)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid rgba(51,65,85,0.5)'
    }}>
      <h3 style={{
        fontWeight: 600,
        color: '#f1f5f9',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 15,
        letterSpacing: '0.3px'
      }}>
        <Cloud style={{ width: 18, height: 18, color: '#60a5fa' }} />
        Weather Conditions
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))',
            borderRadius: 10,
            padding: 14,
            border: '1px solid rgba(59,130,246,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CloudRain style={{ width: 16, height: 16, color: '#60a5fa' }} />
              <p style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600 }}>Rainfall</p>
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#bfdbfe' }}>{simulatedRainfall || 45}mm</p>
            <p style={{ fontSize: 10, color: '#7dd3fc', marginTop: 4 }}>Last 24h</p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(148,163,184,0.2), rgba(100,116,139,0.15))',
            borderRadius: 10,
            padding: 14,
            border: '1px solid rgba(148,163,184,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Wind style={{ width: 16, height: 16, color: '#94a3b8' }} />
              <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>Wind Speed</p>
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>28 km/h</p>
            <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>SSW Direction</p>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))',
          borderRadius: 10,
          padding: 14,
          border: '1px solid rgba(59,130,246,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Droplets style={{ width: 16, height: 16, color: '#60a5fa' }} />
            <p style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600 }}>Humidity</p>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#bfdbfe' }}>78%</p>
          <div style={{
            width: '100%',
            background: 'rgba(15,23,42,0.5)',
            borderRadius: 6,
            height: 6,
            marginTop: 8,
            overflow: 'hidden',
            border: '1px solid rgba(51,65,85,0.5)'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              height: '100%',
              borderRadius: 6,
              width: '78%',
              boxShadow: '0 0 8px rgba(59,130,246,0.5)'
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
