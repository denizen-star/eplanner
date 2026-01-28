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
let adminSortColumn = 'createdAt';
let adminSortDirection = 'desc'; // Default: newest first

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
    } else if (sectionId === 'tenantManager') {
      if (typeof initTenantManager === 'function') initTenantManager();
    }
  }
}


// Sort admin dashboard runs
function sortAdminRuns(column) {
  // Toggle direction if clicking same column
  if (adminSortColumn === column) {
    adminSortDirection = adminSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    adminSortColumn = column;
    adminSortDirection = 'asc';
  }
  
  // Sort the runs
  const sorted = [...currentRuns].sort((a, b) => {
    let aVal, bVal;
    
    if (column === 'eventName') {
      aVal = (a.title || '').toLowerCase();
      bVal = (b.title || '').toLowerCase();
    } else if (column === 'createdBy') {
      aVal = (a.plannerName || a.pacerName || '').toLowerCase();
      bVal = (b.plannerName || b.pacerName || '').toLowerCase();
    } else if (column === 'createdAt') {
      aVal = new Date(a.createdAt || 0).getTime();
      bVal = new Date(b.createdAt || 0).getTime();
    } else {
      return 0;
    }
    
    if (aVal < bVal) return adminSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return adminSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  currentRuns = sorted;
  renderAdminTable();
  
  // Update sort icons
  document.querySelectorAll('.admin-sort-icon').forEach(icon => icon.textContent = '');
  const activeIcon = document.getElementById(`adminSortIcon-${column}`);
  if (activeIcon) {
    activeIcon.textContent = adminSortDirection === 'asc' ? ' ▲' : ' ▼';
  }
}

// Render admin dashboard as table
function renderAdminTable() {
  const runsList = document.getElementById('runsList');
  if (!runsList) return;
  
  // Sort runs based on current sort settings
  const sortedRuns = [...currentRuns].sort((a, b) => {
    let aVal, bVal;
    
    if (adminSortColumn === 'eventName') {
      aVal = (a.title || '').toLowerCase();
      bVal = (b.title || '').toLowerCase();
    } else if (adminSortColumn === 'createdBy') {
      aVal = (a.plannerName || a.pacerName || '').toLowerCase();
      bVal = (b.plannerName || b.pacerName || '').toLowerCase();
    } else if (adminSortColumn === 'createdAt') {
      aVal = new Date(a.createdAt || 0).getTime();
      bVal = new Date(b.createdAt || 0).getTime();
    } else {
      return 0;
    }
    
    if (aVal < bVal) return adminSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return adminSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  if (sortedRuns.length === 0) {
    runsList.innerHTML = '<p>No events created yet. <a href="coordinate.html">Create your first event</a></p>';
    return;
  }
  
  // Build table HTML
  let tableHTML = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background: var(--light-gray-1); border-bottom: 2px solid var(--border-gray);">
          <th onclick="sortAdminRuns('eventName')" style="padding: 12px; text-align: left; cursor: pointer; font-weight: 600;">
            Event Name <span id="adminSortIcon-eventName" class="admin-sort-icon"></span>
          </th>
          <th onclick="sortAdminRuns('createdBy')" style="padding: 12px; text-align: left; cursor: pointer; font-weight: 600;">
            Created By <span id="adminSortIcon-createdBy" class="admin-sort-icon"></span>
          </th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Location</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Date/Time</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;"></th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  sortedRuns.forEach(run => {
    const date = new Date(run.dateTime);
    const timezone = run.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
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
    const isDisabled = run.status === 'completed' || run.status === 'deleted' || run.status === 'cancelled';
    const isCancelled = run.status === 'cancelled';
    const statusText = run.status === 'completed' ? 'Completed' : run.status === 'deleted' ? 'Deleted' : run.status === 'cancelled' ? 'Cancelled' : 'Active';
    
    const eventStartTime = new Date(run.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
    const canEdit = hoursUntilEvent >= 24 && run.status !== 'cancelled';
    
    // Generate WhatsApp message for active runs
    let whatsappMessageHtml = '';
    if (!isDisabled) {
      const whatsappMessage = generateWhatsAppMessage(run, signupLink);
      const whatsappMessageEscaped = whatsappMessage.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '&#10;');
      whatsappMessageHtml = `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-gray);">
          <strong style="display: block; margin-bottom: 8px; color: var(--text-dark);">WhatsApp Message:</strong>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 8px; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.4; max-height: 200px; overflow-y: auto;">${whatsappMessage.replace(/\n/g, '<br>')}</div>
          <button class="button button-primary copy-whatsapp-button" data-message="${whatsappMessageEscaped}" style="width: 100%; padding: 6px 12px; font-size: 12px;" data-track-cta="copy_whatsapp_message_click">Copy WhatsApp Message</button>
        </div>
      `;
    }
    
    // Status pill styling
    let statusPillClass = 'status-badge';
    let statusPillStyle = '';
    if (isCancelled) {
      statusPillClass += ' status-cancelled';
      statusPillStyle = 'background: rgba(239, 68, 68, 0.2); color: #dc2626;';
    } else if (spotsLeft > 0) {
      statusPillClass += ' status-open';
    } else {
      statusPillClass += ' status-full';
    }
    
    // Event name and location with strikethrough if cancelled
    const eventNameDisplay = isCancelled ? `<span style="text-decoration: line-through;">${runTitle || 'Untitled Event'}</span>` : (runTitle || 'Untitled Event');
    const locationDisplay = isCancelled ? `<span style="text-decoration: line-through;">${run.location}</span>` : run.location;
    
    tableHTML += `
      <tr class="admin-table-row" data-run-id="${run.id}" style="border-bottom: 1px solid var(--border-light); cursor: pointer;" onclick="toggleRowDetails('${run.id}', event)">
        <td style="padding: 12px;">${eventNameDisplay}${pacerName ? `<br><span style="font-size: 12px; color: var(--text-gray);">${pacerName}</span>` : ''}</td>
        <td style="padding: 12px; font-size: 14px;">${pacerName || 'N/A'}</td>
        <td style="padding: 12px; font-size: 14px;">${locationDisplay}</td>
        <td style="padding: 12px; font-size: 14px;">${formattedDate}</td>
        <td style="padding: 12px;">
          <span class="${statusPillClass}" style="${statusPillStyle} padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; display: inline-block;">${statusText}</span>
        </td>
        <td style="padding: 12px;">
          <span class="admin-row-expand-icon" id="rowExpandIcon-${run.id}">▶</span>
        </td>
        <td style="padding: 12px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button class="button button-secondary" onclick="event.stopPropagation(); editRun('${run.id}')" id="editButton-${run.id}" ${!canEdit ? 'disabled title="Event cannot be modified within 24 hours of start time"' : ''} data-track-cta="edit_button_click" style="padding: 6px 12px; font-size: 12px;">Edit</button>
            <div class="admin-dropdown" style="position: relative;">
              <button class="button button-secondary button-sm admin-dropdown-toggle" onclick="event.stopPropagation(); toggleActions('${run.id}')" id="actionsToggle-${run.id}" style="padding: 6px 12px; font-size: 12px;">
                Actions <span class="dropdown-icon" id="actionsIcon-${run.id}">▼</span>
              </button>
              <div class="admin-dropdown-menu" id="actionsDropdown-${run.id}" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; background: white; border: 1px solid var(--border-gray); border-radius: 8px; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; min-width: 120px;">
                <div class="dropdown-content">
                  <button class="button button-danger-pill" onclick="event.stopPropagation(); cancelEvent('${run.id}')" id="cancelButton-${run.id}" ${run.status === 'cancelled' || eventStartTime < now ? 'disabled title="' + (run.status === 'cancelled' ? 'Event already cancelled' : 'Event cannot be cancelled after it has started') + '"' : ''} data-track-cta="cancel_button_click" style="width: 100%; margin-bottom: 4px; padding: 6px 12px; font-size: 12px; background: rgba(239, 68, 68, 0.2); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px;">Cancel</button>
                  <button class="button button-primary-pill" onclick="event.stopPropagation(); deleteRun('${run.id}')" data-track-cta="delete_button_click" style="width: 100%; padding: 6px 12px; font-size: 12px; background: rgba(59, 130, 246, 0.2); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px;">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
      <tr class="admin-table-details-row" id="rowDetails-${run.id}" style="display: none; background: var(--bg-secondary);">
        <td colspan="7" style="padding: 20px;">
          <div style="max-width: 800px;">
            <div style="margin-bottom: 16px;">
              <strong style="display: block; margin-bottom: 8px; color: var(--text-dark);">Signups (${signupsArray.length} / ${run.maxParticipants}):</strong>
              <ul class="signup-list" id="signupList-${run.id}" style="max-height: 200px; overflow-y: auto; list-style: none; padding: 0;"></ul>
            </div>
            <div style="margin-bottom: 12px; padding-top: 12px; border-top: 1px solid var(--border-gray);">
              <strong style="display: block; margin-bottom: 4px; color: var(--text-dark);">Signup Link:</strong>
              ${isDisabled ? `<div style="color: var(--text-gray); font-size: 12px; margin-bottom: 4px;">Event ${statusText.toLowerCase()}</div>` : ''}
              <div class="link-display" style="margin: 0;">
                ${isDisabled ? 
                  `<span style="font-size: 12px; color: #999; text-decoration: line-through; font-family: 'Courier New', monospace; word-break: break-all;">${signupLink}</span>` :
                  `<a href="${signupLink}" target="_blank" style="font-size: 12px; color: var(--text-gray); text-decoration: underline; font-family: 'Courier New', monospace; word-break: break-all;">${signupLink}</a>`
                }
                ${!isDisabled ? `<button class="button button-secondary copy-button" data-link="${signupLink}" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;" data-track-cta="copy_signup_link_click">Copy</button>` : ''}
              </div>
            </div>
            <div style="margin-bottom: 12px;">
              <strong style="display: block; margin-bottom: 4px; color: var(--text-dark);">Management Link:</strong>
              ${isDisabled ? `<div style="color: var(--text-gray); font-size: 12px; margin-bottom: 4px;">Event ${statusText.toLowerCase()}</div>` : ''}
              <div class="link-display" style="margin: 0;">
                ${isDisabled ? 
                  `<span style="font-size: 12px; color: #999; text-decoration: line-through; font-family: 'Courier New', monospace; word-break: break-all;">${manageLink}</span>` :
                  `<a href="${manageLink}" target="_blank" style="font-size: 12px; color: var(--text-gray); text-decoration: underline; font-family: 'Courier New', monospace; word-break: break-all;">${manageLink}</a>`
                }
                ${!isDisabled ? `<button class="button button-secondary copy-button" data-link="${manageLink}" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;" data-track-cta="copy_manage_link_click">Copy</button>` : ''}
              </div>
            </div>
            ${whatsappMessageHtml}
          </div>
        </td>
      </tr>
      <tr class="admin-table-edit-row" id="editFormContainer-${run.id}" style="display: none; background: var(--bg-secondary);">
        <td colspan="7" style="padding: 20px;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="margin-bottom: 16px;">Edit Event</h2>
            <form onsubmit="saveRunEdit(event, '${run.id}')" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid var(--border-gray);">
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="editTitle-${run.id}" style="display: block; margin-bottom: 4px; font-weight: 500;">Event Title (Optional)</label>
                <input type="text" id="editTitle-${run.id}" placeholder="e.g., Morning Beach Run" style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="editLocation-${run.id}" style="display: block; margin-bottom: 4px; font-weight: 500;">Location *</label>
                <input type="text" id="editLocation-${run.id}" required oninput="updateEditMap('${run.id}')" style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="editPacerName-${run.id}" style="display: block; margin-bottom: 4px; font-weight: 500;">Planner Name *</label>
                <input type="text" id="editPacerName-${run.id}" required style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="editDateTime-${run.id}" style="display: block; margin-bottom: 4px; font-weight: 500;">Date and Time *</label>
                <input type="datetime-local" id="editDateTime-${run.id}" required style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="editMaxParticipants-${run.id}" style="display: block; margin-bottom: 4px; font-weight: 500;">Max Participants *</label>
                <input type="number" id="editMaxParticipants-${run.id}" required min="1" style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="editDescription-${run.id}" style="display: block; margin-bottom: 4px; font-weight: 500;">Description (Optional)</label>
                <textarea id="editDescription-${run.id}" rows="4" placeholder="Event description..." style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px; resize: vertical;"></textarea>
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="editWebsite-${run.id}" style="display: block; margin-bottom: 4px; font-weight: 500;">Event Website (Optional)</label>
                <input type="url" id="editWebsite-${run.id}" placeholder="e.g., https://example.com" style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">
                <div style="margin-top: 8px;">
                  <input type="checkbox" id="editExternalSignupEnabled-${run.id}">
                  <label for="editExternalSignupEnabled-${run.id}" style="margin-left: 4px;">Use this URL for external signups</label>
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="editInstagram-${run.id}" style="display: block; margin-bottom: 4px; font-weight: 500;">Event Instagram (Optional)</label>
                <input type="text" id="editInstagram-${run.id}" placeholder="e.g., @handle or https://instagram.com/..." style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Event Picture</label>
                <div id="editCurrentPicture-${run.id}" style="margin-bottom: 8px; display: none;">
                  <p style="font-size: 12px; color: var(--text-gray); margin-bottom: 4px;">Current Picture:</p>
                  <img id="editCurrentPictureImg-${run.id}" style="max-width: 200px; border-radius: 4px; border: 1px solid var(--border-gray);">
                  <button type="button" class="button button-secondary" onclick="removeEditPicture('${run.id}')" style="margin-left: 8px; padding: 4px 8px; font-size: 12px;">Remove</button>
                </div>
                <input type="file" id="editPicture-${run.id}" accept="image/*" style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">
                <div id="editNewPicturePreview-${run.id}" style="margin-top: 8px; display: none;">
                  <p style="font-size: 12px; color: var(--text-gray); margin-bottom: 4px;">New Picture Preview:</p>
                  <img id="editNewPictureImg-${run.id}" style="max-width: 200px; border-radius: 4px; border: 1px solid var(--border-gray);">
                </div>
              </div>
              <div id="locationMap-${run.id}" style="width: 100%; height: 300px; margin-bottom: 16px; display: none; border: 1px solid var(--border-gray); border-radius: 4px;"></div>
              <div id="editError-${run.id}" class="message message-error" style="display: none; margin-bottom: 16px;"></div>
              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="button button-secondary" onclick="cancelEdit('${run.id}')" style="padding: 8px 16px;">Cancel</button>
                <button type="submit" class="button button-primary" style="padding: 8px 16px;">Save Changes</button>
              </div>
            </form>
          </div>
        </td>
      </tr>
    `;
    
    // Load signups for this run
    setTimeout(() => loadSignupsForRun(run.id, signupsArray), 0);
  });
  
  tableHTML += `
      </tbody>
    </table>
  `;
  
  runsList.innerHTML = tableHTML;
  
  // Update sort icons
  document.querySelectorAll('.admin-sort-icon').forEach(icon => icon.textContent = '');
  const activeIcon = document.getElementById(`adminSortIcon-${adminSortColumn}`);
  if (activeIcon) {
    activeIcon.textContent = adminSortDirection === 'asc' ? ' ▲' : ' ▼';
  }
}

// Toggle row details expansion
function toggleRowDetails(runId, event) {
  // Don't expand if clicking on buttons, links, or inputs
  if (event && (event.target.tagName === 'BUTTON' || event.target.tagName === 'A' || event.target.tagName === 'INPUT' || event.target.closest('button') || event.target.closest('a'))) {
    return;
  }
  
  const detailsRow = document.getElementById(`rowDetails-${runId}`);
  const expandIcon = document.getElementById(`rowExpandIcon-${runId}`);
  
  if (!detailsRow || !expandIcon) return;
  
  const isHidden = detailsRow.style.display === 'none' || !detailsRow.style.display;
  detailsRow.style.display = isHidden ? 'table-row' : 'none';
  expandIcon.textContent = isHidden ? '▼' : '▶';
}

// Toggle actions dropdown
function toggleActions(runId) {
  const dropdown = document.getElementById(`actionsDropdown-${runId}`);
  const icon = document.getElementById(`actionsIcon-${runId}`);
  
  if (!dropdown || !icon) return;
  
  // Close all other dropdowns
  document.querySelectorAll('.admin-dropdown-menu').forEach(menu => {
    if (menu.id !== `actionsDropdown-${runId}`) {
      menu.style.display = 'none';
    }
  });
  document.querySelectorAll('.dropdown-icon').forEach(ic => {
    if (ic.id !== `actionsIcon-${runId}`) {
      ic.textContent = '▼';
    }
  });
  
  const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
  dropdown.style.display = isHidden ? 'block' : 'none';
  icon.textContent = isHidden ? '▲' : '▼';
}

// Toggle details dropdown (combines signups and links) - kept for backward compatibility
function toggleDetails(runId) {
  const dropdown = document.getElementById(`detailsDropdown-${runId}`);
  const icon = document.getElementById(`detailsIcon-${runId}`);
  
  if (!dropdown || !icon) return;
  
  const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
  dropdown.style.display = isHidden ? 'block' : 'none';
  icon.textContent = isHidden ? '▲' : '▼';
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
      runsList.style.display = 'block';
      renderAdminTable();
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
  const websiteEl = document.getElementById(`editWebsite-${runId}`);
  const instagramEl = document.getElementById(`editInstagram-${runId}`);
  const externalEl = document.getElementById(`editExternalSignupEnabled-${runId}`);
  if (websiteEl) websiteEl.value = run.eventWebsite || '';
  if (instagramEl) instagramEl.value = run.eventInstagram || '';
  if (externalEl) externalEl.checked = !!run.externalSignupEnabled;

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

  // Show edit form and hide edit button
  const editFormContainer = document.getElementById(`editFormContainer-${runId}`);
  const editButton = document.getElementById(`editButton-${runId}`);
  const editError = document.getElementById(`editError-${runId}`);
  
  if (editFormContainer) editFormContainer.style.display = 'table-row';
  if (editButton) editButton.style.display = 'none';
  if (editError) editError.style.display = 'none';
  
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
  const editFormContainer = document.getElementById(`editFormContainer-${runId}`);
  const editButton = document.getElementById(`editButton-${runId}`);
  const editError = document.getElementById(`editError-${runId}`);
  
  if (editFormContainer) editFormContainer.style.display = 'none';
  if (editButton) editButton.style.display = 'inline-block';
  if (editError) editError.style.display = 'none';
  
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

function _normWebsite(u) {
  if (!u || !String(u).trim()) return null;
  const t = String(u).trim();
  return /^https?:\/\//i.test(t) ? t : 'https://' + t;
}
function _normInstagram(i) {
  if (!i || !String(i).trim()) return null;
  const t = String(i).trim();
  const h = t.replace(/^@+/, '');
  if (!h) return null;
  return /^https?:\/\//i.test(t) ? t : 'https://instagram.com/' + h;
}

async function saveRunEdit(event, runId) {
  event.preventDefault();

  // Check if event can be edited (24-hour restriction)
  const run = currentRuns.find(r => r.id === runId || r.uuid === runId);
  if (run) {
    const eventStartTime = new Date(run.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < 24) {
      const errorDiv = document.getElementById(`editError-${runId}`);
      errorDiv.textContent = 'Event cannot be modified within 24 hours of the event start time.';
      errorDiv.style.display = 'block';
      return;
    }
    if (run.status === 'cancelled') {
      const errorDiv = document.getElementById(`editError-${runId}`);
      errorDiv.textContent = 'This event has been cancelled.';
      errorDiv.style.display = 'block';
      return;
    }
  }

  const description = document.getElementById(`editDescription-${runId}`)?.value.trim() || null;
  const picture = editPictures[runId] !== undefined ? editPictures[runId] : undefined;
  const websiteInput = document.getElementById(`editWebsite-${runId}`);
  const instagramInput = document.getElementById(`editInstagram-${runId}`);
  const externalCheckbox = document.getElementById(`editExternalSignupEnabled-${runId}`);
  const eventWebsite = websiteInput ? _normWebsite(websiteInput.value) : null;
  const eventInstagram = instagramInput ? _normInstagram(instagramInput.value) : null;
  const externalSignupEnabled = !!(externalCheckbox && externalCheckbox.checked);

  const errorDiv = document.getElementById(`editError-${runId}`);
  if (externalSignupEnabled && !eventWebsite) {
    errorDiv.textContent = 'Event website URL is required when "Use this URL for external signups" is enabled.';
    errorDiv.style.display = 'block';
    return;
  }

  const formData = {
    title: document.getElementById(`editTitle-${runId}`).value.trim(),
    location: document.getElementById(`editLocation-${runId}`).value.trim(),
    plannerName: document.getElementById(`editPacerName-${runId}`).value.trim(),
    dateTime: document.getElementById(`editDateTime-${runId}`).value,
    maxParticipants: parseInt(document.getElementById(`editMaxParticipants-${runId}`).value),
    description: description,
    eventWebsite: eventWebsite,
    eventInstagram: eventInstagram,
    externalSignupEnabled: externalSignupEnabled
  };
  
  // Only include picture if it was changed
  if (picture !== undefined) {
    formData.picture = picture;
  }

  errorDiv.style.display = 'none';

  // Convert datetime-local value to ISO string (required by backend)
  const dateTimeLocal = formData.dateTime;
  formData.dateTime = dateTimeLocal ? new Date(dateTimeLocal).toISOString() : null;

  try {
    // Always geocode location to get/update address components
    const locationText = formData.location;
    
    if (locationText && locationText.trim()) {
      errorDiv.textContent = 'Geocoding location to update address details...';
      errorDiv.style.display = 'block';
      errorDiv.className = 'message';
      
      try {
        console.log('[ADMIN EDIT] Geocoding location:', locationText.trim());
        const geocodeResult = await geocodeLocation(locationText.trim());
        console.log('[ADMIN EDIT] Geocoding result:', geocodeResult);
        
        const coordinates = geocodeResult.coordinates;
        const placeName = geocodeResult.placeName;
        const addr = geocodeResult.addressComponents || {};
        
        console.log('[ADMIN EDIT] Address components extracted:', {
          house_number: addr.house_number,
          road: addr.road || addr.street || addr.pedestrian,
          city: addr.city || addr.town || addr.village || addr.municipality,
          state: addr.state,
          postcode: addr.postcode,
          country: addr.country
        });
        
        // Extract address components (same pattern as event creation)
        const addressComponents = {
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
          municipality: addr.municipality || null
        };
        
        formData.coordinates = coordinates;
        formData.placeName = placeName;
        // Add all address component fields to formData
        Object.assign(formData, addressComponents);
        
        console.log('[ADMIN EDIT] Address components added to formData:', Object.keys(addressComponents));
        errorDiv.style.display = 'none';
      } catch (geocodeError) {
        console.error('[ADMIN EDIT] Geocoding error:', geocodeError);
        errorDiv.textContent = `Geocoding failed: ${geocodeError.message}. The location will be updated but address details may not be accurate.`;
        errorDiv.className = 'message message-error';
        errorDiv.style.display = 'block';
        // Continue with update even if geocoding fails
      }
    }

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
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.className = 'message message-error';
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

async function cancelEvent(runId) {
  const run = currentRuns.find(r => r.id === runId || r.uuid === runId);
  if (!run || !run.coordinatorEmail) {
    showErrorModal('Event not found or missing coordinator email');
    return;
  }

  // Set up success callback to reload runs list
  window.onCancellationSuccess = function() {
    
// Sort admin dashboard runs
function sortAdminRuns(column) {
  // Toggle direction if clicking same column
  if (adminSortColumn === column) {
    adminSortDirection = adminSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    adminSortColumn = column;
    adminSortDirection = 'asc';
  }
  
  // Sort the runs
  const sorted = [...currentRuns].sort((a, b) => {
    let aVal, bVal;
    
    if (column === 'eventName') {
      aVal = (a.title || '').toLowerCase();
      bVal = (b.title || '').toLowerCase();
    } else if (column === 'createdBy') {
      aVal = (a.plannerName || a.pacerName || '').toLowerCase();
      bVal = (b.plannerName || b.pacerName || '').toLowerCase();
    } else if (column === 'createdAt') {
      aVal = new Date(a.createdAt || 0).getTime();
      bVal = new Date(b.createdAt || 0).getTime();
    } else {
      return 0;
    }
    
    if (aVal < bVal) return adminSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return adminSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  currentRuns = sorted;
  renderAdminTable();
  
  // Update sort icons
  document.querySelectorAll('.admin-sort-icon').forEach(icon => icon.textContent = '');
  const activeIcon = document.getElementById(`adminSortIcon-${column}`);
  if (activeIcon) {
    activeIcon.textContent = adminSortDirection === 'asc' ? ' ▲' : ' ▼';
  }
}

loadRuns();
    loadReport();
  };

  // Initialize cancellation flow with modal (admin mode)
  initCancellationFlow(runId, run.coordinatorEmail, {
    isAdmin: true,
    onSuccess: () => {
      
// Sort admin dashboard runs
function sortAdminRuns(column) {
  // Toggle direction if clicking same column
  if (adminSortColumn === column) {
    adminSortDirection = adminSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    adminSortColumn = column;
    adminSortDirection = 'asc';
  }
  
  // Sort the runs
  const sorted = [...currentRuns].sort((a, b) => {
    let aVal, bVal;
    
    if (column === 'eventName') {
      aVal = (a.title || '').toLowerCase();
      bVal = (b.title || '').toLowerCase();
    } else if (column === 'createdBy') {
      aVal = (a.plannerName || a.pacerName || '').toLowerCase();
      bVal = (b.plannerName || b.pacerName || '').toLowerCase();
    } else if (column === 'createdAt') {
      aVal = new Date(a.createdAt || 0).getTime();
      bVal = new Date(b.createdAt || 0).getTime();
    } else {
      return 0;
    }
    
    if (aVal < bVal) return adminSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return adminSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  currentRuns = sorted;
  renderAdminTable();
  
  // Update sort icons
  document.querySelectorAll('.admin-sort-icon').forEach(icon => icon.textContent = '');
  const activeIcon = document.getElementById(`adminSortIcon-${column}`);
  if (activeIcon) {
    activeIcon.textContent = adminSortDirection === 'asc' ? ' ▲' : ' ▼';
  }
}

loadRuns();
      loadReport();
    }
  });
}

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

    
// Sort admin dashboard runs
function sortAdminRuns(column) {
  // Toggle direction if clicking same column
  if (adminSortColumn === column) {
    adminSortDirection = adminSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    adminSortColumn = column;
    adminSortDirection = 'asc';
  }
  
  // Sort the runs
  const sorted = [...currentRuns].sort((a, b) => {
    let aVal, bVal;
    
    if (column === 'eventName') {
      aVal = (a.title || '').toLowerCase();
      bVal = (b.title || '').toLowerCase();
    } else if (column === 'createdBy') {
      aVal = (a.plannerName || a.pacerName || '').toLowerCase();
      bVal = (b.plannerName || b.pacerName || '').toLowerCase();
    } else if (column === 'createdAt') {
      aVal = new Date(a.createdAt || 0).getTime();
      bVal = new Date(b.createdAt || 0).getTime();
    } else {
      return 0;
    }
    
    if (aVal < bVal) return adminSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return adminSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  currentRuns = sorted;
  renderAdminTable();
  
  // Update sort icons
  document.querySelectorAll('.admin-sort-icon').forEach(icon => icon.textContent = '');
  const activeIcon = document.getElementById(`adminSortIcon-${column}`);
  if (activeIcon) {
    activeIcon.textContent = adminSortDirection === 'asc' ? ' ▲' : ' ▼';
  }
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

