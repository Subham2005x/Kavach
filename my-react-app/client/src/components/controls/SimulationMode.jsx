import React from 'react';
import { Cloud, RotateCcw } from 'lucide-react';

const SimulationMode = ({ isActive, onToggle, rainfall, onRainfallChange, onReset }) => {
  return (
    <div style={{
      background: 'rgba(30,41,59,0.6)',
      backdropFilter: 'blur(12px)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid rgba(51,65,85,0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{
          fontWeight: 600,
          color: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 15,
          letterSpacing: '0.3px'
        }}>
          <Cloud style={{ width: 18, height: 18, color: '#60a5fa' }} />
          Simulation Mode
        </h3>
        <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={() => onToggle(!isActive)}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          />
          <div style={{
            width: 44,
            height: 24,
            background: isActive ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(51,65,85,0.8)',
            borderRadius: 12,
            position: 'relative',
            transition: 'all 0.3s ease',
            boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.4)' : 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: 2,
              left: isActive ? 22 : 2,
              width: 20,
              height: 20,
              background: 'white',
              borderRadius: '50%',
              transition: 'left 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </div>
        </label>
      </div>
      {isActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#cbd5e1',
              display: 'block',
              marginBottom: 8
            }}>
              Rainfall: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{rainfall}mm</span>
            </label>
            <input
              type="range"
              min="0"
              max="500"
              value={rainfall}
              onChange={(e) => onRainfallChange(Number(e.target.value))}
              style={{
                width: '100%',
                height: 6,
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(rainfall/500)*100}%, rgba(51,65,85,0.5) ${(rainfall/500)*100}%, rgba(51,65,85,0.5) 100%)`,
                borderRadius: 3,
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
              <span>0mm</span>
              <span>500mm</span>
            </div>
          </div>
          <button
            onClick={onReset}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'rgba(51,65,85,0.6)',
              border: '1px solid rgba(71,85,105,0.5)',
              color: '#e2e8f0',
              fontWeight: 500,
              fontSize: 13,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(71,85,105,0.6)';
              e.currentTarget.style.borderColor = 'rgba(100,116,139,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(51,65,85,0.6)';
              e.currentTarget.style.borderColor = 'rgba(71,85,105,0.5)';
            }}
          >
            <RotateCcw style={{ width: 14, height: 14 }} />
            Reset Simulation
          </button>
          <div style={{
            background: 'rgba(37,99,235,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: '#bfdbfe'
          }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Simulation Active</p>
            <p style={{ color: '#93c5fd' }}>Adjust rainfall to see updated risk assessments in real-time.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationMode;
