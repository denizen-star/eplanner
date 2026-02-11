// Version identifier for cache verification
const VERSION = 'v4.0.0';
console.log(`%c[COORDINATE] Page loaded - ${VERSION}`, 'color: #2563eb; font-weight: bold; font-size: 14px;');
console.log('[COORDINATE] Timestamp:', new Date().toISOString());

let locationUpdateTimeout;
let validatedAddress = null;
let validatedCoordinates = null;
let validatedAddressComponents = null;
let validatedPlaceName = null;
let eventPictureBase64 = null;

// Normalize website URL - ensure it has https:// if missing
function normalizeWebsiteUrl(url) {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // If it already starts with http:// or https://, return as is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Otherwise prepend https://
  return `https://${trimmed}`;
}

// Normalize Instagram URL - convert handle to URL or ensure full URL
function normalizeInstagramUrl(input) {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  // If it's already a full URL, return as is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Remove @ if present
  const handle = trimmed.replace(/^@+/, '');
  if (!handle) return null;
  // Convert to Instagram URL
  return `https://instagram.com/${handle}`;
}

// Initialize session manager and device collector
let sessionManager = null;
if (window.SessionManager) {
  sessionManager = new window.SessionManager();
}

// Initialize map when DOM and scripts are ready
function initializeMapWhenReady() {
  const mapContainer = document.getElementById('locationMap');
  
  // Check if all dependencies are loaded
  const dependenciesReady = typeof L !== 'undefined' && 
                            typeof initMap === 'function' && 
                            typeof MIAMI_COORDINATES !== 'undefined';
  
  if (mapContainer && dependenciesReady) {
    try {
      initMap('locationMap', null, null, false, MIAMI_COORDINATES);
      console.log('[COORDINATE] Map initialized successfully');
    } catch (error) {
      console.error('[COORDINATE] Error initializing map:', error);
      // Retry once after a delay
      setTimeout(() => {
        try {
          initMap('locationMap', null, null, false, MIAMI_COORDINATES);
        } catch (retryError) {
          console.error('[COORDINATE] Map initialization failed after retry:', retryError);
        }
      }, 500);
    }
  } else if (mapContainer) {
    // Dependencies not ready yet, retry after a short delay
    console.log('[COORDINATE] Waiting for map dependencies...', {
      hasL: typeof L !== 'undefined',
      hasInitMap: typeof initMap !== 'undefined',
      hasMIAMI_COORDINATES: typeof MIAMI_COORDINATES !== 'undefined'
    });
    setTimeout(initializeMapWhenReady, 100);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize map (with retry logic for script loading)
  initializeMapWhenReady();

  // Payment Information toggle
  const paymentTypeInputs = document.querySelectorAll('input[name="paymentType"]');
  const paymentDetailsCard = document.getElementById('paymentDetailsCard');
  const paymentModeInputs = document.querySelectorAll('input[name="paymentMode"]');
  const fixedAmountWrap = document.getElementById('fixedAmountWrap');
  const splitCostWrap = document.getElementById('splitCostWrap');

  paymentTypeInputs.forEach(input => {
    input.addEventListener('change', () => {
      paymentDetailsCard.style.display = input.value === 'paid' ? 'block' : 'none';
      if (input.value !== 'paid') {
        fixedAmountWrap.style.display = 'none';
        splitCostWrap.style.display = 'none';
      } else {
        const checked = document.querySelector('input[name="paymentMode"]:checked');
        if (checked) {
          fixedAmountWrap.style.display = checked.value === 'fixed_amount' ? 'block' : 'none';
          splitCostWrap.style.display = checked.value === 'split_cost' ? 'block' : 'none';
        }
      }
    });
  });

  paymentModeInputs.forEach(input => {
    input.addEventListener('change', () => {
      fixedAmountWrap.style.display = input.value === 'fixed_amount' ? 'block' : 'none';
      splitCostWrap.style.display = input.value === 'split_cost' ? 'block' : 'none';
    });
  });

  // Set default datetime to tomorrow at 6:30 PM
  const dateTimeInput = document.getElementById('dateTime');
  const endTimeInput = document.getElementById('endTime');
  if (dateTimeInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 30, 0, 0);
    const defaultDateTime = tomorrow.toISOString().slice(0, 16);
    dateTimeInput.value = defaultDateTime;
    
    // Set end time to match start time initially
    if (endTimeInput) {
      endTimeInput.value = defaultDateTime;
    }
  }
  
  // Sync end time with start time when start time changes (only if end time hasn't been manually changed)
  let endTimeManuallyChanged = false;
  if (dateTimeInput && endTimeInput) {
    dateTimeInput.addEventListener('change', () => {
      if (!endTimeManuallyChanged) {
        endTimeInput.value = dateTimeInput.value;
      }
    });
    
    endTimeInput.addEventListener('change', () => {
      endTimeManuallyChanged = true;
    });
  }

  // Handle radio card selection visual state
  // The label wrapper should handle clicks naturally, we just need to update visual state
  function updateRadioCardVisualState() {
    document.querySelectorAll('.radio-card').forEach(card => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio && radio.checked) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }
  
  // Update visual state when any radio changes
  const visibilityRadios = document.querySelectorAll('input[name="eventVisibility"]');
  if (visibilityRadios.length > 0) {
    visibilityRadios.forEach(radio => {
      radio.addEventListener('change', updateRadioCardVisualState);
      radio.addEventListener('click', updateRadioCardVisualState);
    });
    
    // Set initial state
    updateRadioCardVisualState();
  }
  
  // Set up location input handler
  const locationInput = document.getElementById('location');
  if (locationInput) {
    locationInput.addEventListener('input', (e) => {
      clearTimeout(locationUpdateTimeout);
      const locationText = e.target.value.trim();
      
      // Clear validation when location changes
      validatedAddress = null;
      validatedCoordinates = null;
      validatedAddressComponents = null;
      validatedPlaceName = null;
      const locationValidation = document.getElementById('locationValidation');
      if (locationValidation) locationValidation.style.display = 'none';
      
      if (locationText.length > 3) {
        locationUpdateTimeout = setTimeout(() => {
          if (typeof updateMapForLocationWithValidation === 'function') {
            updateMapForLocationWithValidation('locationMap', locationText, false, MIAMI_COORDINATES);
          }
        }, 500);
      } else {
        const mapContainer = document.getElementById('locationMap');
        if (mapContainer && typeof initMap === 'function') {
          initMap('locationMap', null, null, false, MIAMI_COORDINATES);
        }
      }
    });
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
    validatedAddressComponents = null;
    validatedPlaceName = null;
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
    validatedAddressComponents = geocodeResult.addressComponents;
    validatedPlaceName = geocodeResult.placeName;
    
    const map = initMap(mapId, geocodeResult.coordinates, geocodeResult.address, staticMode, defaultCenter, geocodeResult.placeName);

    if (!map) {
      mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-gray);">Unable to display map</div>';
      validatedAddress = null;
      validatedCoordinates = null;
      validatedAddressComponents = null;
      validatedPlaceName = null;
    } else {
      // Show validated address with place name as title if available
      const validatedAddressElement = document.getElementById('validatedAddress');
      if (validatedPlaceName) {
        validatedAddressElement.innerHTML = `<strong>${validatedPlaceName}</strong><br>${validatedAddress}`;
      } else {
        validatedAddressElement.textContent = validatedAddress;
      }
      document.getElementById('locationValidation').style.display = 'block';
    }
  } catch (error) {
    console.error('Error updating map:', error);
    mapContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-gray);">Unable to find location on map</div>';
    mapContainer.style.display = 'block';
    validatedAddress = null;
    validatedCoordinates = null;
    validatedAddressComponents = null;
    validatedPlaceName = null;
    document.getElementById('locationValidation').style.display = 'none';
  }
}

