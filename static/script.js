document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Map Initialization (Leaflet) ---
    // Centered on Nepal
    const map = L.map('map').setView([28.3949, 84.1240], 7); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const sentinelLayer = L.tileLayer.wms("https://services.sentinel-hub.com/ogc/wms/<YOUR_ID>", {
        layers: "FALSE-COLOR-URBAN",
        format: "image/png",
        transparent: true
    });

    // State Variables
    let selectedMarker = null;
    let safeZoneCircle = null; 
    let selectedLat = 28.3949; 
    let selectedLon = 84.1240;
    let terrainChart = null;

    // --- 2. Charts Initialization ---
    const hazardDistributionCtx = document.getElementById('hazardDistributionChart').getContext('2d');
    const hazardDistributionChart = new Chart(hazardDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Landslide', 'Flood'],
            datasets: [{ data: [50, 50], backgroundColor: ['#f56565', '#4299e1'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // --- 3. Helper Functions ---

    function updateTerrainChart(profileData) {
        const ctx = document.getElementById('terrainProfileChart').getContext('2d');
        if (terrainChart) terrainChart.destroy();
        
        terrainChart = new Chart(ctx, {
            type: 'line',
            data: {
                // Labels represent the distance from the center point
                labels: ['-500m', '-400m', '-300m', '-200m', '-100m', 'Center', '+100m', '+200m', '+300m', '+400m'],
                datasets: [{
                    label: 'Elevation (m)',
                    data: profileData,
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    async function fetchGeminiExplanation(riskData) {
        const container = document.getElementById('risk-explanation-text');
        container.innerHTML = "<em>AI generating detailed insight...</em>";
        
        try {
            const resp = await fetch('/chat_explanation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(riskData)
            });
            const chatResult = await resp.json();
            container.innerHTML = chatResult.explanation;
        } catch (e) {
            container.innerHTML = "Expert analysis currently unavailable.";
        }
    }

    // --- 4. Main Simulation Execution ---
    async function runSimulation() {
        // Collect current UI values
        const simulationData = {
            lat: selectedLat,
            lon: selectedLon,
            rainfall_intensity: parseFloat(document.getElementById('rainfall-intensity').value),
            duration_hours: parseInt(document.getElementById('duration-hours').value) || 24,
            soil_moisture: parseFloat(document.getElementById('soil-moisture').value),
            slope_angle: parseFloat(document.getElementById('slope-angle').value),
            use_live_weather: true 
        };

        try {
            const response = await fetch('/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(simulationData)
            });

            const result = await response.json();
            const data = result.results;

            // Update Hazard Chart
            hazardDistributionChart.data.datasets[0].data = [data.landslide_risk, data.flood_risk];
            hazardDistributionChart.update();

            // Update Terrain Chart 
            if (data.elevation_profile) {
                updateTerrainChart(data.elevation_profile);
            }

            // Fetch AI Content 
            fetchGeminiExplanation(data);

            // Update Alert UI
            const alertCard = document.querySelector('.early-warning-card');
            if (alertCard) {
                alertCard.style.backgroundColor = data.alert_level === 'RED' ? '#f56565' : data.alert_level === 'YELLOW' ? '#f6ad55' : '#48bb78';
                alertCard.querySelector('p').innerHTML = `<strong>${data.alert_level} Alert:</strong> ${data.recommendation}`;
            }

            // Update Map Safe Zones
            if (safeZoneCircle) map.removeLayer(safeZoneCircle);
            if (data.alert_level === 'RED') {
                safeZoneCircle = L.circle([selectedLat, selectedLon], {
                    radius: 5000, color: '#48bb78', fillOpacity: 0.1, dashArray: '5, 10'
                }).addTo(map);
                map.fitBounds(safeZoneCircle.getBounds());
            }

        } catch (error) {
            console.error('Simulation Error:', error);
        }
    }

    // --- 5. Event Listeners ---

    map.on('click', (e) => {
        if (selectedMarker) map.removeLayer(selectedMarker);
        selectedLat = e.latlng.lat;
        selectedLon = e.latlng.lng;
        selectedMarker = L.marker([selectedLat, selectedLon]).addTo(map)
            .bindPopup(`Lat ${selectedLat.toFixed(4)}, Lon ${selectedLon.toFixed(4)}`)
            .openPopup();
        
        const coordDisplay = document.getElementById('selected-coords');
        if (coordDisplay) {
            coordDisplay.innerText = `Lat: ${selectedLat.toFixed(4)}, Lon: ${selectedLon.toFixed(4)}`;
        }
        runSimulation();
    });

    document.getElementById('sentinel-layer-toggle')?.addEventListener('change', (e) => {
        if (e.target.checked) sentinelLayer.addTo(map);
        else map.removeLayer(sentinelLayer);
    });

    document.getElementById('start-simulation-btn')?.addEventListener('click', runSimulation);

    // Auto-update on slider changes
    document.querySelectorAll('input[type=range]').forEach(input => {
        input.addEventListener('change', runSimulation);
    });

    // Run once on load
    runSimulation();
});