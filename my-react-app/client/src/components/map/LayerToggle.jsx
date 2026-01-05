import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const LayerToggle = ({ layers, onToggle }) => {
  const layerDefinitions = [
    { id: 'landslide', name: 'Landslide Risk', icon: '🏔️' },
    { id: 'flood', name: 'Flood Risk', icon: '🌊' },
    { id: 'rivers', name: 'River Networks', icon: '💧' },
    { id: 'elevation', name: 'Elevation', icon: '📋' },
  ];

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
        fontSize: 15,
        letterSpacing: '0.3px'
      }}>Map Layers</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {layerDefinitions.map(layer => (
          <button
            key={layer.id}
            onClick={() => onToggle(layer.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '12px 8px',
              borderRadius: 10,
              background: layers[layer.id] 
                ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.25))'
                : 'rgba(30,41,59,0.4)',
              border: layers[layer.id]
                ? '1.5px solid rgba(96,165,250,0.5)'
                : '1px solid rgba(51,65,85,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: layers[layer.id] ? '0 4px 12px rgba(59,130,246,0.2)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!layers[layer.id]) {
                e.currentTarget.style.background = 'rgba(51,65,85,0.6)';
                e.currentTarget.style.borderColor = 'rgba(71,85,105,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!layers[layer.id]) {
                e.currentTarget.style.background = 'rgba(30,41,59,0.4)';
                e.currentTarget.style.borderColor = 'rgba(51,65,85,0.3)';
              }
            }}
          >
            <div style={{ fontSize: 24 }}>{layer.icon}</div>
            <span style={{
              fontSize: 11,
              color: layers[layer.id] ? '#e0f2fe' : '#94a3b8',
              fontWeight: 500,
              textAlign: 'center'
            }}>{layer.name}</span>
            {layers[layer.id] ? (
              <Eye style={{ width: 14, height: 14, color: '#60a5fa' }} />
            ) : (
              <EyeOff style={{ width: 14, height: 14, color: '#475569' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerToggle;