// Handle picture upload and conversion to base64 with compression
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image file size must be less than 5MB'));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize/compress image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 1200px width, maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with quality compression (0.8 = 80% quality)
        const base64String = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        // Check final size (max 2MB after compression)
        const sizeInMB = (base64String.length * 3) / 4 / 1024 / 1024;
        if (sizeInMB > 2) {
          reject(new Error(`Image is still too large after compression (${sizeInMB.toFixed(2)}MB). Please use a smaller image.`));
          return;
        }
        
        resolve(base64String);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

// Handle picture file input change
document.getElementById('eventPicture')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById('picturePreview');
  const previewImage = document.getElementById('previewImage');
  const errorDiv = document.getElementById('error');

  if (!file) {
    if (preview) preview.style.display = 'none';
    eventPictureBase64 = null;
    return;
  }

  try {
    if (errorDiv) errorDiv.style.display = 'none';
    const base64 = await convertImageToBase64(file);
    eventPictureBase64 = base64;
    if (previewImage) previewImage.src = 'data:image/jpeg;base64,' + base64;
    if (preview) preview.style.display = 'block';
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
    e.target.value = ''; // Clear the file input
    eventPictureBase64 = null;
    if (preview) preview.style.display = 'none';
  }
});

// Handle remove picture button
document.getElementById('removePicture')?.addEventListener('click', () => {
  const fileInput = document.getElementById('eventPicture');
  const preview = document.getElementById('picturePreview');
  if (fileInput) fileInput.value = '';
  eventPictureBase64 = null;
  if (preview) preview.style.display = 'none';
});

