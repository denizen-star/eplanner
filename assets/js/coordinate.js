// Version identifier for cache verification
const VERSION = 'v4.0.0';
console.log(`%c[COORDINATE] Page loaded - ${VERSION}`, 'color: #2563eb; font-weight: bold; font-size: 14px;');
console.log('[COORDINATE] Timestamp:', new Date().toISOString());

let locationUpdateTimeout;
let validatedAddress = null;
let validatedCoordinates = null;

// Initialize session manager and device collector
let sessionManager = null;
if (window.SessionManager) {
  sessionManager = new window.SessionManager();
}

document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('locationMap');
  if (mapContainer) {
    initMap('locationMap', null, null, false, MIAMI_COORDINATES);
  }

  // Set default datetime to tomorrow at 6:30 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 30, 0, 0);
  const defaultDateTime = tomorrow.toISOString().slice(0, 16);
  document.getElementById('dateTime').value = defaultDateTime;
});

document.getElementById('location').addEventListener('input', (e) => {
  clearTimeout(locationUpdateTimeout);
  const locationText = e.target.value.trim();
  
  // Clear validation when location changes
  validatedAddress = null;
  validatedCoordinates = null;
  document.getElementById('locationValidation').style.display = 'none';
  
  if (locationText.length > 3) {
    locationUpdateTimeout = setTimeout(() => {
      updateMapForLocationWithValidation('locationMap', locationText, false, MIAMI_COORDINATES);
    }, 500);
  } else {
    initMap('locationMap', null, null, false, MIAMI_COORDINATES);
  }
});

async function updateMapForLocationWithValidation(mapId, locationText, staticMode = false, defaultCenter = null) {
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
    validatedAddress = null;
    validatedCoordinates = null;
    document.getElementById('locationValidation').style.display = 'none';
    return;
  }

  try {
    mapContainer.style.display = 'block';
    mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-gray);">Loading map...</div>';
    document.getElementById('locationValidation').style.display = 'none';

    const geocodeResult = await geocodeLocation(locationText);
    validatedAddress = geocodeResult.address;
    validatedCoordinates = geocodeResult.coordinates;
    
    const map = initMap(mapId, geocodeResult.coordinates, geocodeResult.address, staticMode, defaultCenter);

    if (!map) {
      mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-gray);">Unable to display map</div>';
      validatedAddress = null;
      validatedCoordinates = null;
    } else {
      // Show validated address
      document.getElementById('validatedAddress').textContent = validatedAddress;
      document.getElementById('locationValidation').style.display = 'block';
    }
  } catch (error) {
    console.error('Error updating map:', error);
    mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-gray);">Unable to find location on map</div>';
    mapContainer.style.display = 'block';
    validatedAddress = null;
    validatedCoordinates = null;
    document.getElementById('locationValidation').style.display = 'none';
  }
}

