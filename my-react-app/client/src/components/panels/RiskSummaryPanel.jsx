import React from 'react';
import { AlertCircle } from 'lucide-react';

const RiskSummaryPanel = ({ location, simulatedRainfall, riskLevel }) => {
  const getRiskColor = (risk) => {
    switch(risk?.toLowerCase()) {
      case 'severe':
        return { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.4)', text: '#fca5a5', glow: '0 0 20px rgba(239,68,68,0.3)' };
      case 'high':
        return { bg: 'rgba(251,146,60,0.2)', border: 'rgba(251,146,60,0.4)', text: '#fdba74', glow: '0 0 20px rgba(251,146,60,0.3)' };
      case 'moderate':
        return { bg: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.4)', text: '#fde047', glow: '0 0 20px rgba(234,179,8,0.3)' };
      case 'low':
        return { bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.4)', text: '#86efac', glow: '0 0 20px rgba(34,197,94,0.3)' };
      default:
        return { bg: 'rgba(100,116,139,0.2)', border: 'rgba(100,116,139,0.4)', text: '#cbd5e1', glow: 'none' };
    }
  };

  const colors = getRiskColor(riskLevel);

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
        <AlertCircle style={{ width: 18, height: 18, color: '#60a5fa' }} />
        Risk Summary
      </h3>
      {location ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Location</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{location.name}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Risk Level</p>
            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: 8,
              background: colors.bg,
              border: `1.5px solid ${colors.border}`,
              fontSize: 13,
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '0.5px',
              boxShadow: colors.glow
            }}>
              {riskLevel?.toUpperCase() || 'MODERATE'}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Coordinates</p>
            <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace', background: 'rgba(15,23,42,0.5)', padding: '6px 10px', borderRadius: 6, display: 'inline-block' }}>
              {location.lat?.toFixed(4)}, {location.lng?.toFixed(4)}
            </p>
          </div>
          {simulatedRainfall > 0 && (
            <div style={{
              paddingTop: 16,
              borderTop: '1px solid rgba(51,65,85,0.5)',
              marginTop: 4
            }}>
              <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Simulated Rainfall</p>
              <div style={{
                width: '100%',
                background: 'rgba(15,23,42,0.6)',
                borderRadius: 6,
                height: 8,
                overflow: 'hidden',
                border: '1px solid rgba(51,65,85,0.5)'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  height: '100%',
                  borderRadius: 6,
                  width: `${Math.min((simulatedRainfall/500)*100, 100)}%`,
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px rgba(59,130,246,0.5)'
                }}></div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', marginTop: 8 }}>{simulatedRainfall}mm / 500mm</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📍</div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Search for a location to view risk details</p>
        </div>
      )}
    </div>
  );
};

export default RiskSummaryPanel;
