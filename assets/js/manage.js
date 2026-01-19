function displayAddressDetails(run) {
  // Build street address
  const streetParts = [];
  if (run.houseNumber || run.house_number) {
    streetParts.push(run.houseNumber || run.house_number);
  }
  if (run.road) {
    streetParts.push(run.road);
  }
  document.getElementById('displayStreet').textContent = streetParts.join(' ') || run.location || '-';
  
  // Display other address fields
  document.getElementById('displayCity').textContent = 
    run.city || run.town || run.village || run.municipality || '-';
  document.getElementById('displayState').textContent = run.state || '-';
  document.getElementById('displayPostcode').textContent = run.postcode || '-';
  document.getElementById('displayCountry').textContent = run.country || '-';
}

// Load calendar utilities
if (typeof generateGoogleCalendarLink === 'undefined') {
  console.warn('calendar-utils.js not loaded. Calendar features may not work.');
}

function formatPhoneNumber(phone) {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

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
  const eventTimezone = timezone || run.timezone || null;
  const dateFormatted = formatDateForWhatsApp(run.dateTime, eventTimezone);
  
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

const urlParams = new URLSearchParams(window.location.search);
const runId = urlParams.get('id') || urlParams.get('uuid');

if (!runId) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('notFound').style.display = 'block';
} else {
  loadRun();
}