document.getElementById('coordinateForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitButton = document.getElementById('submitButton');
  submitButton.disabled = true;
  submitButton.textContent = 'Creating...';

  const errorDiv = document.getElementById('error');
  const resultDiv = document.getElementById('result');
  errorDiv.style.display = 'none';
  resultDiv.style.display = 'none';

  try {
    // Use validated address if available, otherwise use the input text
    const locationToSave = validatedAddress || document.getElementById('location').value.trim();

    if (!locationToSave) {
      throw new Error('Please enter a valid location');
    }

    const plannerName = document.getElementById('pacerName').value.trim();
    if (!plannerName) {
      throw new Error('Please enter a planner name');
    }

    const runTitle = document.getElementById('runTitle').value.trim();

    // Collect device information (only in production)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    let deviceInfo = null;
    let sessionInfo = null;

    if (isProduction && window.DeviceMetadataCollector && sessionManager) {
      deviceInfo = window.DeviceMetadataCollector.collectDeviceData();
      sessionInfo = sessionManager.getSessionData();
    }

    const formData = {
      location: locationToSave,
      coordinates: validatedCoordinates,
      plannerName: plannerName,
      title: runTitle || null,
      dateTime: document.getElementById('dateTime').value,
      maxParticipants: parseInt(document.getElementById('maxParticipants').value),
      deviceInfo: deviceInfo,
      sessionInfo: sessionInfo
    };

    const response = await fetch('/api/runs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('[COORDINATE] Failed to parse response:', parseError);
      const text = await response.text();
      console.error('[COORDINATE] Response text:', text);
      throw new Error('Invalid response from server');
    }
    
    console.log('[COORDINATE] API Response:', data);
    console.log('[COORDINATE] Response type:', typeof data);
    console.log('[COORDINATE] Response keys:', Object.keys(data || {}));
    console.log('[COORDINATE] signupLink:', data.signupLink);
    console.log('[COORDINATE] manageLink:', data.manageLink);
    console.log('[COORDINATE] data.success:', data.success);
    console.log('[COORDINATE] Response OK?', response.ok);
    console.log('[COORDINATE] Response status:', response.status);

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to create event');
    }
    
    // Check if response has success flag
    if (data.success === false) {
      throw new Error(data.error || data.message || 'Failed to create event');
    }
    
    // Get run ID from response (could be in data.run.id or data.id)
    const runId = (data.run && data.run.id) || data.id || (data.run && data.run.uuid) || data.uuid;
    
    if (!runId) {
      console.error('[COORDINATE] No run ID in response:', data);
      throw new Error('Event created but no ID returned');
    }
    
    // Construct links client-side (same approach as admin.js)
    const baseUrl = window.location.origin;
    const signupLink = `${baseUrl}/signup.html?id=${runId}`;
    const manageLink = `${baseUrl}/manage.html?id=${runId}`;
    
    console.log('[COORDINATE] Constructed links:', { runId, signupLink, manageLink });
    
    // Always display links since we construct them client-side
    if (runId) {
      console.log('[COORDINATE] Displaying links in result div');
      // Escape HTML in URLs to prevent XSS
      const signupLinkEscaped = signupLink.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const manageLinkEscaped = manageLink.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      
      // Create event object for WhatsApp message generation
      const runForMessage = {
        pacerName: plannerName,
        title: runTitle || null,
        location: locationToSave,
        dateTime: formData.dateTime
      };
      const whatsappMessage = generateWhatsAppMessage(runForMessage, signupLink);
      const whatsappMessageEscaped = whatsappMessage.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '&#10;');
      
      resultDiv.innerHTML = `
        <h2>Event Created Successfully!</h2>
        <p style="margin-bottom: 16px;">Your event has been created successfully. Use the links below to share and manage your event.</p>
        <div style="margin-bottom: 16px;">
          <p><strong>Signup Link:</strong></p>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <a href="${signupLink}" target="_blank" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 14px; background: #fff; color: var(--primary-color); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${signupLink}">${signupLink}</a>
            <button onclick="copyToClipboard('signupLink')" class="button" style="white-space: nowrap; min-width: 60px;">Copy</button>
          </div>
          <input type="text" id="signupLink" value="${signupLinkEscaped}" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
        </div>
        <div style="margin-bottom: 16px;">
          <p><strong>Management Link:</strong></p>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <a href="${manageLink}" target="_blank" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 14px; background: #fff; color: var(--primary-color); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${manageLink}">${manageLink}</a>
            <button onclick="copyToClipboard('manageLink')" class="button" style="white-space: nowrap; min-width: 60px;">Copy</button>
          </div>
          <input type="text" id="manageLink" value="${manageLinkEscaped}" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
        </div>
        <div style="margin-bottom: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; border: 1px solid #ddd;">
          <p style="margin-bottom: 8px;"><strong>WhatsApp Message:</strong></p>
          <div style="background: white; padding: 12px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 8px; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">${whatsappMessage.replace(/\n/g, '<br>')}</div>
          <button onclick="copyToClipboard('whatsappMessage')" class="button button-primary" style="width: 100%;">Copy WhatsApp Message</button>
          <textarea id="whatsappMessage" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">${whatsappMessageEscaped}</textarea>
        </div>
        <p style="font-size: 14px; color: var(--text-gray);">Share the signup link with participants. Keep the management link private to view and manage signups.</p>
      `;
    } else {
      // Fallback if run ID is missing (shouldn't happen)
      console.error('[COORDINATE] Run ID missing from response');
      resultDiv.innerHTML = `
        <h2>Event Created Successfully!</h2>
        <p style="margin-bottom: 16px;">Your event has been created successfully!</p>
        <p style="font-size: 14px; color: var(--text-gray);">Event ID: ${runId || 'Unknown'}</p>
        <p style="margin-top: 16px; font-size: 12px; color: var(--text-gray);">Note: Unable to generate links. Please check the admin page for your event.</p>
      `;
    }
    
    // Show the result div BEFORE resetting the form
    console.log('[COORDINATE] Showing result div');
    resultDiv.style.display = 'block';
    
    // Scroll to result div to ensure it's visible
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Reset form AFTER showing results
    document.getElementById('coordinateForm').reset();
    
    // Reset validation
    validatedAddress = null;
    validatedCoordinates = null;
    document.getElementById('locationValidation').style.display = 'none';
    
    // Reset map to Miami
    initMap('locationMap', null, null, false, MIAMI_COORDINATES);
    
    // Reset datetime to tomorrow at 6:30 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 30, 0, 0);
    document.getElementById('dateTime').value = tomorrow.toISOString().slice(0, 16);
    
    // Reset max participants to 10
    document.getElementById('maxParticipants').value = '10';
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Create Event';
  }
});

