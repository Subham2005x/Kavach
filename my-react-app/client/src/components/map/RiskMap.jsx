import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin } from 'lucide-react';

const RiskMap = ({ onLocationSelect, selectedLocation, layers, simulatedRainfall }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sample locations for testing
  const sampleLocations = [
    { name: 'Kedarnath, Uttarakhand', lat: 30.7346, lng: 79.0669, risk: 'high' },
    { name: 'Manali, Himachal Pradesh', lat: 32.2432, lng: 77.1892, risk: 'moderate' },
    { name: 'Shimla, Himachal Pradesh', lat: 31.1048, lng: 77.1734, risk: 'moderate' },
    { name: 'Nainital, Uttarakhand', lat: 29.3919, lng: 79.4542, risk: 'low' },
    { name: 'Gangtok, Sikkim', lat: 27.3389, lng: 88.6065, risk: 'high' },
    { name: 'Darjeeling, West Bengal', lat: 27.0360, lng: 88.2627, risk: 'moderate' },
    { name: 'Dehradun, Uttarakhand', lat: 30.3165, lng: 78.0322, risk: 'moderate' },
    { name: 'Mussoorie, Uttarakhand', lat: 30.4598, lng: 78.0644, risk: 'moderate' },
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([28.5, 82], 5);

      // Use dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>',
        maxZoom: 19,
      }).addTo(map.current);

      // Add sample markers
      sampleLocations.forEach(location => {
        const riskColor = location.risk === 'high' ? '#ef4444' : 
                         location.risk === 'moderate' ? '#eab308' : '#22c55e';
        
        const icon = L.divIcon({
          html: `<div style="background-color: ${riskColor}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${riskColor}; border: 2px solid white;"></div>`,
          iconSize: [12, 12],
          className: ''
        });

        L.marker([location.lat, location.lng], { icon })
          .bindPopup(`<strong>${location.name}</strong><br/>Risk: ${location.risk}`)
          .on('click', () => onLocationSelect(location))
          .addTo(map.current);
      });
    }

    // Update marker when location changes
    if (selectedLocation) {
      if (markerRef.current) {
        map.current.removeLayer(markerRef.current);
      }

      const riskColor = selectedLocation.risk === 'high' ? '#ef4444' : 
                       selectedLocation.risk === 'moderate' ? '#eab308' : '#22c55e';

      const customIcon = L.divIcon({
        html: `<div style="background-color: ${riskColor}; width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 0 20px ${riskColor}; border: 3px solid white; animation: pulse 2s infinite;"></div>`,
        iconSize: [24, 24],
        className: 'selected-marker'
      });

      markerRef.current = L.marker(
        [selectedLocation.lat, selectedLocation.lng],
        { icon: customIcon }
      )
        .bindPopup(`<strong>${selectedLocation.name}</strong><br/>Risk: ${selectedLocation.risk}`)
        .addTo(map.current)
        .openPopup();

      map.current.flyTo([selectedLocation.lat, selectedLocation.lng], 10, { duration: 1.5 });
    }
  }, [selectedLocation]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const results = sampleLocations.filter(loc => 
        loc.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (location) => {
    onLocationSelect(location);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Search Bar */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}>
        <div style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '12px 16px',
          border: '1px solid rgba(51,65,85,0.8)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search style={{ width: 18, height: 18, color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f1f5f9',
                fontSize: 14,
                fontWeight: 500
              }}
            />
          </div>
          
          {isSearching && searchResults.length > 0 && (
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(51,65,85,0.5)',
              maxHeight: 200,
              overflowY: 'auto'
            }}>
              {searchResults.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocation(location)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    color: '#cbd5e1',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.2s ease',
                    marginBottom: 4
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(51,65,85,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <MapPin style={{ width: 14, height: 14, color: '#60a5fa' }} />
                  <span style={{ flex: 1 }}>{location.name}</span>
                  <span style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: location.risk === 'high' ? 'rgba(239,68,68,0.2)' :
                               location.risk === 'moderate' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)',
                    color: location.risk === 'high' ? '#fca5a5' :
                          location.risk === 'moderate' ? '#fde047' : '#86efac',
                    fontWeight: 600
                  }}>
                    {location.risk.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      />

      {/* Add CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .selected-marker {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default RiskMap;
