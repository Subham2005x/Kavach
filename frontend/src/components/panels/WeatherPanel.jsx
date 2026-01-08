import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react';

const WeatherPanel = ({ simulatedRainfall, location }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      // Use default location if none selected
      const lat = location?.coordinates?.lat || location?.lat || 28.5;
      const lng = location?.coordinates?.lng || location?.lng || 82.0;

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${lat}&longitude=${lng}&` +
          `current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&` +
          `timezone=Asia/Kolkata`
        );
        
        if (!response.ok) throw new Error('Weather fetch failed');
        
        const data = await response.json();
        setWeatherData(data.current);
      } catch (error) {
        console.error('Weather API error:', error);
        setWeatherData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  const getWindDirection = (degrees) => {
    if (!degrees && degrees !== 0) return 'N/A';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const rainfall = simulatedRainfall || weatherData?.precipitation || 0;
  const temperature = weatherData?.temperature_2m || 15;
  const humidity = weatherData?.relative_humidity_2m || 65;
  const windSpeed = weatherData?.wind_speed_10m || 0;
  const windDirection = getWindDirection(weatherData?.wind_direction_10m);

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
        {isLoading && (
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>
            Updating...
          </span>
        )}
        {!isLoading && weatherData && (
          <span style={{ fontSize: 10, color: '#22c55e', marginLeft: 'auto' }}>
            ● Live
          </span>
        )}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Temperature */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))',
            borderRadius: 10,
            padding: 14,
            border: '1px solid rgba(251,191,36,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Thermometer style={{ width: 16, height: 16, color: '#fbbf24' }} />
              <p style={{ fontSize: 11, color: '#fde047', fontWeight: 600 }}>Temperature</p>
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#fef08a' }}>
              {temperature.toFixed(1)}°C
            </p>
            <p style={{ fontSize: 10, color: '#fde68a', marginTop: 4 }}>Current</p>
          </div>

          {/* Rainfall */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))',
            borderRadius: 10,
            padding: 14,
            border: '1px solid rgba(59,130,246,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CloudRain style={{ width: 16, height: 16, color: '#60a5fa' }} />
              <p style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600 }}>
                {simulatedRainfall ? 'Simulated Rain' : 'Rainfall'}
              </p>
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#bfdbfe' }}>
              {rainfall.toFixed(1)}mm
            </p>
            <p style={{ fontSize: 10, color: '#7dd3fc', marginTop: 4 }}>
              {simulatedRainfall ? 'Simulation' : 'Current'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Wind Speed */}
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
            <p style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>
              {windSpeed.toFixed(0)} km/h
            </p>
            <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>
              {windDirection} Direction
            </p>
          </div>

          {/* Humidity */}
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
            <p style={{ fontSize: 24, fontWeight: 700, color: '#bfdbfe' }}>
              {humidity}%
            </p>
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
                width: `${humidity}%`,
                boxShadow: '0 0 8px rgba(59,130,246,0.5)',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div style={{
          fontSize: 13,
          color: '#64748b',
          textAlign: 'center',
          paddingTop: 8,
          borderTop: '1px solid rgba(51,65,85,0.5)'
        }}>
          {weatherData ? (
            <>
              {location?.name ? `Weather for ${location.name}` : 'Weather for selected area'}
              {simulatedRainfall > 0 && ' (Rainfall simulated)'}
            </>
          ) : (
            'Loading weather data...'
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
