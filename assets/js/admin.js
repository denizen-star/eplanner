function formatPhoneNumber(phone) {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

let currentRuns = [];
let reportRuns = [];
let currentSortColumn = 'pacer';
let currentSortDirection = 'asc';
let runnersReportData = [];
let currentRunnersSortColumn = 'name';
let currentRunnersSortDirection = 'asc';
let editPictures = {}; // Store base64 picture data for each run being edited

// Toggle collapsible sections
function toggleSection(sectionId) {
  const content = document.getElementById(`${sectionId}Content`);
  const icon = document.getElementById(`${sectionId}Icon`);
  
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
  
  // Load data when section is opened for the first time
  if (isHidden) {
    if (sectionId === 'dashboard') {
      // Dashboard always loads runs, but only refresh if needed
      if (currentRuns.length === 0) {
        loadRuns();
      }
    } else if (sectionId === 'runReport' && reportRuns.length === 0) {
      loadReport();
    } else if (sectionId === 'runnersReport' && runnersReportData.length === 0) {
      loadRunnersReport();
    }
  }
}

loadRuns();

async function loadRuns() {
  const loading = document.getElementById('loading');
  const runsList = document.getElementById('runsList');
  
  loading.style.display = 'block';
  runsList.style.display = 'none';

  try {
    const response = await fetch('/api/runs');
    const data = await response.json();
    currentRuns = data.runs || [];

    if (currentRuns.length === 0) {
      runsList.innerHTML = '<p>No events created yet. <a href="coordinate.html">Create your first event</a></p>';
    } else {
      // Sort runs by date/time, newest first
      const sortedRuns = [...currentRuns].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
      
      runsList.innerHTML = '<div class="compact-list">' + sortedRuns.map(run => {
        const date = new Date(run.dateTime);
        // Use stored timezone if available, otherwise use browser timezone
        const timezone = run.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Ensure signups array exists (default to empty array if missing)
        const signupsArray = run.signups || [];
        const spotsLeft = run.maxParticipants - signupsArray.length;
        const baseUrl = window.location.origin;
        const signupLink = `${baseUrl}/signup.html?id=${run.id}`;
        const manageLink = `${baseUrl}/manage.html?id=${run.id}`;
        const formattedDate = date.toLocaleString('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const pacerName = run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim() ? run.pacerName.trim() : '';
        const runTitle = run.title && typeof run.title === 'string' && run.title.trim() ? run.title.trim() : '';
        const isDisabled = run.status === 'completed' || run.status === 'deleted';
        const statusText = run.status === 'completed' ? 'Completed' : run.status === 'deleted' ? 'Deleted' : '';
        
        // Format created timestamp in EST
        let createdTimestamp = '';
        if (run.createdAt) {
          const createdDate = new Date(run.createdAt);
          const estDate = new Date(createdDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));
          createdTimestamp = estDate.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
          });
        }
        
        // Generate WhatsApp message for active runs
        let whatsappMessageHtml = '';
        if (!isDisabled) {
          const whatsappMessage = generateWhatsAppMessage(run, signupLink);
          const whatsappMessageEscaped = whatsappMessage.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '&#10;');
          whatsappMessageHtml = `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-gray);">
              <strong style="display: block; margin-bottom: 8px; color: var(--text-dark);">WhatsApp Message:</strong>
              <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 8px; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.4; max-height: 200px; overflow-y: auto;">${whatsappMessage.replace(/\n/g, '<br>')}</div>
              <button class="button button-primary copy-whatsapp-button" data-message="${whatsappMessageEscaped}" style="width: 100%; padding: 6px 12px; font-size: 12px;">Copy WhatsApp Message</button>
            </div>
          `;
        }
        
        return `
          <div class="list-item">
            <div class="list-item-location">
              ${runTitle ? `<strong>${runTitle}</strong><br>` : ''}${run.location}${pacerName ? `<br><span class="list-item-pacer">${pacerName}</span>` : ''}
            </div>
            <div class="list-item-date">${formattedDate}</div>
            <div class="list-item-signups">${signupsArray.length} / ${run.maxParticipants}</div>
            <div class="list-item-status">
              <span class="status-badge ${spotsLeft > 0 ? 'status-open' : 'status-full'}">${spotsLeft > 0 ? 'Open' : 'Full'}</span>
              ${statusText ? `<br><span style="font-size: 11px; color: var(--text-gray);">${statusText}</span>` : ''}
            </div>
            <div class="list-item-created" style="font-size: 12px; color: var(--text-gray);">${createdTimestamp}</div>
            <div class="list-item-actions">
              <button class="button button-secondary button-sm" onclick="toggleLinks('${run.id}')" id="linksToggle-${run.id}" title="Toggle Links">
                <span>Links</span>
                <span class="dropdown-icon" id="linksIcon-${run.id}">▼</span>
              </button>
              <button class="button button-secondary button-sm" onclick="toggleSignups('${run.id}')" id="signupsToggle-${run.id}" title="Toggle Signups">
                <span>Signups</span>
                <span class="dropdown-icon" id="signupsIcon-${run.id}">▼</span>
              </button>
              <button class="button button-secondary" onclick="editRun('${run.id}')" id="editButton-${run.id}">Edit</button>
              <button class="button button-secondary" onclick="deleteRun('${run.id}')">Delete</button>
            </div>
            <div class="list-item-dropdown" id="linksDropdown-${run.id}" style="display: none;">
              <div class="dropdown-content">
                <div style="margin-bottom: 12px;">
                  <strong style="display: block; margin-bottom: 4px; color: var(--text-dark);">Signup Link:</strong>
                  ${isDisabled ? `<div style="color: var(--text-gray); font-size: 12px; margin-bottom: 4px;">Event ${statusText.toLowerCase()}</div>` : ''}
                  <div class="link-display" style="margin: 0;">
                    ${isDisabled ? 
                      `<span style="font-size: 12px; color: #999; text-decoration: line-through; font-family: 'Courier New', monospace; word-break: break-all;">${signupLink}</span>` :
                      `<a href="${signupLink}" target="_blank" style="font-size: 12px; color: var(--text-gray); text-decoration: underline; font-family: 'Courier New', monospace; word-break: break-all;">${signupLink}</a>`
                    }
                    ${!isDisabled ? `<button class="button button-secondary copy-button" data-link="${signupLink}" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;">Copy</button>` : ''}
                  </div>
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="display: block; margin-bottom: 4px; color: var(--text-dark);">Management Link:</strong>
                  ${isDisabled ? `<div style="color: var(--text-gray); font-size: 12px; margin-bottom: 4px;">Run ${statusText.toLowerCase()}</div>` : ''}
                  <div class="link-display" style="margin: 0;">
                    ${isDisabled ? 
                      `<span style="font-size: 12px; color: #999; text-decoration: line-through; font-family: 'Courier New', monospace; word-break: break-all;">${manageLink}</span>` :
                      `<a href="${manageLink}" target="_blank" style="font-size: 12px; color: var(--text-gray); text-decoration: underline; font-family: 'Courier New', monospace; word-break: break-all;">${manageLink}</a>`
                    }
                    ${!isDisabled ? `<button class="button button-secondary copy-button" data-link="${manageLink}" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;">Copy</button>` : ''}
                  </div>
                </div>
                ${whatsappMessageHtml}
              </div>
            </div>
            <div class="list-item-dropdown" id="signupsDropdown-${run.id}" style="display: none;">
              <div class="dropdown-content">
                <ul class="signup-list" id="signupList-${run.id}"></ul>
              </div>
            </div>
            <div class="list-item-details" id="details-${run.id}" style="display: none;">
              <div id="locationMap-${run.id}" class="location-map" style="display: none; margin-top: 16px; margin-bottom: 16px;" data-location="${run.location ? run.location.replace(/"/g, '&quot;') : ''}" data-coordinates="${run.coordinates ? JSON.stringify(run.coordinates) : ''}"></div>
              <div id="editFormContainer-${run.id}" style="display: none; margin-top: 16px; padding: 20px; background: var(--light-gray-1); border-radius: 8px; border: 1px solid var(--border-gray);">
                <h3 style="margin-bottom: 16px; background: var(--primary-rainbow); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Edit Run</h3>
                <form id="editForm-${run.id}" onsubmit="saveRunEdit(event, '${run.id}')">
                  <div class="form-group">
                    <label for="editTitle-${run.id}">Run Title (Optional)</label>
                    <input type="text" id="editTitle-${run.id}" placeholder="e.g., Morning Beach Run">
                  </div>
                  <div class="form-group">
                    <label for="editLocation-${run.id}">Location *</label>
                    <input type="text" id="editLocation-${run.id}" required oninput="updateEditMap('${run.id}')">
                  </div>
                  <div class="form-group">
                    <label for="editPacerName-${run.id}">Planner Name *</label>
                    <input type="text" id="editPacerName-${run.id}" required>
                  </div>
                  <div class="form-group">
                    <label for="editDateTime-${run.id}">Date and Time *</label>
                    <input type="datetime-local" id="editDateTime-${run.id}" required>
                  </div>
                  <div class="form-group">
                    <label for="editMaxParticipants-${run.id}">Max Participants *</label>
                    <input type="number" id="editMaxParticipants-${run.id}" required min="1">
                  </div>
                  <div class="form-group">
                    <label for="editDescription-${run.id}">Event Description (Optional)</label>
                    <textarea id="editDescription-${run.id}" rows="4" placeholder="Add details about your event..."></textarea>
                  </div>
                  <div class="form-group">
                    <label for="editPicture-${run.id}">Event Picture (Optional)</label>
                    <input type="file" id="editPicture-${run.id}" accept="image/*">
                    <small style="display: block; margin-top: 4px; color: var(--text-gray); font-size: 14px;">Upload a new image or leave empty to keep current</small>
                    <div id="editPicturePreview-${run.id}" style="margin-top: 12px;">
                      <div id="editCurrentPicture-${run.id}" style="display: none;">
                        <p style="font-size: 14px; color: var(--text-gray); margin-bottom: 8px;">Current picture:</p>
                        <img id="editCurrentPictureImg-${run.id}" src="" alt="Current picture" style="width: 100%; height: auto; max-height: 600px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border-gray); margin-bottom: 8px;">
                        <button type="button" class="button button-secondary" onclick="removeEditPicture('${run.id}')">Remove Picture</button>
                      </div>
                      <div id="editNewPicturePreview-${run.id}" style="display: none;">
                        <p style="font-size: 14px; color: var(--text-gray); margin-bottom: 8px;">New picture:</p>
                        <img id="editNewPictureImg-${run.id}" src="" alt="New picture preview" style="width: 100%; height: auto; max-height: 600px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border-gray);">
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; gap: 12px;">
                    <button type="submit" class="button button-primary">Save Changes</button>
                    <button type="button" class="button button-secondary" onclick="cancelEdit('${run.id}')">Cancel</button>
                  </div>
                </form>
                <div id="editError-${run.id}" class="message message-error" style="display: none; margin-top: 12px;"></div>
              </div>
            </div>
          </div>
        `;
      }).join('') + '</div>';
      
      // No longer need click handlers for row expansion since we have dropdown buttons
    }

    loading.style.display = 'none';
    runsList.style.display = 'block';
    
    // Don't initialize maps here - they're hidden. Initialize when edit form opens instead.
    currentRuns.forEach(run => {
      // Load signups for each run (ensure signups array exists)
      loadSignupsForRun(run.id, run.signups || []);
    });
  } catch (error) {
    loading.style.display = 'none';
    runsList.innerHTML = '<p class="message message-error">Error loading runs: ' + error.message + '</p>';
    runsList.style.display = 'block';
  }
}

function editRun(runId) {
  const run = currentRuns.find(r => r.id === runId || r.uuid === runId);
  if (!run) return;

  const date = new Date(run.dateTime);
  const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  // Populate form fields
  document.getElementById(`editTitle-${runId}`).value = run.title || '';
  document.getElementById(`editLocation-${runId}`).value = run.location;
  document.getElementById(`editPacerName-${runId}`).value = run.pacerName || '';
  document.getElementById(`editDateTime-${runId}`).value = localDateTime;
  document.getElementById(`editMaxParticipants-${runId}`).value = run.maxParticipants;
  document.getElementById(`editDescription-${runId}`).value = run.description || '';
  
  // Handle picture - show existing if present
  const currentPictureDiv = document.getElementById(`editCurrentPicture-${runId}`);
  const currentPictureImg = document.getElementById(`editCurrentPictureImg-${runId}`);
  if (run.picture) {
    currentPictureImg.src = 'data:image/jpeg;base64,' + run.picture;
    currentPictureDiv.style.display = 'block';
    editPictures[runId] = run.picture; // Store existing picture
  } else {
    currentPictureDiv.style.display = 'none';
    editPictures[runId] = null;
  }
  
  // Setup picture file input handler
  const pictureInput = document.getElementById(`editPicture-${runId}`);
  pictureInput.onchange = async (e) => {
    const file = e.target.files[0];
    const newPreview = document.getElementById(`editNewPicturePreview-${runId}`);
    const newImg = document.getElementById(`editNewPictureImg-${runId}`);
    const errorDiv = document.getElementById(`editError-${runId}`);
    
    if (!file) {
      newPreview.style.display = 'none';
      editPictures[runId] = editPictures[runId] || null; // Keep existing if no new file
      return;
    }
    
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image file size must be less than 5MB');
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
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
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality compression (0.8 = 80% quality)
          const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          
          // Check final size (max 2MB after compression)
          const sizeInMB = (base64.length * 3) / 4 / 1024 / 1024;
          if (sizeInMB > 2) {
            throw new Error(`Image is still too large after compression (${sizeInMB.toFixed(2)}MB). Please use a smaller image.`);
          }
          
          editPictures[runId] = base64;
          newImg.src = 'data:image/jpeg;base64,' + base64;
          newPreview.style.display = 'block';
          errorDiv.style.display = 'none';
        };
        img.onerror = () => {
          throw new Error('Failed to load image');
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
      e.target.value = '';
    }
  };

  // Show edit form and hide edit button, ensure details are expanded
  const detailsContainer = document.getElementById(`details-${runId}`);
  if (detailsContainer) {
    detailsContainer.style.display = 'block';
    const listItem = detailsContainer.closest('.list-item');
    if (listItem) {
      listItem.classList.add('expanded');
    }
  }
  document.getElementById(`editFormContainer-${runId}`).style.display = 'block';
  document.getElementById(`editButton-${runId}`).style.display = 'none';
  document.getElementById(`editError-${runId}`).style.display = 'none';
  
  // Initialize map after container is visible - use requestAnimationFrame to ensure DOM is ready
  const mapContainer = document.getElementById(`locationMap-${runId}`);
  if (mapContainer && run.location) {
    // Show map container first
    mapContainer.style.display = 'block';
    
    // Use requestAnimationFrame to ensure the container has dimensions before initializing map
    requestAnimationFrame(() => {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        // Check if we have cached coordinates to avoid re-geocoding
        if (run.coordinates && Array.isArray(run.coordinates) && run.coordinates.length === 2) {
          // Use cached coordinates for faster rendering
          initMap(`locationMap-${runId}`, run.coordinates, run.location, true);
        } else {
          // Fall back to geocoding if no coordinates cached
          updateMapForLocation(`locationMap-${runId}`, run.location, true);
        }
      }, 50);
    });
  }
  
  // Scroll to form
  document.getElementById(`editFormContainer-${runId}`).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cancelEdit(runId) {
  document.getElementById(`editFormContainer-${runId}`).style.display = 'none';
  document.getElementById(`editButton-${runId}`).style.display = 'inline-block';
  document.getElementById(`editError-${runId}`).style.display = 'none';
  
  // Hide map when canceling edit
  const mapContainer = document.getElementById(`locationMap-${runId}`);
  if (mapContainer) {
    mapContainer.style.display = 'none';
  }
  
  // Clear picture data
  editPictures[runId] = undefined;
}

// Remove picture from edit form
function removeEditPicture(runId) {
  editPictures[runId] = null; // Set to null to remove picture
  const currentPictureDiv = document.getElementById(`editCurrentPicture-${runId}`);
  const newPreview = document.getElementById(`editNewPicturePreview-${runId}`);
  const pictureInput = document.getElementById(`editPicture-${runId}`);
  
  if (currentPictureDiv) currentPictureDiv.style.display = 'none';
  if (newPreview) newPreview.style.display = 'none';
  if (pictureInput) pictureInput.value = '';
}

// Debounce function for map updates
let mapUpdateTimeout = {};
function updateEditMap(runId) {
  const locationInput = document.getElementById(`editLocation-${runId}`);
  const mapContainer = document.getElementById(`locationMap-${runId}`);
  
  if (!locationInput || !mapContainer) return;
  
  const locationText = locationInput.value.trim();
  
  // Clear existing timeout
  if (mapUpdateTimeout[runId]) {
    clearTimeout(mapUpdateTimeout[runId]);
  }
  
  // Debounce map updates - wait 500ms after user stops typing
  mapUpdateTimeout[runId] = setTimeout(() => {
    if (locationText) {
      mapContainer.style.display = 'block';
      updateMapForLocation(`locationMap-${runId}`, locationText, true);
    } else {
      mapContainer.style.display = 'none';
    }
  }, 500);
}

async function saveRunEdit(event, runId) {
  event.preventDefault();

  const description = document.getElementById(`editDescription-${runId}`)?.value.trim() || null;
  const picture = editPictures[runId] !== undefined ? editPictures[runId] : undefined;
  
  const formData = {
    title: document.getElementById(`editTitle-${runId}`).value.trim(),
    location: document.getElementById(`editLocation-${runId}`).value.trim(),
    plannerName: document.getElementById(`editPacerName-${runId}`).value.trim(),
    dateTime: document.getElementById(`editDateTime-${runId}`).value,
    maxParticipants: parseInt(document.getElementById(`editMaxParticipants-${runId}`).value),
    description: description
  };
  
  // Only include picture if it was changed
  if (picture !== undefined) {
    formData.picture = picture;
  }

  const errorDiv = document.getElementById(`editError-${runId}`);
  errorDiv.style.display = 'none';

  try {
    const response = await fetch(`/api/runs/${runId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update event');
    }

    cancelEdit(runId);
    loadRuns();
    loadReport();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
  }
}

