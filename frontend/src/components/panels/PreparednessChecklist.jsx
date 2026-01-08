import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, Circle } from 'lucide-react';

const PreparednessChecklist = ({ riskLevel = 'moderate' }) => {
  const [checkedItems, setCheckedItems] = useState({});

  const checklistItems = {
    severe: [
      { id: 1, text: 'Prepare emergency evacuation bag', category: 'Immediate' },
      { id: 2, text: 'Identify nearest safe zones and evacuation routes', category: 'Immediate' },
      { id: 3, text: 'Charge all communication devices fully', category: 'Immediate' },
      { id: 4, text: 'Store drinking water (3 days supply)', category: 'Immediate' },
      { id: 5, text: 'Keep important documents in waterproof bag', category: 'Immediate' },
      { id: 6, text: 'Stock emergency food supplies', category: 'Essential' },
      { id: 7, text: 'Prepare first aid kit', category: 'Essential' },
      { id: 8, text: 'Keep flashlight and batteries ready', category: 'Essential' },
    ],
    high: [
      { id: 1, text: 'Review emergency evacuation plan', category: 'Important' },
      { id: 2, text: 'Check emergency supply kit', category: 'Important' },
      { id: 3, text: 'Keep phone charged at all times', category: 'Important' },
      { id: 4, text: 'Monitor weather updates regularly', category: 'Important' },
      { id: 5, text: 'Inform family about safety procedures', category: 'Essential' },
      { id: 6, text: 'Keep important documents accessible', category: 'Essential' },
    ],
    moderate: [
      { id: 1, text: 'Review family emergency contact list', category: 'Recommended' },
      { id: 2, text: 'Check emergency supply expiry dates', category: 'Recommended' },
      { id: 3, text: 'Ensure first aid kit is complete', category: 'Recommended' },
      { id: 4, text: 'Test emergency communication devices', category: 'Recommended' },
      { id: 5, text: 'Update emergency contact information', category: 'Optional' },
    ],
    low: [
      { id: 1, text: 'Maintain emergency preparedness awareness', category: 'General' },
      { id: 2, text: 'Keep emergency contacts updated', category: 'General' },
      { id: 3, text: 'Review disaster safety guidelines', category: 'General' },
    ],
  };

  const items = checklistItems[riskLevel?.toLowerCase()] || checklistItems.moderate;

  const toggleItem = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Immediate': '#ef4444',
      'Essential': '#f59e0b',
      'Important': '#eab308',
      'Recommended': '#22c55e',
      'Optional': '#3b82f6',
      'General': '#6366f1',
    };
    return colors[category] || '#94a3b8';
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div style={{
      background: 'rgba(30,41,59,0.6)',
      backdropFilter: 'blur(12px)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid rgba(51,65,85,0.5)',
      maxHeight: 500,
      overflowY: 'auto'
    }}
    className="custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
          border: 2px solid rgba(30, 41, 59, 0.6);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
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
        <ClipboardCheck style={{ width: 18, height: 18, color: '#3b82f6' }} />
        Emergency Preparedness Checklist
      </h3>

      {/* Progress Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: '11px',
          color: '#94a3b8'
        }}>
          <span>Progress</span>
          <span>{completedCount} / {items.length} completed</span>
        </div>
        <div style={{
          width: '100%',
          height: 10,
          background: 'rgba(15,23,42,0.6)',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid rgba(51,65,85,0.5)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: progress === 100 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #3b82f6, #2563eb)',
            borderRadius: 6,
            transition: 'width 0.5s ease',
            boxShadow: progress > 0 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
          }}></div>
        </div>
      </div>

      {/* Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => {
          const isChecked = checkedItems[item.id];
          const categoryColor = getCategoryColor(item.category);
          
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                background: isChecked 
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.1))' 
                  : 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,42,0.4))',
                border: `1px solid ${isChecked ? 'rgba(34,197,94,0.35)' : 'rgba(51,65,85,0.5)'}`,
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: isChecked ? 0.75 : 1
              }}
              onMouseEnter={(e) => {
                if (!isChecked) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,41,59,0.6), rgba(15,23,42,0.5))';
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isChecked) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,42,0.4))';
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)';
                }
              }}
            >
              {isChecked ? (
                <CheckCircle2 style={{ width: 18, height: 18, color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
              ) : (
                <Circle style={{ width: 18, height: 18, color: '#64748b', flexShrink: 0, marginTop: 2 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  color: isChecked ? '#94a3b8' : '#e2e8f0',
                  lineHeight: 1.5,
                  textDecoration: isChecked ? 'line-through' : 'none'
                }}>
                  {item.text}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: categoryColor,
                  marginTop: 4,
                  fontWeight: 600
                }}>
                  {item.category}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid rgba(51,65,85,0.5)',
        fontSize: 11,
        color: '#64748b',
        textAlign: 'center'
      }}>
        Risk Level: <span style={{ fontWeight: 600, color: '#93c5fd' }}>{riskLevel?.toUpperCase()}</span>
      </div>
    </div>
  );
};

export default PreparednessChecklist;
