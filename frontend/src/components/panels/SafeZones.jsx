import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Hospital, Shield, ExternalLink } from 'lucide-react';

const SafeZones = ({ location }) => {
  const [safeZones, setSafeZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSafeZones = async () => {
      if (!location) {
        setSafeZones([]);
        return;
      }

      const lat = location?.coordinates?.lat || location?.lat;
      const lng = location?.coordinates?.lng || location?.lng;

      if (!lat || !lng) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8000/safe_zones?lat=${lat}&lon=${lng}&radius=5`
        );
        const data = await response.json();
        
        if (data.status === 'success') {
          setSafeZones(data.safe_zones || []);
        }
      } catch (error) {
        console.error('Safe zones error:', error);
        setSafeZones([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSafeZones();
  }, [location]);

  const getCategoryColor = (category) => {
    const colors = {
      'Hospital': { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.3)', text: '#7dd3fc' },
      'Police Station': { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
      'Fire Station': { bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.3)', text: '#fdba74' },
      'Shelter': { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#86efac' },
      'Assembly Point': { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', text: '#c4b5fd' },
    };
    return colors[category] || { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', text: '#cbd5e1' };
  };

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
        <Shield style={{ width: 18, height: 18, color: '#22c55e' }} />
        Safe Zones & Evacuation Points
        {isLoading && (
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>
            Loading...
          </span>
        )}
      </h3>

      {!location ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 20px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>🗺️</div>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#94a3b8' }}>
            No Location Selected
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Select a location to find nearby safe zones
          </div>
        </div>
      ) : safeZones.length === 0 && !isLoading ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '13px'
        }}>
          No safe zones found within 5km radius
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {safeZones.map((zone, index) => {
            const colors = getCategoryColor(zone.category);
            const hasCoordinates = zone.lat && zone.lon;
            const googleMapsUrl = hasCoordinates 
              ? `https://www.google.com/maps/dir/?api=1&destination=${zone.lat},${zone.lon}`
              : null;
            
            return (
              <div key={index} style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <div style={{ fontSize: '24px', flexShrink: 0 }}>{zone.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                    {zone.name}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.text, marginBottom: 4 }}>
                    {zone.category}
                  </div>
                  {zone.distance && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#94a3b8', marginBottom: 6 }}>
                      <Navigation style={{ width: 12, height: 12 }} />
                      {zone.distance} km away
                    </div>
                  )}
                  {googleMapsUrl ? (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 6,
                        color: '#60a5fa',
                        fontSize: '10px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.25))';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <MapPin style={{ width: 11, height: 11 }} />
                      Navigate
                      <ExternalLink style={{ width: 9, height: 9 }} />
                    </a>
                  ) : (
                    <div style={{
                      fontSize: '10px',
                      color: '#64748b',
                      fontStyle: 'italic',
                      marginTop: 2
                    }}>
                      Location available
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {safeZones.length > 0 && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid rgba(51,65,85,0.5)',
          fontSize: 11,
          color: '#64748b',
          textAlign: 'center'
        }}>
          Showing nearest safe zones within 5km
        </div>
      )}
    </div>
  );
};

export default SafeZones;