function loadSignupsForRun(runId, signups) {
  const signupList = document.getElementById(`signupList-${runId}`);
  if (!signupList) return;
  
  if (!signups || signups.length === 0) {
    signupList.innerHTML = '<li style="padding: 16px; text-align: center; color: #2f3b52;">No signups yet</li>';
  } else {
    signupList.innerHTML = signups.map(signup => {
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
      
      return `<li class="signup-item">${signup.name} - ${phoneDisplay}${contactInfo} - ${formattedDate} - Waiver: ${signup.waiverAccepted ? 'Yes' : 'No'}</li>`;
    }).join('');
  }
}

function toggleLinks(runId) {
  const dropdown = document.getElementById(`linksDropdown-${runId}`);
  const icon = document.getElementById(`linksIcon-${runId}`);
  
  if (!dropdown || !icon) return;
  
  const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
  dropdown.style.display = isHidden ? 'block' : 'none';
  icon.textContent = isHidden ? '▲' : '▼';
}

function toggleSignups(runId) {
  const dropdown = document.getElementById(`signupsDropdown-${runId}`);
  const icon = document.getElementById(`signupsIcon-${runId}`);
  
  if (!dropdown || !icon) return;
  
  const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
  dropdown.style.display = isHidden ? 'block' : 'none';
  icon.textContent = isHidden ? '▲' : '▼';
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Link copied to clipboard');
  });
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('copy-button') && e.target.dataset.link) {
    copyToClipboard(e.target.dataset.link);
  } else if (e.target.classList.contains('copy-whatsapp-button') && e.target.dataset.message) {
    const message = e.target.dataset.message.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    navigator.clipboard.writeText(message).then(() => {
      alert('WhatsApp message copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy WhatsApp message');
    });
  }
});

async function deleteRun(runId) {
  if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/runs/${runId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete event');
    }

    loadRuns();
    loadReport();
  } catch (error) {
    alert('Error deleting event: ' + error.message);
  }
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

// Format date in EST timezone
function formatDateEST(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }) + ' EST';
}

// Load and display report
async function loadReport() {
  const reportLoading = document.getElementById('reportLoading');
  const reportTableContainer = document.getElementById('reportTableContainer');
  
  reportLoading.style.display = 'block';
  reportTableContainer.style.display = 'none';

  try {
    const response = await fetch('/api/runs');
    const data = await response.json();
    reportRuns = data.runs || [];
    
    // Sort by pacer by default
    sortReport('pacer');
    
    reportLoading.style.display = 'none';
    reportTableContainer.style.display = 'block';
  } catch (error) {
    reportLoading.style.display = 'none';
    reportTableContainer.innerHTML = '<p class="message message-error">Error loading report: ' + error.message + '</p>';
    reportTableContainer.style.display = 'block';
  }
}

// Sort report table
function sortReport(column) {
  // Toggle direction if clicking same column
  if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = column;
    currentSortDirection = 'asc';
  }

  // Sort the runs
  const sorted = [...reportRuns].sort((a, b) => {
    let aVal, bVal;
    
    switch (column) {
      case 'city':
        aVal = extractCity(a.location).toLowerCase();
        bVal = extractCity(b.location).toLowerCase();
        break;
      case 'created':
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
        break;
      case 'scheduled':
        aVal = new Date(a.dateTime || 0).getTime();
        bVal = new Date(b.dateTime || 0).getTime();
        break;
      case 'pacer':
        aVal = (a.pacerName || '').toLowerCase();
        bVal = (b.pacerName || '').toLowerCase();
        break;
      case 'status':
        aVal = (a.status || 'active').toLowerCase();
        bVal = (b.status || 'active').toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Update sort icons
  document.querySelectorAll('[id^="sortIcon-"]').forEach(icon => {
    icon.textContent = '';
  });
  const sortIcon = document.getElementById(`sortIcon-${column}`);
  if (sortIcon) {
    sortIcon.textContent = currentSortDirection === 'asc' ? ' ▲' : ' ▼';
  }

  // Render table
  renderReportTable(sorted);
}

// Render report table
function renderReportTable(runs) {
  const tbody = document.getElementById('reportTableBody');
  
  if (runs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding: 20px; text-align: center; color: var(--text-gray);">No runs found</td></tr>';
    return;
  }

  tbody.innerHTML = runs.map(run => {
    const city = extractCity(run.location);
    const createdEST = formatDateEST(run.createdAt);
    const scheduledDate = new Date(run.dateTime).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const pacerName = run.pacerName || '';
    const status = run.status || 'active';
    const title = run.title || '';
    const location = run.location || '';
    const baseUrl = window.location.origin;
    const manageLink = `${baseUrl}/manage.html?id=${run.id}`;
    
    return `
      <tr style="border-bottom: 1px solid var(--border-gray);">
        <td style="padding: 12px;">${city}</td>
        <td style="padding: 12px;">${createdEST}</td>
        <td style="padding: 12px;">${scheduledDate}</td>
        <td style="padding: 12px;">${pacerName}</td>
        <td style="padding: 12px;">
          <span class="status-badge ${status === 'active' ? 'status-open' : status === 'completed' ? 'status-full' : ''}">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>
        <td style="padding: 12px;">${title || '-'}</td>
        <td style="padding: 12px;">${location}</td>
        <td style="padding: 12px;">
          <a href="${manageLink}" target="_blank" class="button button-secondary button-sm" style="text-decoration: none; display: inline-block;">Manage</a>
        </td>
      </tr>
    `;
  }).join('');
}

// Load and display runners report
async function loadRunnersReport() {
  const runnersReportLoading = document.getElementById('runnersReportLoading');
  const runnersReportTableContainer = document.getElementById('runnersReportTableContainer');
  
  runnersReportLoading.style.display = 'block';
  runnersReportTableContainer.style.display = 'none';

  try {
    const response = await fetch('/api/runs');
    const data = await response.json();
    const allRuns = data.runs || [];
    
    // Aggregate runners by phone number
    const runnersMap = new Map();
    
    allRuns.forEach(run => {
      if (run.signups && Array.isArray(run.signups)) {
        run.signups.forEach(signup => {
          const phone = signup.phone ? signup.phone.replace(/\D/g, '') : '';
          if (!phone) return;
          
          if (!runnersMap.has(phone)) {
            runnersMap.set(phone, {
              phone: phone,
              name: signup.name || '',
              email: signup.email || '',
              runs: new Set(),
              pacers: new Set()
            });
          }
          
          const runner = runnersMap.get(phone);
          runner.runs.add(run.id);
          if (run.pacerName) {
            runner.pacers.add(run.pacerName);
          }
          // Update name/email if we have newer data
          if (signup.name && signup.name.trim()) {
            runner.name = signup.name.trim();
          }
          if (signup.email && signup.email.trim()) {
            runner.email = signup.email.trim();
          }
        });
      }
    });
    
    // Convert to array and format
    runnersReportData = Array.from(runnersMap.values()).map(runner => ({
      phone: runner.phone,
      name: runner.name,
      email: runner.email,
      runsCount: runner.runs.size,
      pacersCount: runner.pacers.size
    }));
    
    // Sort by name by default
    sortRunnersReport('name');
    
    runnersReportLoading.style.display = 'none';
    runnersReportTableContainer.style.display = 'block';
  } catch (error) {
    runnersReportLoading.style.display = 'none';
    runnersReportTableContainer.innerHTML = '<p class="message message-error">Error loading runners report: ' + error.message + '</p>';
    runnersReportTableContainer.style.display = 'block';
  }
}

// Sort runners report table
function sortRunnersReport(column) {
  // Toggle direction if clicking same column
  if (currentRunnersSortColumn === column) {
    currentRunnersSortDirection = currentRunnersSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentRunnersSortColumn = column;
    currentRunnersSortDirection = 'asc';
  }

  // Sort the runners
  const sorted = [...runnersReportData].sort((a, b) => {
    let aVal, bVal;
    
    switch (column) {
      case 'name':
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
        break;
      case 'email':
        aVal = (a.email || '').toLowerCase();
        bVal = (b.email || '').toLowerCase();
        break;
      case 'phone':
        aVal = a.phone || '';
        bVal = b.phone || '';
        break;
      case 'runs':
        aVal = a.runsCount || 0;
        bVal = b.runsCount || 0;
        break;
      case 'pacers':
        aVal = a.pacersCount || 0;
        bVal = b.pacersCount || 0;
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return currentRunnersSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentRunnersSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Update sort icons
  document.querySelectorAll('[id^="sortIcon-runners-"]').forEach(icon => {
    icon.textContent = '';
  });
  const sortIcon = document.getElementById(`sortIcon-runners-${column}`);
  if (sortIcon) {
    sortIcon.textContent = currentRunnersSortDirection === 'asc' ? ' ▲' : ' ▼';
  }

  // Render table
  renderRunnersReportTable(sorted);
}

// Render runners report table
function renderRunnersReportTable(runners) {
  const tbody = document.getElementById('runnersReportTableBody');
  
  if (runners.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-gray);">No runners found</td></tr>';
    return;
  }

  tbody.innerHTML = runners.map(runner => {
    const formattedPhone = formatPhoneNumber(runner.phone);
    
    return `
      <tr style="border-bottom: 1px solid var(--border-gray);">
        <td style="padding: 12px;">${runner.name || '-'}</td>
        <td style="padding: 12px;">${runner.email || '-'}</td>
        <td style="padding: 12px;">${formattedPhone}</td>
        <td style="padding: 12px;">${runner.runsCount}</td>
        <td style="padding: 12px;">${runner.pacersCount}</td>
      </tr>
    `;
  }).join('');
}

