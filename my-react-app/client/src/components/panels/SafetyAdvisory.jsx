import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

const SafetyAdvisory = ({ riskLevel }) => {
  const advisories = {
    severe: [
      'Avoid mountainous and elevated terrain',
      'Monitor weather updates closely',
      'Prepare emergency evacuation routes',
      'Keep emergency supplies ready',
    ],
    high: [
      'Avoid mountainous and elevated terrain',
      'Monitor weather updates closely',
      'Prepare emergency evacuation routes',
      'Keep emergency supplies ready',
    ],
    moderate: [
      'Stay alert to weather changes',
      'Review evacuation procedures',
      'Keep communication channels open',
      'Avoid unnecessary travel',
    ],
    low: [
      'Continue normal activities',
      'Monitor weather forecasts',
      'Maintain emergency preparedness',
    ],
  };

  const currentAdvisories = advisories[riskLevel?.toLowerCase()] || advisories.moderate;
  
  const riskColors = {
    severe: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5', accent: '#ef4444' },
    high: { bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)', text: '#fdba74', accent: '#fb923c' },
    moderate: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', text: '#fde047', accent: '#eab308' },
    low: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#86efac', accent: '#22c55e' }
  };
  
  const colors = riskColors[riskLevel?.toLowerCase()] || riskColors.moderate;

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
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 15,
        letterSpacing: '0.3px'
      }}>
        <Shield style={{ width: 18, height: 18, color: colors.accent }} />
        Safety Advisory
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {currentAdvisories.map((advisory, index) => (
          <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircle style={{ width: 16, height: 16, color: colors.accent, flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{advisory}</p>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid rgba(51,65,85,0.5)',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 10
      }}>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Risk Level: <span style={{ fontWeight: 700, color: colors.text, letterSpacing: '0.5px' }}>{riskLevel?.toUpperCase() || 'MODERATE'}</span></p>
      </div>
    </div>
  );
};

export default SafetyAdvisory;