async function loadRun() {
  try {
    const response = await fetch(`/api/runs/${runId}`);
    if (!response.ok) {
      throw new Error('Event not found');
    }
    const run = await response.json();

    // Log all address component fields for debugging
    console.log('=== RUN ADDRESS COMPONENT FIELDS ===');
    console.log('Run ID:', run.id);
    console.log('Full Location:', run.location);
    console.log('');
    console.log('Address Component Fields:');
    console.log('  house_number:', run.houseNumber || run.house_number || '(not set)');
    console.log('  road:', run.road || '(not set)');
    console.log('  suburb:', run.suburb || '(not set)');
    console.log('  city:', run.city || '(not set)');
    console.log('  county:', run.county || '(not set)');
    console.log('  state:', run.state || '(not set)');
    console.log('  postcode:', run.postcode || '(not set)');
    console.log('  country:', run.country || '(not set)');
    console.log('  country_code:', run.countryCode || run.country_code || '(not set)');
    console.log('  neighbourhood:', run.neighbourhood || '(not set)');
    console.log('  city_district:', run.cityDistrict || run.city_district || '(not set)');
    console.log('  village:', run.village || '(not set)');
    console.log('  town:', run.town || '(not set)');
    console.log('  municipality:', run.municipality || '(not set)');
    console.log('');
    console.log('Full Run Object:', run);
    console.log('====================================');

    document.getElementById('runLocation').textContent = run.location;
    
    const runTitleElement = document.getElementById('runTitle');
    const pacerNameElement = document.getElementById('runPacerName');
    
    // Check if event is cancelled
    if (run.status === 'cancelled') {
      document.getElementById('runInfo').style.display = 'none';
      document.getElementById('loading').style.display = 'none';
      document.getElementById('notFound').innerHTML = '<h1>Event Cancelled</h1><p>This event has been cancelled.</p><a href="index.html" class="button button-primary">Return Home</a>';
      document.getElementById('notFound').style.display = 'block';
      return;
    }

    if (run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim()) {
      const pacerName = run.pacerName.trim();
      runTitleElement.textContent = `Event Management - ${pacerName}`;
      document.title = `Event Management - ${pacerName} - Event Planner`;
      if (pacerNameElement) pacerNameElement.textContent = pacerName;
    } else {
      runTitleElement.textContent = 'Event Management';
      document.title = 'Manage Event - Event Planner';
      if (pacerNameElement) pacerNameElement.textContent = '-';
    }
    
    // Format date using stored timezone if available, otherwise use browser timezone
    const runDate = new Date(run.dateTime);
    const timezone = run.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.getElementById('runDateTime').textContent = runDate.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    document.getElementById('runMax').textContent = run.maxParticipants;
    document.getElementById('runCurrent').textContent = run.signups.length;
    
    // Display created timestamp in EST
    if (run.createdAt) {
      const createdDate = new Date(run.createdAt);
      const createdEST = createdDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      });
      const createdElement = document.getElementById('runCreated');
      if (createdElement) {
        createdElement.textContent = createdEST;
      }
    }

    if (run.location) {
      updateMapForLocation('locationMap', run.location, true);
    }

    // Display address details
    displayAddressDetails(run);

    // Add calendar links section (after map is loaded)
    setTimeout(() => {
      addCalendarLinksSection(run);
    }, 500);

    // Add cancel event button
    addCancelEventButton(run);

    const signupList = document.getElementById('signupList');
    if (run.signups.length === 0) {
      signupList.innerHTML = '<li style="padding: 16px; text-align: center; color: #2f3b52;">No signups yet</li>';
    } else {
      signupList.innerHTML = run.signups.map((signup, index) => {
        const date = new Date(signup.signedAt);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const formattedDate = `${month}/${day}/${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
        const formattedPhone = formatPhoneNumber(signup.phone);
        const phoneDigits = signup.phone ? signup.phone.replace(/\D/g, '') : '';
        const telLink = phoneDigits ? `tel:${phoneDigits}` : '#';
        const phoneDisplay = signup.phone ? `<a href="${telLink}" class="phone-link">${formattedPhone}</a>` : formattedPhone;
        
        let contactInfo = '';
        if (signup.email) {
          contactInfo += ` - <a href="mailto:${signup.email}" class="contact-link">${signup.email}</a>`;
        }
        if (signup.instagram) {
          contactInfo += ` - <a href="https://instagram.com/${signup.instagram}" target="_blank" class="contact-link">@${signup.instagram}</a>`;
        }
        
        return `<li class="signup-item">
          <div class="signup-item-content">
            <div class="signup-item-main">
              <strong>${signup.name}</strong> - ${phoneDisplay}${contactInfo} - ${formattedDate} - Waiver: ${signup.waiverAccepted ? 'Yes' : 'No'}
            </div>
            <button class="button button-secondary button-sm delete-signup-btn" onclick="deleteSignup(${index})" title="Delete Participant" data-track-cta="delete_signup_click">
              Delete
            </button>
          </div>
        </li>`;
      }).join('');
    }

    // Add WhatsApp message section at the bottom
    const baseUrl = window.location.origin;
    const signupLink = `${baseUrl}/signup.html?id=${run.id}`;
    const whatsappMessage = generateWhatsAppMessage(run, signupLink);
    const whatsappMessageEscaped = whatsappMessage.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '&#10;');
    
    const runInfoDiv = document.getElementById('runInfo');
    // Check if WhatsApp section already exists, if so remove it
    const existingWhatsAppSection = document.getElementById('whatsappMessageSection');
    if (existingWhatsAppSection) {
      existingWhatsAppSection.remove();
    }
    
    const whatsappSection = document.createElement('div');
    whatsappSection.id = 'whatsappMessageSection';
    whatsappSection.style.cssText = 'margin-top: 32px; padding-top: 24px; border-top: 2px solid var(--border-gray);';
    whatsappSection.innerHTML = `
      <h2 style="margin-bottom: 16px;">Share with Participants</h2>
      <div style="margin-bottom: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; border: 1px solid #ddd;">
        <p style="margin-bottom: 8px;"><strong>WhatsApp Message:</strong></p>
        <div style="background: white; padding: 12px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 8px; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5; max-height: 300px; overflow-y: auto;">${whatsappMessage.replace(/\n/g, '<br>')}</div>
        <button onclick="copyWhatsAppMessage()" class="button button-primary" style="width: 100%;" data-track-cta="copy_whatsapp_message_click">Copy WhatsApp Message</button>
        <textarea id="whatsappMessageText" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">${whatsappMessageEscaped}</textarea>
      </div>
      <div style="margin-bottom: 8px;">
        <p><strong>Signup Link:</strong></p>
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
          <a href="${signupLink}" target="_blank" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 14px; background: #fff; color: var(--primary-color); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${signupLink}">${signupLink}</a>
          <button onclick="copySignupLink()" class="button" style="white-space: nowrap; min-width: 60px;" data-track-cta="copy_signup_link_click">Copy</button>
        </div>
        <input type="text" id="signupLinkText" value="${signupLink.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
      </div>
    `;
    runInfoDiv.appendChild(whatsappSection);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('runInfo').style.display = 'block';
    
    // Track event view in manage page
    if (window.Analytics?.safeTrack) {
      const runTitle = run.title || '';
      const eventSlug = runTitle || run.id;
      window.Analytics.safeTrack('trackEventView', runId, eventSlug);
    }
  } catch (error) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('notFound').style.display = 'block';
  }
}

function toggleSignups() {
  const content = document.getElementById('signupsContent');
  const icon = document.getElementById('signupsIcon');
  
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

function copyWhatsAppMessage() {
  const textarea = document.getElementById('whatsappMessageText');
  if (textarea) {
    const message = textarea.value.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    navigator.clipboard.writeText(message).then(() => {
      alert('WhatsApp message copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy WhatsApp message');
    });
  }
}

function copySignupLink() {
  const input = document.getElementById('signupLinkText');
  if (input) {
    const link = input.value.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    navigator.clipboard.writeText(link).then(() => {
      alert('Signup link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy signup link');
    });
  }
}

// Store run data globally for calendar functions to access
let currentRun = null;
window.currentRun = currentRun; // Make available for inline handlers

/**
 * Add calendar links section below event details
 */
function addCalendarLinksSection(run) {
  const runInfoDiv = document.getElementById('runInfo');
  if (!runInfoDiv) return;
  
  // Check if calendar section already exists, if so remove it
  const existingCalendarSection = document.getElementById('calendarLinksSection');
  if (existingCalendarSection) {
    existingCalendarSection.remove();
  }
  
  // Store run globally for calendar functions
  currentRun = run;
  window.currentRun = run; // Make available for inline handlers
  
  try {
    const googleCalendarLink = generateGoogleCalendarLink(run);
    
    // Find where to insert (after map)
    const mapElement = document.getElementById('locationMap');
    
    const calendarSection = document.createElement('div');
    calendarSection.id = 'calendarLinksSection';
    calendarSection.style.cssText = 'margin-top: 24px; margin-bottom: 24px; padding-top: 24px; border-top: 2px solid var(--border-gray);';
    calendarSection.innerHTML = `
      <h2 style="margin-bottom: 16px;">Add to Calendar</h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button onclick="window.downloadICalFile(window.currentRun)" class="button button-primary" style="flex: 1; min-width: 120px;">
          Download iCal
        </button>
        <a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="button button-secondary" style="flex: 1; min-width: 120px; text-align: center; text-decoration: none; display: inline-block;">
          Google Calendar
        </a>
      </div>
    `;
    
    // Insert after map
    if (mapElement && mapElement.parentNode) {
      mapElement.parentNode.insertBefore(calendarSection, mapElement.nextSibling);
    } else {
      // Fallback: append to runInfo div
      runInfoDiv.appendChild(calendarSection);
    }
  } catch (error) {
    console.error('Error adding calendar links section:', error);
  }
}

/**
 * Add cancel event button to the page
 */
function addCancelEventButton(run) {
  const runInfoDiv = document.getElementById('runInfo');
  if (!runInfoDiv) return;

  // Check if cancel button section already exists, if so remove it
  const existingCancelSection = document.getElementById('cancelEventSection');
  if (existingCancelSection) {
    existingCancelSection.remove();
  }

  // Check if event can be cancelled (coordinator: 6 hours before event)
  const eventStartTime = new Date(run.dateTime);
  const now = new Date();
  const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
  const canCancel = hoursUntilEvent >= 6 && run.status !== 'cancelled';

  const cancelSection = document.createElement('div');
  cancelSection.id = 'cancelEventSection';
  cancelSection.style.cssText = 'margin-top: 32px; padding-top: 24px; border-top: 2px solid var(--border-gray);';
  
  if (canCancel) {
    cancelSection.innerHTML = `
      <h2 style="margin-bottom: 16px; color: #dc3545;">Cancel Event</h2>
      <p style="margin-bottom: 16px; color: var(--text-gray);">If you need to cancel this event, all registered participants will be notified via email.</p>
      <button onclick="cancelEvent()" class="button" style="background-color: #dc3545; color: white; border: none;" data-track-cta="cancel_event_click">Cancel Event</button>
    `;
  } else {
    let reason = '';
    if (run.status === 'cancelled') {
      reason = 'This event has already been cancelled.';
    } else if (hoursUntilEvent < 6) {
      reason = 'Event cannot be cancelled within 6 hours of start time.';
    } else {
      reason = 'Event cannot be cancelled.';
    }
    cancelSection.innerHTML = `
      <h2 style="margin-bottom: 16px; color: var(--text-gray);">Cancel Event</h2>
      <p style="margin-bottom: 16px; color: var(--text-gray);">${reason}</p>
      <button disabled class="button" style="background-color: #ccc; color: #666; border: none; cursor: not-allowed;" title="${reason}">Cancel Event</button>
    `;
  }

  // Insert after WhatsApp section or at the end
  const whatsappSection = document.getElementById('whatsappMessageSection');
  if (whatsappSection && whatsappSection.parentNode) {
    whatsappSection.parentNode.insertBefore(cancelSection, whatsappSection.nextSibling);
  } else {
    runInfoDiv.appendChild(cancelSection);
  }
}

/**
 * Cancel the event (coordinator function)
 */
async function cancelEvent() {
  if (!confirm('Are you sure you want to cancel this event? All registered participants will be notified via email. This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/runs/${runId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel event');
    }

    alert('Event cancelled successfully. All participants have been notified.');
    window.location.reload();
  } catch (error) {
    alert('Error cancelling event: ' + error.message);
  }
}

async function deleteSignup(signupIndex) {
  if (!confirm('Are you sure you want to delete this participant? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/runs/${runId}/signups/${signupIndex}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    
    if (!response.ok) {
      let errorMessage = 'Failed to delete participant';
      
      if (contentType.includes('application/json')) {
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON error response:', text.substring(0, 200));
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Only parse JSON if content type indicates it
    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Signup deleted successfully:', data);
    }
    
    // Reload the run data to refresh the signups list
    loadRun();
  } catch (error) {
    console.error('Delete signup error:', error);
    alert('Error deleting participant: ' + error.message);
  }
}

