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

function formatPhoneNumber(phone) {
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
    
    document.getElementById('runDateTime').textContent = new Date(run.dateTime).toLocaleString();
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
        const phoneDigits = signup.phone.replace(/\D/g, '');
        const telLink = `tel:${phoneDigits}`;
        
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
              <strong>${signup.name}</strong> - <a href="${telLink}" class="phone-link">${formattedPhone}</a>${contactInfo} - ${formattedDate} - Waiver: ${signup.waiverAccepted ? 'Yes' : 'No'}
            </div>
            <button class="button button-secondary button-sm delete-signup-btn" onclick="deleteSignup(${index})" title="Delete Participant">
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
        <button onclick="copyWhatsAppMessage()" class="button button-primary" style="width: 100%;">Copy WhatsApp Message</button>
        <textarea id="whatsappMessageText" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">${whatsappMessageEscaped}</textarea>
      </div>
      <div style="margin-bottom: 8px;">
        <p><strong>Signup Link:</strong></p>
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
          <a href="${signupLink}" target="_blank" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 14px; background: #fff; color: var(--primary-color); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${signupLink}">${signupLink}</a>
          <button onclick="copySignupLink()" class="button" style="white-space: nowrap; min-width: 60px;">Copy</button>
        </div>
        <input type="text" id="signupLinkText" value="${signupLink.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" readonly style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
      </div>
    `;
    runInfoDiv.appendChild(whatsappSection);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('runInfo').style.display = 'block';
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

