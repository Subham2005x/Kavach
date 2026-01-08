import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, X, Navigation, Satellite, Map as MapIcon } from 'lucide-react';

const RiskMap = ({ onLocationSelect, selectedLocation, layers, simulatedRainfall, riskData }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerRef = useRef(null);
  const safeZoneCircleRef = useRef(null);
  const dangerZoneCircleRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const tileLayerRef = useRef(null);
  const labelLayerRef = useRef(null); // For satellite view labels
  const layerGroupsRef = useRef({
    landslide: null,
    flood: null,
    rivers: null,
    elevation: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [clickNotification, setClickNotification] = useState(null);

  // Sample locations for quick access
  const sampleLocations = [
    { name: 'Kedarnath, Uttarakhand', lat: 30.7346, lng: 79.0669, risk: 'high', type: 'preset' },
    { name: 'Manali, Himachal Pradesh', lat: 32.2432, lng: 77.1892, risk: 'moderate', type: 'preset' },
    { name: 'Shimla, Himachal Pradesh', lat: 31.1048, lng: 77.1734, risk: 'moderate', type: 'preset' },
    { name: 'Nainital, Uttarakhand', lat: 29.3919, lng: 79.4542, risk: 'low', type: 'preset' },
    { name: 'Gangtok, Sikkim', lat: 27.3389, lng: 88.6065, risk: 'high', type: 'preset' },
    { name: 'Darjeeling, West Bengal', lat: 27.0360, lng: 88.2627, risk: 'moderate', type: 'preset' },
    { name: 'Dehradun, Uttarakhand', lat: 30.3165, lng: 78.0322, risk: 'moderate', type: 'preset' },
    { name: 'Mussoorie, Uttarakhand', lat: 30.4598, lng: 78.0644, risk: 'moderate', type: 'preset' },
  ];

  // Geocoding search using Nominatim API
  const searchLocation = useCallback(async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setShowDropdown(true);

    try {
      // First, check preset locations
      const presetResults = sampleLocations
        .filter(loc => loc.name.toLowerCase().includes(query.toLowerCase()))
        .map(loc => ({ ...loc, source: 'preset' }));

      // Then search using Nominatim API for real locations
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=in` // Focus on India for mountain regions
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      
      const nominatimResults = data.map(result => ({
        name: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        type: result.type,
        risk: 'moderate', // Default risk, will be calculated by backend
        source: 'nominatim',
        coordinates: { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
      }));

      // Combine preset and API results
      const combinedResults = [...presetResults, ...nominatimResults];
      setSearchResults(combinedResults);
      
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to preset locations only
      const presetResults = sampleLocations.filter(loc => 
        loc.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(presetResults);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const handleSearchInput = (query) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query);
    }, 300); // Wait 300ms after user stops typing
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([28.5, 82], 5);

      // Use dark tile layer by default
      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>',
        maxZoom: 19,
      }).addTo(map.current);

      // Initialize layer groups
      layerGroupsRef.current.landslide = L.layerGroup().addTo(map.current);
      layerGroupsRef.current.flood = L.layerGroup().addTo(map.current);
      layerGroupsRef.current.rivers = L.layerGroup();
      layerGroupsRef.current.elevation = L.layerGroup();

      // Add landslide risk zones (simulated high-risk mountain areas)
      const landslideZones = [
        { center: [30.7346, 79.0669], radius: 8000, name: 'Kedarnath Zone', risk: 'High' },
        { center: [32.2432, 77.1892], radius: 10000, name: 'Manali Region', risk: 'Moderate' },
        { center: [27.0360, 88.2627], radius: 12000, name: 'Darjeeling Hills', risk: 'High' },
        { center: [30.4598, 78.0644], radius: 7000, name: 'Mussoorie Area', risk: 'Moderate' },
      ];

      landslideZones.forEach(zone => {
        L.circle(zone.center, {
          radius: zone.radius,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.3,
          weight: 2,
          dashArray: '5, 5'
        })
          .bindPopup(`<strong>🏔️ ${zone.name}</strong><br/>Landslide Risk: ${zone.risk}`)
          .addTo(layerGroupsRef.current.landslide);
      });

      // Add flood risk zones (river valleys and low-lying areas)
      const floodZones = [
        { center: [30.3165, 78.0322], radius: 15000, name: 'Dehradun Valley', risk: 'Moderate' },
        { center: [27.3389, 88.6065], radius: 9000, name: 'Gangtok Basin', risk: 'High' },
        { center: [29.3919, 79.4542], radius: 11000, name: 'Nainital Lake Area', risk: 'Moderate' },
        { center: [31.1048, 77.1734], radius: 8000, name: 'Shimla Region', risk: 'Low' },
      ];

      floodZones.forEach(zone => {
        L.circle(zone.center, {
          radius: zone.radius,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.25,
          weight: 2,
          dashArray: '3, 7'
        })
          .bindPopup(`<strong>🌊 ${zone.name}</strong><br/>Flood Risk: ${zone.risk}`)
          .addTo(layerGroupsRef.current.flood);
      });

      // Add river networks with more realistic paths
      const rivers = [
        { 
          path: [
            [30.8, 79.1], [30.7, 79.0], [30.6, 78.9], [30.5, 78.8], 
            [30.4, 78.7], [30.3, 78.6], [30.2, 78.5]
          ], 
          name: 'Alaknanda River (flows through Kedarnath)' 
        },
        { 
          path: [
            [32.4, 76.9], [32.3, 77.1], [32.2, 77.2], [32.1, 77.4], 
            [32.0, 77.5], [31.9, 77.7], [31.8, 77.8]
          ], 
          name: 'Beas River (flows through Manali-Kullu)' 
        },
        { 
          path: [
            [27.8, 88.2], [27.7, 88.4], [27.6, 88.5], [27.5, 88.6], 
            [27.4, 88.7], [27.3, 88.8], [27.2, 88.9]
          ], 
          name: 'Teesta River (flows through Sikkim)' 
        },
        { 
          path: [
            [30.4, 78.1], [30.3, 78.0], [30.2, 78.0], [30.1, 78.1], 
            [30.0, 78.2], [29.9, 78.3]
          ], 
          name: 'Tons River (tributary near Dehradun)' 
        },
      ];

      rivers.forEach(river => {
        L.polyline(river.path, {
          color: '#22d3ee',
          weight: 5,
          opacity: 1,
          smoothFactor: 1
        })
          .bindPopup(`<strong>💧 ${river.name}</strong>`)
          .addTo(layerGroupsRef.current.rivers);
      });

      // Add elevation contours
      const elevationContours = [
        { center: [30.7, 79.0], radius: 20000, elevation: '3000m+', color: '#7c3aed' },
        { center: [32.2, 77.2], radius: 18000, elevation: '2500m+', color: '#8b5cf6' },
        { center: [27.0, 88.3], radius: 16000, elevation: '2000m+', color: '#a78bfa' },
      ];

      elevationContours.forEach(contour => {
        L.circle(contour.center, {
          radius: contour.radius,
          color: contour.color,
          fillColor: contour.color,
          fillOpacity: 0.15,
          weight: 3,
          dashArray: '10, 10'
        })
          .bindPopup(`<strong>📋 Elevation: ${contour.elevation}</strong>`)
          .addTo(layerGroupsRef.current.elevation);
      });

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

      // Add click event to map - analyze any clicked location
      map.current.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        // Show notification
        setClickNotification(`Analyzing location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setTimeout(() => setClickNotification(null), 3000);
        
        // Reverse geocode to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `lat=${lat}&lon=${lng}&format=json&zoom=10`
          );
          const data = await response.json();
          
          const locationName = data.display_name || 
            data.address?.village || 
            data.address?.town || 
            data.address?.city || 
            data.address?.county || 
            `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          const clickedLocation = {
            name: locationName,
            lat: lat,
            lng: lng,
            risk: 'moderate',
            coordinates: { lat, lng },
            source: 'map-click'
          };

          onLocationSelect(clickedLocation);
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Fallback - use coordinates as name
          const clickedLocation = {
            name: `Clicked Location`,
            lat: lat,
            lng: lng,
            risk: 'moderate',
            coordinates: { lat, lng },
            source: 'map-click'
          };
          onLocationSelect(clickedLocation);
        }
      });
    }

    // Update marker when location changes
    if (selectedLocation) {
      if (markerRef.current) {
        map.current.removeLayer(markerRef.current);
      }

      // Determine color based on risk level from backend or default
      let riskColor;
      let riskLabel;
      if (riskData?.alert_level) {
        // Use actual backend risk data
        if (riskData.alert_level === 'RED') {
          riskColor = '#ef4444'; // Red for high risk
          riskLabel = 'HIGH RISK';
        } else if (riskData.alert_level === 'YELLOW') {
          riskColor = '#eab308'; // Yellow for moderate risk
          riskLabel = 'MODERATE';
        } else {
          riskColor = '#22c55e'; // Green for low risk
          riskLabel = 'LOW RISK';
        }
      } else {
        // Default color while analyzing
        riskColor = '#3b82f6'; // Blue for analyzing
        riskLabel = 'ANALYZING...';
      }

      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${riskColor}; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            box-shadow: 0 0 20px ${riskColor}, 0 4px 12px rgba(0,0,0,0.3); 
            border: 4px solid white; 
            animation: pulse 2s infinite;
            position: relative;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 12px;
              height: 12px;
              background-color: white;
              border-radius: 50%;
              opacity: 0.9;
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16], // Center the icon at the coordinate (half of iconSize)
        popupAnchor: [0, -16], // Position popup above the marker
        className: 'selected-marker'
      });

      const popupContent = selectedLocation.source === 'map-click' 
        ? `<div style="min-width: 200px;">
           <strong style="font-size: 14px;">${selectedLocation.name}</strong><br/>
           <span style="color: #64748b; font-size: 12px;">
             Lat: ${selectedLocation.lat.toFixed(4)} | Lng: ${selectedLocation.lng.toFixed(4)}
           </span><br/>
           <div style="margin-top: 8px; padding: 6px; background: ${riskColor}15; border-left: 3px solid ${riskColor}; border-radius: 4px;">
             <strong style="color: ${riskColor}; font-size: 13px;">${riskLabel}</strong>
             ${riskData?.landslide_risk ? `<br/><span style="font-size: 12px;">Landslide: ${riskData.landslide_risk}%</span>` : ''}
           </div>
           </div>`
        : `<strong>${selectedLocation.name}</strong>`;

      markerRef.current = L.marker(
        [selectedLocation.lat, selectedLocation.lng],
        { icon: customIcon }
      )
        .bindPopup(popupContent)
        .addTo(map.current)
        .openPopup();

      map.current.flyTo([selectedLocation.lat, selectedLocation.lng], 10, { duration: 1.5 });
    }

    // Update risk zone circles based on backend data
    if (selectedLocation && riskData) {
      // Remove existing circles
      if (safeZoneCircleRef.current) {
        map.current.removeLayer(safeZoneCircleRef.current);
        safeZoneCircleRef.current = null;
      }
      if (dangerZoneCircleRef.current) {
        map.current.removeLayer(dangerZoneCircleRef.current);
        dangerZoneCircleRef.current = null;
      }

      // Add danger zone circle (inner circle - evacuation radius)
      if (riskData.alert_level === 'RED' || riskData.alert_level === 'YELLOW') {
        const dangerRadius = riskData.alert_level === 'RED' ? 2000 : 1000; // 2km for RED, 1km for YELLOW
        dangerZoneCircleRef.current = L.circle([selectedLocation.lat, selectedLocation.lng], {
          radius: dangerRadius,
          color: riskData.alert_level === 'RED' ? '#ef4444' : '#f59e0b',
          fillColor: riskData.alert_level === 'RED' ? '#ef4444' : '#f59e0b',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '10, 5'
        }).addTo(map.current);
        
        dangerZoneCircleRef.current.bindPopup(
          `<strong>Danger Zone</strong><br/>` +
          `Radius: ${dangerRadius/1000}km<br/>` +
          `Alert: ${riskData.alert_level}<br/>` +
          `<em>Immediate evacuation recommended</em>`
        );
      }

      // Add safe zone circle (outer circle - safe area indicator)
      if (riskData.alert_level === 'RED') {
        safeZoneCircleRef.current = L.circle([selectedLocation.lat, selectedLocation.lng], {
          radius: 5000, // 5km safe zone
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.05,
          weight: 2,
          dashArray: '5, 10'
        }).addTo(map.current);
        
        safeZoneCircleRef.current.bindPopup(
          `<strong>Safe Zone Perimeter</strong><br/>` +
          `Radius: 5km<br/>` +
          `<em>Recommended safe distance from danger zone</em>`
        );

        // Fit map to show both circles
        const bounds = safeZoneCircleRef.current.getBounds();
        map.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedLocation, riskData]);

  // Handle layer visibility changes
  useEffect(() => {
    if (!map.current) return;
    
    // Wait for layer groups to be initialized
    if (!layerGroupsRef.current.landslide) return;

    // Toggle landslide layer
    if (layers.landslide) {
      if (!map.current.hasLayer(layerGroupsRef.current.landslide)) {
        layerGroupsRef.current.landslide.addTo(map.current);
      }
    } else {
      if (map.current.hasLayer(layerGroupsRef.current.landslide)) {
        map.current.removeLayer(layerGroupsRef.current.landslide);
      }
    }

    // Toggle flood layer
    if (layers.flood) {
      if (!map.current.hasLayer(layerGroupsRef.current.flood)) {
        layerGroupsRef.current.flood.addTo(map.current);
      }
    } else {
      if (map.current.hasLayer(layerGroupsRef.current.flood)) {
        map.current.removeLayer(layerGroupsRef.current.flood);
      }
    }

    // Toggle rivers layer
    if (layers.rivers) {
      if (!map.current.hasLayer(layerGroupsRef.current.rivers)) {
        layerGroupsRef.current.rivers.addTo(map.current);
      }
    } else {
      if (map.current.hasLayer(layerGroupsRef.current.rivers)) {
        map.current.removeLayer(layerGroupsRef.current.rivers);
      }
    }

    // Toggle elevation layer
    if (layers.elevation) {
      if (!map.current.hasLayer(layerGroupsRef.current.elevation)) {
        layerGroupsRef.current.elevation.addTo(map.current);
      }
    } else {
      if (map.current.hasLayer(layerGroupsRef.current.elevation)) {
        map.current.removeLayer(layerGroupsRef.current.elevation);
      }
    }
  }, [layers]);

  // Handle satellite view toggle
  useEffect(() => {
    if (!map.current || !tileLayerRef.current) return;

    // Remove current tile layer
    map.current.removeLayer(tileLayerRef.current);

    // Remove label layer if it exists
    if (labelLayerRef.current) {
      map.current.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }

    // Add new tile layer based on view mode
    if (isSatelliteView) {
      // Satellite imagery from Esri
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        }
      ).addTo(map.current);

      // Add labels overlay for satellite view (place names, roads, borders)
      labelLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          pane: 'shadowPane' // Ensures labels appear on top
        }
      ).addTo(map.current);
    } else {
      // Dark map view (already has labels built-in)
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>',
          maxZoom: 19,
        }
      ).addTo(map.current);
    }
  }, [isSatelliteView]);

  const handleSelectLocation = (location) => {
    const selectedLoc = {
      name: location.name,
      lat: location.lat,
      lng: location.lng,
      risk: location.risk || 'moderate',
      coordinates: { lat: location.lat, lng: location.lng }
    };
    onLocationSelect(selectedLoc);
    clearSearch();
  };

  // Get current location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const currentLoc = {
            name: 'Current Location',
            lat: latitude,
            lng: longitude,
            risk: 'moderate',
            coordinates: { lat: latitude, lng: longitude }
          };
          onLocationSelect(currentLoc);
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services.');
          setIsLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
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
            <Search style={{ width: 18, height: 18, color: '#64748b', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search locations (cities, mountains, villages)..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchQuery.length >= 3 && setShowDropdown(true)}
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
            {isLoading && (
              <Loader2 style={{ width: 16, height: 16, color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
            )}
            {searchQuery && !isLoading && (
              <button
                onClick={clearSearch}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X style={{ width: 16, height: 16, color: '#94a3b8' }} />
              </button>
            )}
            <button
              onClick={handleCurrentLocation}
              title="Use current location"
              style={{
                background: 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 6,
                padding: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
              }}
            >
              <Navigation style={{ width: 16, height: 16, color: '#60a5fa' }} />
            </button>
          </div>
          
          {showDropdown && searchResults.length > 0 && (
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(51,65,85,0.5)',
              maxHeight: 300,
              overflowY: 'auto'
            }}>
              {/* Show preset locations first */}
              {searchResults.filter(r => r.source === 'preset').length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ 
                    fontSize: 11, 
                    color: '#64748b', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    marginBottom: 8,
                    fontWeight: 600
                  }}>
                    Quick Access
                  </div>
                  {searchResults.filter(r => r.source === 'preset').map((location, index) => (
                    <button
                      key={`preset-${index}`}
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
                        e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <MapPin style={{ width: 14, height: 14, color: '#60a5fa', flexShrink: 0 }} />
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

              {/* Show search results from API */}
              {searchResults.filter(r => r.source === 'nominatim').length > 0 && (
                <div>
                  <div style={{ 
                    fontSize: 11, 
                    color: '#64748b', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    marginBottom: 8,
                    fontWeight: 600
                  }}>
                    Search Results
                  </div>
                  {searchResults.filter(r => r.source === 'nominatim').map((location, index) => (
                    <button
                      key={`search-${index}`}
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
                      <Search style={{ width: 14, height: 14, color: '#94a3b8', flexShrink: 0 }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {location.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {location.type ? location.type.replace('_', ' ') : 'Location'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No results message */}
          {showDropdown && searchQuery.length >= 3 && searchResults.length === 0 && !isLoading && (
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(51,65,85,0.5)',
              textAlign: 'center',
              color: '#64748b',
              fontSize: 13
            }}>
              No locations found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      />

      {/* Click Notification Toast */}
      {clickNotification && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(59,130,246,0.95)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <MapPin style={{ width: 16, height: 16 }} />
          {clickNotification}
        </div>
      )}

      {/* Map Instructions Hint & Buttons */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'flex-end'
      }}>
        {/* Satellite View Toggle Button */}
        <button
          onClick={() => setIsSatelliteView(!isSatelliteView)}
          style={{
            background: isSatelliteView 
              ? 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95))'
              : 'linear-gradient(135deg, rgba(71,85,105,0.95), rgba(51,65,85,0.95))',
            backdropFilter: 'blur(12px)',
            border: `2px solid ${isSatelliteView ? 'rgba(59,130,246,0.5)' : 'rgba(71,85,105,0.3)'}`,
            borderRadius: 12,
            padding: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'white',
            fontWeight: 600,
            fontSize: 13
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isSatelliteView 
              ? '0 6px 20px rgba(59,130,246,0.4)' 
              : '0 6px 20px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          }}
          title={isSatelliteView ? "Switch to Map View" : "Switch to Satellite View"}
        >
          {isSatelliteView ? (
            <MapIcon style={{ width: 18, height: 18 }} />
          ) : (
            <Satellite style={{ width: 18, height: 18 }} />
          )}
          <span>{isSatelliteView ? 'Map' : 'Satellite'}</span>
        </button>

        {/* Map Instructions */}
        <div style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          color: '#94a3b8',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 12,
          border: '1px solid rgba(51,65,85,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <MapPin style={{ width: 14, height: 14, color: '#60a5fa' }} />
          Click anywhere on map to analyze
        </div>
      </div>
  )
      {/* Risk Zone Legend */}
      {riskData && (riskData.alert_level === 'RED' || riskData.alert_level === 'YELLOW') && (
        <div style={{
          position: 'absolute',
          top: 100,
          right: 20,
          zIndex: 999,
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid rgba(51,65,85,0.5)',
          minWidth: 200
        }}>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: '#f1f5f9', 
            marginBottom: 12,
            borderBottom: '1px solid rgba(51,65,85,0.5)',
            paddingBottom: 8
          }}>
            Risk Zones
          </div>
          
          {riskData.alert_level === 'RED' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px dashed #ef4444',
                  flexShrink: 0
                }}></div>
                <div>
                  <div style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600 }}>Danger Zone</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>2km radius - Evacuate</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px dashed #10b981',
                  flexShrink: 0
                }}></div>
                <div>
                  <div style={{ fontSize: 11, color: '#86efac', fontWeight: 600 }}>Safe Zone</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>5km perimeter</div>
                </div>
              </div>
            </>
          )}

          {riskData.alert_level === 'YELLOW' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px dashed #f59e0b',
                flexShrink: 0
              }}></div>
              <div>
                <div style={{ fontSize: 11, color: '#fde047', fontWeight: 600 }}>Caution Zone</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>1km radius - Be Alert</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { 
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
          }
          to { 
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        .selected-marker {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default RiskMap;
