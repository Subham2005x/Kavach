import React, { useState, useEffect, useRef } from 'react';

const RiskMap = ({
  onLocationSelect,
  selectedLocation,
  layers,
  simulatedRainfall = 0,
  riskData = null,
  isLoading = false,
}) => {
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);

  const activeLayers = Object.entries(layers || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  // Handle map click for location selection
  const handleMapClick = (e) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Simulate location based on click
    const mockLocation = {
      name: `Location (${Math.round(x)}, ${Math.round(y)})`,
      coordinates: { 
        lat: (Math.random() * 180) - 90, 
        lng: (Math.random() * 360) - 180 
      },
      riskLevel: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
    };

    setPopupPosition({ x, y });
    setPopupVisible(true);
    onLocationSelect?.(mockLocation);
  };

  // Close popup when clicking outside
  const handleClosePopup = (e) => {
    e.stopPropagation();
    setPopupVisible(false);
  };

  // Auto-show popup when location is selected
  useEffect(() => {
    if (selectedLocation) {
      setPopupVisible(true);
    }
  }, [selectedLocation]);

  return (
    <div 
      ref={mapRef}
      onClick={handleMapClick}
      className={`relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-slate-700 cursor-crosshair ${isLoading ? 'is-loading-map' : ''}`}
    >

      {/* Grid Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Map Search Bar - Hidden during loading */}
      {!isLoading && (
        <div className="absolute top-0 left-0 right-0 p-4 z-20 pointer-events-auto">
          <div className="relative w-full max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search locations (cities, mountains, villages)..."
              className="w-full px-4 py-2 bg-slate-800/40 border border-slate-600/50 rounded-lg text-slate-300 placeholder-slate-500"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <circle cx="11" cy="11" r="8"></circle>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-4">

        <h3 className="text-xl font-bold text-slate-200 mb-1">
          Risk Assessment Map
        </h3>

        {!selectedLocation ? (
          <p className="text-slate-400 text-sm mb-4">
            Click on map to select a location or search for a location
          </p>
        ) : (
          <p className="text-slate-400 text-sm mb-4">
            Showing risk overview for{' '}
            <span className="font-semibold text-slate-200">
              {selectedLocation.name}
            </span>
          </p>
        )}

        {/* Simulated Rainfall Indicator */}
        {simulatedRainfall > 0 && (
          <div className="mb-3 inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium border border-blue-500/30">
            Simulated Rainfall: {simulatedRainfall} mm
          </div>
        )}

        {/* Active Layers */}
        {activeLayers.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-300">
            {activeLayers.map((layer) => (
              <span
                key={layer}
                className="px-2 py-1 bg-slate-700/50 rounded border border-slate-600"
              >
                {layer}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Location Marker */}
      {selectedLocation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Pulsing marker */}
            <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
            {/* Pulse animation */}
            <div className="absolute -inset-4 bg-red-500 rounded-full opacity-20 animate-pulse" />
          </div>
        </div>
      )}

      {/* Location Popup */}
      {selectedLocation && popupVisible && (
        <div
          className="absolute bg-white rounded-lg shadow-2xl z-50 pointer-events-auto"
          style={{
            left: '50%',
            top: '20%',
            transform: 'translateX(-50%)',
            minWidth: '220px',
            maxWidth: '280px',
            padding: '10px 12px',
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClosePopup}
            className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition z-51 shadow-md text-xs"
            aria-label="Close"
          >
            <span className="text-gray-600 font-bold">×</span>
          </button>

          {/* Popup Content */}
          <div className="space-y-1">
            {/* Location Name */}
            <h4 className="font-bold text-gray-900 text-xs">
              {selectedLocation.name}
            </h4>

            {/* Coordinates */}
            <p className="text-xs text-gray-600 leading-tight">
              Lat: {selectedLocation.coordinates.lat.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 leading-tight">
              Lng: {selectedLocation.coordinates.lng.toFixed(2)}
            </p>

            {/* Risk Level */}
            {selectedLocation.riskLevel && (
              <div className="pt-1 border-t border-gray-200">
                <p className={`text-xs font-bold ${
                  selectedLocation.riskLevel === 'high' ? 'text-red-600' :
                  selectedLocation.riskLevel === 'moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {selectedLocation.riskLevel.toUpperCase()}
                </p>
              </div>
            )}

            {/* Risk Data if available */}
            {riskData && (
              <div className="pt-1 border-t border-gray-200">
                <p className="text-xs text-gray-700">
                  <span className="text-gray-600">Landslide: </span>
                  <span className="font-bold text-red-600">{riskData.landslide_risk}%</span>
                </p>
                <p className="text-xs text-gray-700">
                  <span className="text-gray-600">Flood: </span>
                  <span className="font-bold text-blue-600">{riskData.flood_risk}%</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMap;