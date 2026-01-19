let mapCache = {};
const MIAMI_COORDINATES = [25.7617, -80.1918];

async function geocodeLocation(locationText) {
  if (!locationText || locationText.trim() === '') {
    throw new Error('Location text is required');
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EventPlanner/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Location not found');
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // Extract business/place name from multiple Nominatim fields
    // Priority: name > amenity > shop > leisure > tourism > building > display_name (parsed)
    let placeName = null;
    const addr = result.address || {};
    
    if (result.name) {
      placeName = result.name;
    } else if (addr.amenity) {
      // Bars, restaurants, cafes, etc.
      placeName = addr.amenity;
    } else if (addr.shop) {
      // Shops, stores
      placeName = addr.shop;
    } else if (addr.leisure) {
      // Parks, recreation facilities
      placeName = addr.leisure;
    } else if (addr.tourism) {
      // Tourist attractions
      placeName = addr.tourism;
    } else if (addr.building) {
      // Building names
      placeName = addr.building;
    } else if (result.display_name) {
      // Fallback: try to extract name from display_name (first part before comma)
      // Only if it doesn't look like a street address (no numbers)
      const displayParts = result.display_name.split(',');
      if (displayParts.length > 0) {
        const firstPart = displayParts[0].trim();
        // If first part doesn't start with a number and is not too long, use it
        if (!/^\d+/.test(firstPart) && firstPart.length < 100) {
          placeName = firstPart;
        }
      }
    }
    
    // Build full address from Nominatim result, preserving street number
    let fullAddress = '';
    if (result.address) {
      const addr = result.address;
      const parts = [];
      
      // Include house number and street name if available
      if (addr.house_number) {
        parts.push(addr.house_number);
      }
      if (addr.road || addr.street || addr.pedestrian) {
        parts.push(addr.road || addr.street || addr.pedestrian);
      }
      
      // If we have a street address, use it, otherwise use display_name
      if (parts.length > 0) {
        const streetAddress = parts.join(' ');
        const cityParts = [];
        if (addr.city || addr.town || addr.village || addr.municipality) {
          cityParts.push(addr.city || addr.town || addr.village || addr.municipality);
        }
        if (addr.state) {
          cityParts.push(addr.state);
        }
        if (addr.postcode) {
          cityParts.push(addr.postcode);
        }
        if (addr.country) {
          cityParts.push(addr.country);
        }
        
        if (cityParts.length > 0) {
          fullAddress = `${streetAddress}, ${cityParts.join(', ')}`;
        } else {
          fullAddress = streetAddress;
        }
      } else {
        // Fall back to display_name which includes the full address
        fullAddress = result.display_name || locationText;
      }
    } else {
      // Fall back to display_name
      fullAddress = result.display_name || locationText;
    }

    return {
      coordinates: [lat, lon],
      address: fullAddress,
      placeName: placeName,
      addressComponents: result.address || {},
      rawResult: result
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

function initMap(mapId, coordinates, address, staticMode = false, defaultCenter = null, placeName = null) {
  const mapContainer = document.getElementById(mapId);
  if (!mapContainer) {
    console.error(`Map container ${mapId} not found`);
    return null;
  }

  if (mapCache[mapId]) {
    mapCache[mapId].remove();
    delete mapCache[mapId];
  }

  try {
    const viewCenter = coordinates || defaultCenter || MIAMI_COORDINATES;
    const mapOptions = {
      center: viewCenter,
      zoom: 15
    };

    if (staticMode) {
      mapOptions.dragging = false;
      mapOptions.touchZoom = false;
      mapOptions.doubleClickZoom = false;
      mapOptions.scrollWheelZoom = false;
      mapOptions.boxZoom = false;
      mapOptions.keyboard = false;
      mapOptions.zoomControl = false;
    }

    const map = L.map(mapId, mapOptions);

    // Use Esri World Imagery for satellite view
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      maxZoom: 19
    }).addTo(map);

    if (coordinates && address) {
      const marker = L.marker(coordinates).addTo(map);
      // Include place name as title if available
      let popupContent = '';
      if (placeName) {
        popupContent = `<strong>${placeName}</strong><br>${address}`;
      } else {
        popupContent = `<strong>${address}</strong>`;
      }
      marker.bindPopup(popupContent).openPopup();
    }

    mapCache[mapId] = map;
    mapContainer.style.display = 'block';

    // Invalidate size to ensure proper rendering if container was previously hidden
    setTimeout(() => {
      if (map && typeof map.invalidateSize === 'function') {
        map.invalidateSize();
      }
    }, 100);

    return map;
  } catch (error) {
    console.error('Map initialization error:', error);
    mapContainer.style.display = 'none';
    return null;
  }
}

async function updateMapForLocation(mapId, locationText, staticMode = false, defaultCenter = null) {
  const mapContainer = document.getElementById(mapId);
  if (!mapContainer) {
    console.error(`Map container ${mapId} not found`);
    return;
  }

  if (!locationText || locationText.trim() === '') {
    if (defaultCenter) {
      initMap(mapId, null, null, staticMode, defaultCenter);
    } else {
      mapContainer.style.display = 'none';
    }
    return;
  }

  try {
    mapContainer.style.display = 'block';
    mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-gray);">Loading map...</div>';

    const geocodeResult = await geocodeLocation(locationText);
    const map = initMap(mapId, geocodeResult.coordinates, geocodeResult.address, staticMode, defaultCenter, geocodeResult.placeName);

    if (!map) {
      mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-gray);">Unable to display map</div>';
    }
  } catch (error) {
    console.error('Error updating map:', error);
    mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-gray);">Unable to find location on map</div>';
    mapContainer.style.display = 'block';
  }
}