// Extract city from location string
function extractCity(location) {
  if (!location) return '';
  // Try to extract city from common address formats
  // Format: "Address, City, State ZIP" or "City, State"
  const parts = location.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Usually city is the second-to-last part before state
    return parts[parts.length - 2] || parts[0] || '';
  }
  return parts[0] || '';
}

// Format date for WhatsApp message: "Dec 25, 2024 at 6:30 PM EST"
function formatDateForWhatsApp(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const formatted = date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  // Convert "Dec 25, 2024, 6:30 PM" to "Dec 25, 2024 at 6:30 PM"
  return formatted.replace(', ', ' at ') + ' EST';
}

// Generate WhatsApp message template
function generateWhatsAppMessage(run, signupLink) {
  const pacerName = run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim() ? run.pacerName.trim() : '';
  const runTitle = run.title && typeof run.title === 'string' && run.title.trim() ? run.title.trim() : '';
  const city = extractCity(run.location || '');
  const dateFormatted = formatDateForWhatsApp(run.dateTime);
  
  let message = 'Hi Participants, \n';
  message += `🎉 ${pacerName} here! I am hosting an event`;
  
  if (runTitle) {
    message += `\n${runTitle}`;
  }
  message += ':\n';
  
  message += `📅 Date: ${dateFormatted}\n`;
  message += `📍 City: ${city}\n`;
  message += `🔗 Sign-up: ${signupLink}\n`;
  message += 'More detail in sign up sheet. \n';
  message += "Can't wait to see you!";
  
  return message;
}

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const text = element.value || element.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const message = elementId === 'whatsappMessage' ? 'WhatsApp message copied to clipboard!' : 'Link copied to clipboard';
    alert(message);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy');
  });
}

function toggleInstructions() {
  const content = document.getElementById('instructionsContent');
  const icon = document.getElementById('instructionsIcon');
  
  if (!content || !icon) return;
  
  const isHidden = content.style.display === 'none' || !content.style.display;
  content.style.display = isHidden ? 'block' : 'none';
  
  if (isHidden) {
    icon.textContent = '▼';
    icon.classList.remove('collapsed');
    icon.classList.add('expanded');
  } else {
    icon.textContent = '▶';
    icon.classList.remove('expanded');
    icon.classList.add('collapsed');
  }
}

