let mapLeft, mapRight;
let markerLeft, markerRight;

// Load Google Maps API dynamically
function loadGoogleMaps() {
    if (typeof CONFIG === 'undefined' || !CONFIG.GOOGLE_MAPS_API_KEY) {
        console.error("Configuration not found. Please ensure config.js exists and contains GOOGLE_MAPS_API_KEY.");
        alert("Google Maps API Key is missing. Please check the console.");
        return;
    }
    
    // Create the script tag
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        console.error("Failed to load Google Maps API.");
    };
    document.head.appendChild(script);
}

// Trigger loading
loadGoogleMaps();

function initMap() {
    // Default start: Null Island if geolocation fails
    const defaultStart = { lat: 0, lng: 0 };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                createMaps(userLocation);
            },
            () => {
                // Handle location error or denial
                createMaps(defaultStart);
            }
        );
    } else {
        // Browser doesn't support Geolocation
        createMaps(defaultStart);
    }
}

function createMaps(center) {
    const mapOptions = {
        zoom: 4,
        mapTypeId: 'hybrid',
        streetViewControl: false,
        fullscreenControl: false
    };

    // Initialize Left Map (User Control)
    mapLeft = new google.maps.Map(document.getElementById("map-left"), {
        ...mapOptions,
        center: center,
    });

    // Initialize Right Map (Antipode)
    // Calculate initial antipode
    const antipode = calculateAntipode(center.lat, center.lng);
    
    mapRight = new google.maps.Map(document.getElementById("map-right"), {
        ...mapOptions,
        center: antipode,
        disableDefaultUI: true, // Optional: make the right map purely for display
        draggable: false,       // Optional: lock the right map? The user prompt implied auto-panning.
        scrollwheel: false,
        disableDoubleClickZoom: true
    });

    // Initialize Markers
    markerLeft = new google.maps.Marker({
        position: center,
        map: mapLeft
    });

    markerRight = new google.maps.Marker({
        position: antipode,
        map: mapRight
    });

    // Initial Info Update
    updateInfo(center, antipode);

    // Add listener to left map to sync right map
    mapLeft.addListener("center_changed", () => {
        const newCenter = mapLeft.getCenter();
        const lat = newCenter.lat();
        const lng = newCenter.lng();

        const newAntipode = calculateAntipode(lat, lng);
        
        mapRight.setCenter(newAntipode);

        // Update markers to stay at center
        markerLeft.setPosition(newCenter);
        markerRight.setPosition(newAntipode);

        // Update text
        updateInfo({lat, lng}, newAntipode);
    });
    
    // Sync zoom as well
    mapLeft.addListener("zoom_changed", () => {
       mapRight.setZoom(mapLeft.getZoom()); 
    });

    // Load and display antipodal land intersection
    loadAntipodes();
}

async function loadAntipodes() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson');
        if (!response.ok) throw new Error('Failed to fetch land data');
        const landGeoJson = await response.json();

        const antipodalPolys = [];
        const originalPolys = [];

        turf.flatten(landGeoJson).features.forEach(feature => {
            originalPolys.push(feature);

            // Clip to Eastern Hemisphere (0 to 180)
            const east = turf.bboxClip(feature, [0, -90, 180, 90]);
            if (east && east.geometry && east.geometry.coordinates.length > 0) {
                const transformedEast = transformPoly(east, -180);
                if (transformedEast) antipodalPolys.push(transformedEast);
            }

            // Clip to Western Hemisphere (-180 to 0)
            const west = turf.bboxClip(feature, [-180, -90, 0, 90]);
            if (west && west.geometry && west.geometry.coordinates.length > 0) {
                const transformedWest = transformPoly(west, 180);
                if (transformedWest) antipodalPolys.push(transformedWest);
            }
        });

        if (antipodalPolys.length === 0 || originalPolys.length === 0) return;

        // Merge all polygons into single MultiPolygons for intersection
        // Optimization: Unioning 100+ polys one by one can be slow. 
        // But for 110m land (simple), it should be acceptable.
        
        let landUnion = originalPolys[0];
        for (let i = 1; i < originalPolys.length; i++) {
            landUnion = turf.union(landUnion, originalPolys[i]);
        }

        let antipodeUnion = antipodalPolys[0];
        for (let i = 1; i < antipodalPolys.length; i++) {
            antipodeUnion = turf.union(antipodeUnion, antipodalPolys[i]);
        }
        
        // Compute Intersection
        const intersection = turf.intersect(landUnion, antipodeUnion);

        if (intersection) {
             // Style the data layer
             const style = {
                 fillColor: 'purple',
                 fillOpacity: 0.4,
                 strokeWeight: 0,
                 clickable: false
             };
             
             mapLeft.data.addGeoJson(intersection);
             mapRight.data.addGeoJson(intersection);

             mapLeft.data.setStyle(style);
             mapRight.data.setStyle(style);
        }

    } catch (err) {
        console.error("Error loading antipodal data:", err);
    }
}

function transformPoly(feature, lngOffset) {
    try {
        const newFeature = JSON.parse(JSON.stringify(feature));
        turf.coordEach(newFeature, function (coord) {
            // coord is [lng, lat]
            // Flip Lat
            coord[1] = -coord[1];
            // Shift Lng
            coord[0] = coord[0] + lngOffset;
        });
        
        // Rewind to ensure correct winding order after reflection
        return turf.rewind(newFeature);
    } catch (e) {
        return null;
    }
}

function updateInfo(leftCoords, rightCoords) {
    document.getElementById("coords-left").textContent = formatCoordinate(leftCoords.lat, leftCoords.lng);
    document.getElementById("coords-right").textContent = formatCoordinate(rightCoords.lat, rightCoords.lng);
}

function formatCoordinate(lat, lng) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    const latAbs = Math.abs(lat).toFixed(4);
    
    // Normalize longitude for display to be within -180 to 180
    let normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;
    const lngAbs = Math.abs(normalizedLng).toFixed(4);
    const finalLngDir = normalizedLng >= 0 ? 'E' : 'W';

    return `${latAbs}° ${latDir}, ${lngAbs}° ${finalLngDir}`;
}

function calculateAntipode(lat, lng) {
    // Antipode Latitude: -Lat
    const antiLat = -lat;

    // Antipode Longitude: Lon + 180 (normalized)
    // Normalize input longitude first to handle map wrapping
    const normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;
    
    let antiLng = normalizedLng + 180;
    if (antiLng > 180) {
        antiLng -= 360;
    }

    return { lat: antiLat, lng: antiLng };
}