document.getElementById('coordinateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Track CTA click for event creation
  if (window.Analytics?.safeTrack) {
    window.Analytics.safeTrack('trackCTAClick', 'create_event_button_click', {
      pageCategory: 'event_create',
    });
  }

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

    // Validate that address has been successfully geocoded
    if (!validatedAddress) {
      throw new Error('Please wait for the address to be validated or enter a valid location');
    }

    const plannerName = document.getElementById('pacerName').value.trim();
    if (!plannerName) {
      throw new Error('Please enter a planner name');
    }

    const coordinatorEmailInput = document.getElementById('coordinatorEmail');
    if (!coordinatorEmailInput) {
      console.error('[COORDINATE] Coordinator email input field not found!');
      throw new Error('Coordinator email field not found. Please refresh the page.');
    }
    
    const coordinatorEmail = coordinatorEmailInput.value.trim();
    console.log('[COORDINATE] Coordinator email extracted:', coordinatorEmail ? 'Found' : 'EMPTY', coordinatorEmail);
    
    if (!coordinatorEmail) {
      throw new Error('Please enter a coordinator email address');
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coordinatorEmail)) {
      throw new Error('Please enter a valid email address');
    }

    const dateTimeInput = document.getElementById('dateTime');
    const dateTimeLocal = dateTimeInput ? dateTimeInput.value : null;
    if (!dateTimeLocal) {
      throw new Error('Please select a date and time for the event');
    }

    // Capture end time (optional)
    const endTimeInput = document.getElementById('endTime');
    const endTimeLocal = endTimeInput ? endTimeInput.value : null;
    let endTime = null;
    if (endTimeLocal) {
      const endTimeDate = new Date(endTimeLocal);
      endTime = endTimeDate.toISOString();
    }

    // Capture event visibility (isPublic)
    const visibilityInputs = document.querySelectorAll('input[name="eventVisibility"]');
    let isPublic = true; // Default to true
    visibilityInputs.forEach(input => {
      if (input.checked) {
        isPublic = input.value === 'public';
      }
    });

    // Capture user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Convert datetime-local value to ISO string
    // datetime-local gives "YYYY-MM-DDTHH:mm" which represents local time
    // We need to create a Date object treating it as local time, then convert to ISO
    const dateTimeDate = new Date(dateTimeLocal);
    const dateTime = dateTimeDate.toISOString();

    const runTitle = document.getElementById('runTitle').value.trim();
    const eventDescription = document.getElementById('eventDescription')?.value.trim() || null;
    
    // Get and normalize website and Instagram
    const eventWebsiteInput = document.getElementById('eventWebsite');
    const eventInstagramInput = document.getElementById('eventInstagram');
    const externalSignupCheckbox = document.getElementById('externalSignupEnabled');
    const eventWebsite = eventWebsiteInput ? normalizeWebsiteUrl(eventWebsiteInput.value) : null;
    const eventInstagram = eventInstagramInput ? normalizeInstagramUrl(eventInstagramInput.value) : null;
    const externalSignupEnabled = !!(externalSignupCheckbox && externalSignupCheckbox.checked);

    if (externalSignupEnabled && !eventWebsite) {
      throw new Error('Event website URL is required when "Use this URL for external signups" is enabled.');
    }

    const paymentTypeChecked = document.querySelector('input[name="paymentType"]:checked');
    const isPaid = paymentTypeChecked && paymentTypeChecked.value === 'paid';
    let paymentInfoEnabled = false;
    let paymentMode = null;
    let totalEventCost = null;
    let paymentDueDate = null;
    if (isPaid) {
      const modeChecked = document.querySelector('input[name="paymentMode"]:checked');
      paymentMode = modeChecked ? modeChecked.value : null;
      const amountPerPersonInput = document.getElementById('amountPerPerson');
      const totalEventCostInput = document.getElementById('totalEventCostInput');
      const paymentDueDateInput = document.getElementById('paymentDueDate');
      if (paymentMode === 'fixed_amount' && amountPerPersonInput) {
        totalEventCost = amountPerPersonInput.value ? parseFloat(amountPerPersonInput.value) : null;
      } else if (paymentMode === 'split_cost' && totalEventCostInput) {
        totalEventCost = totalEventCostInput.value ? parseFloat(totalEventCostInput.value) : null;
      }
      paymentDueDate = paymentDueDateInput && paymentDueDateInput.value ? paymentDueDateInput.value : null;
      if (!paymentMode || !totalEventCost || totalEventCost <= 0) {
        throw new Error('Paid events require selecting a cost type and entering a valid amount.');
      }
      paymentInfoEnabled = true;
    }

    const maxParticipantsInput = document.getElementById('maxParticipants');
    const maxParticipantsValue = maxParticipantsInput ? parseInt(maxParticipantsInput.value) : null;
    
    if (!maxParticipantsInput || !maxParticipantsValue || isNaN(maxParticipantsValue) || maxParticipantsValue <= 0) {
      throw new Error('Please enter a valid number of max participants (must be at least 1)');
    }

    // Collect device information (only in production)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    let deviceInfo = null;
    let sessionInfo = null;

    if (isProduction && window.DeviceMetadataCollector && sessionManager) {
      deviceInfo = window.DeviceMetadataCollector.collectDeviceData();
      sessionInfo = sessionManager.getSessionData();
    }

    // Extract address components from validated address
    const addr = validatedAddressComponents || {};
    
    console.log('=== SENDING ADDRESS COMPONENTS TO SERVER ===');
    console.log('Validated Address Components Object:', addr);
    console.log('Extracted fields:');
    console.log('  house_number:', addr.house_number || '(not in addressComponents)');
    console.log('  road:', addr.road || addr.street || addr.pedestrian || '(not in addressComponents)');
    console.log('  suburb:', addr.suburb || '(not in addressComponents)');
    console.log('  city:', addr.city || addr.town || addr.village || addr.municipality || '(not in addressComponents)');
    console.log('  county:', addr.county || '(not in addressComponents)');
    console.log('  state:', addr.state || '(not in addressComponents)');
    console.log('  postcode:', addr.postcode || '(not in addressComponents)');
    console.log('  country:', addr.country || '(not in addressComponents)');
    console.log('  country_code:', addr.country_code || '(not in addressComponents)');
    console.log('  neighbourhood:', addr.neighbourhood || '(not in addressComponents)');
    console.log('  city_district:', addr.city_district || '(not in addressComponents)');
    console.log('  village:', addr.village || '(not in addressComponents)');
    console.log('  town:', addr.town || '(not in addressComponents)');
    console.log('  municipality:', addr.municipality || '(not in addressComponents)');

    const formData = {
      location: locationToSave,
      coordinates: validatedCoordinates,
      plannerName: plannerName,
      coordinatorEmail: coordinatorEmail,
      title: runTitle || null,
      dateTime: dateTime,
      endTime: endTime,
      timezone: userTimezone,
      maxParticipants: maxParticipantsValue,
      isPublic: isPublic,
      placeName: validatedPlaceName || null,
      deviceInfo: deviceInfo,
      sessionInfo: sessionInfo,
      // Address component fields
      house_number: addr.house_number || null,
      road: addr.road || addr.street || addr.pedestrian || null,
      suburb: addr.suburb || null,
      city: addr.city || addr.town || addr.village || addr.municipality || null,
      county: addr.county || null,
      state: addr.state || null,
      postcode: addr.postcode || null,
      country: addr.country || null,
      country_code: addr.country_code || null,
      neighbourhood: addr.neighbourhood || null,
      city_district: addr.city_district || null,
      village: addr.village || null,
      town: addr.town || null,
      municipality: addr.municipality || null,
      picture: eventPictureBase64 || null,
      description: eventDescription,
      eventWebsite: eventWebsite,
      eventInstagram: eventInstagram,
      externalSignupEnabled: externalSignupEnabled,
      paymentInfoEnabled: paymentInfoEnabled,
      paymentMode: paymentMode,
      totalEventCost: totalEventCost,
      paymentDueDate: paymentDueDate
    };
    
    console.log('[COORDINATE] Form Data being sent:', {
      hasLocation: !!formData.location,
      hasPlannerName: !!formData.plannerName,
      hasCoordinatorEmail: !!formData.coordinatorEmail,
      hasDateTime: !!formData.dateTime,
      hasEndTime: !!formData.endTime,
      isPublic: formData.isPublic,
      hasPlaceName: !!formData.placeName,
      maxParticipants: formData.maxParticipants,
      keys: Object.keys(formData)
    });

    const response = await fetch('/api/runs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    // Read response as text first, then parse as JSON
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
      
      // Log email status if available (sanitize to prevent password exposure)
      if (data.emailStatus) {
        // Create sanitized version - never log passwords or sensitive data
        const sanitizedStatus = {
          attempted: data.emailStatus.attempted,
          enabled: !!data.emailStatus.enabled, // Ensure boolean, never password
          sent: data.emailStatus.sent,
          error: data.emailStatus.error
        };
        console.log('[COORDINATE] Email Status:', sanitizedStatus);
        if (data.emailStatus.sent) {
          console.log('[COORDINATE] ✅ Confirmation email sent successfully');
        } else if (data.emailStatus.attempted) {
          console.warn('[COORDINATE] ⚠️ Email was attempted but not sent');
          console.warn('[COORDINATE] Email enabled:', !!data.emailStatus.enabled); // Ensure boolean
          if (data.emailStatus.error) {
            console.warn('[COORDINATE] Email error:', data.emailStatus.error);
          }
        } else {
          console.warn('[COORDINATE] ⚠️ Email service was not attempted');
        }
      }
    } catch (parseError) {
      console.error('[COORDINATE] Failed to parse response:', parseError);
      console.error('[COORDINATE] Response text:', responseText);
      if (response.status === 413) {
        throw new Error('Image file is too large. Please use an image smaller than 2MB or compress it before uploading.');
      }
      if (response.status === 500) {
        const errorMsg = data?.message || data?.error || 'Server error';
        if (errorMsg.includes('is_public') || errorMsg.includes('end_time') || errorMsg.includes('place_name') || errorMsg.includes('signup_link')) {
          throw new Error('Database migration required: Please run migration-add-public-endtime-place-links.sql in your database.');
        }
        throw new Error(`Server error: ${errorMsg}`);
      }
      throw new Error('Invalid response from server');
    }
    
    // Check for error in response even if status is 200
    if (data.error) {
      throw new Error(data.message || data.error);
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
      // Show detailed error message if available
      if (data.details) {
        throw new Error(data.details);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error(data.message || 'Failed to create event');
      }
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
      const whatsappMessage = generateWhatsAppMessage(runForMessage, signupLink, userTimezone);
      const whatsappMessageEscaped = whatsappMessage.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '&#10;');
      
      resultDiv.innerHTML = `
        <h2>Event Created Successfully!</h2>
        <p style="margin-bottom: 16px;">Your event has been created successfully. Use the links below to share and manage your event.</p>
        <div style="margin-bottom: 16px;">
          <p><strong>Signup Link:</strong></p>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <a href="${signupLink}" target="_blank" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 14px; background: #fff; color: var(--primary-color); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${signupLink}">${signupLink}</a>
            <button onclick="copyToClipboard('signupLink')" class="button" style="white-space: nowrap; min-width: 60px;" data-track-cta="copy_signup_link_click">Copy</button>
          </div>
          <input type="text" id="signupLink" value="${signupLinkEscaped}" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
        </div>
        <div style="margin-bottom: 16px;">
          <p><strong>Management Link:</strong></p>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <a href="${manageLink}" target="_blank" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 14px; background: #fff; color: var(--primary-color); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${manageLink}">${manageLink}</a>
            <button onclick="copyToClipboard('manageLink')" class="button" style="white-space: nowrap; min-width: 60px;" data-track-cta="copy_manage_link_click">Copy</button>
          </div>
          <input type="text" id="manageLink" value="${manageLinkEscaped}" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
        </div>
        <div style="margin-bottom: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; border: 1px solid #ddd;">
          <p style="margin-bottom: 8px;"><strong>WhatsApp Message:</strong></p>
          <div style="background: white; padding: 12px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 8px; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5;">${whatsappMessage.replace(/\n/g, '<br>')}</div>
          <button onclick="copyToClipboard('whatsappMessage')" class="button button-primary" style="width: 100%;" data-track-cta="copy_whatsapp_message_click">Copy WhatsApp Message</button>
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
    validatedAddressComponents = null;
    document.getElementById('locationValidation').style.display = 'none';
    
    // Reset map to Miami
    initMap('locationMap', null, null, false, MIAMI_COORDINATES);
    
    // Reset datetime to tomorrow at 6:30 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 30, 0, 0);
    const defaultDateTime = tomorrow.toISOString().slice(0, 16);
    document.getElementById('dateTime').value = defaultDateTime;
    
    // Reset end time to match start time
    const endTimeInputReset = document.getElementById('endTime');
    if (endTimeInputReset) {
      endTimeInputReset.value = defaultDateTime;
      endTimeManuallyChanged = false; // Reset the flag
    }
    
    // Reset event visibility to public (default) - use setTimeout to ensure form reset completes first
    setTimeout(() => {
      const publicRadio = document.querySelector('input[name="eventVisibility"][value="public"]');
      if (publicRadio) {
        publicRadio.checked = true;
        // Trigger change event to update visual state
        publicRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 0);
    
    // Reset max participants to 10
    document.getElementById('maxParticipants').value = '10';
    
    // Reset picture and description
    const fileInput = document.getElementById('eventPicture');
    const preview = document.getElementById('picturePreview');
    if (fileInput) fileInput.value = '';
    if (preview) preview.style.display = 'none';
    eventPictureBase64 = null;
    const descriptionInput = document.getElementById('eventDescription');
    if (descriptionInput) descriptionInput.value = '';
    const websiteInput = document.getElementById('eventWebsite');
    if (websiteInput) websiteInput.value = '';
    const instagramInput = document.getElementById('eventInstagram');
    if (instagramInput) instagramInput.value = '';
  } catch (error) {
    console.error('[COORDINATE] Form submission error:', error);
    console.error('[COORDINATE] Error stack:', error.stack);
    errorDiv.textContent = error.message || 'An error occurred while creating the event. Please check the console for details.';
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
function formatDateForWhatsApp(dateString, timezone = null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };
  if (timezone) {
    options.timeZone = timezone;
  }
  const formatted = date.toLocaleString('en-US', options);
  // Convert "Dec 25, 2024, 6:30 PM EST" to "Dec 25, 2024 at 6:30 PM EST"
  return formatted.replace(', ', ' at ');
}

// Generate WhatsApp message template
function generateWhatsAppMessage(run, signupLink, timezone = null) {
  const pacerName = run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim() ? run.pacerName.trim() : '';
  const runTitle = run.title && typeof run.title === 'string' && run.title.trim() ? run.title.trim() : '';
  const city = extractCity(run.location || '');
  const dateFormatted = formatDateForWhatsApp(run.dateTime, timezone);
  
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

