// Event details page functionality

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id') || urlParams.get('uuid');
const showSuccess = urlParams.get('success') === 'true';

// Check for success parameter and show success message
if (showSuccess) {
  showSuccessMessage();
}

if (!eventId) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('notFound').style.display = 'block';
} else {
  loadEvent();
}

/**
 * Show success message banner that auto-disappears after 5 seconds
 */
function showSuccessMessage() {
  const successDiv = document.getElementById('successMessage');
  if (!successDiv) return;
  
  successDiv.textContent = 'Successfully signed up for the event!';
  successDiv.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    successDiv.style.opacity = '0';
    successDiv.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
      successDiv.style.display = 'none';
      // Clean up URL by removing success parameter
      if (window.history && window.history.replaceState) {
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]success=true/, '').replace(/^\?&/, '?').replace(/&$/, '');
        window.history.replaceState({}, '', newUrl || window.location.pathname);
      }
    }, 500);
  }, 5000);
}

// Store event data globally for calendar functions to access
let currentEvent = null;
window.currentEvent = currentEvent; // Make available for inline handlers

async function loadEvent() {
  try {
    const response = await fetch(`/api/runs/${eventId}`);
    if (!response.ok) {
      throw new Error('Event not found');
    }
    const event = await response.json();
    
    // Store event globally for calendar functions
    currentEvent = event;
    window.currentEvent = event; // Make available for inline handlers

    document.getElementById('eventLocation').textContent = event.location;
    
    const eventTitleElement = document.getElementById('eventTitle');
    const plannerNameElement = document.getElementById('eventPlannerName');
    
    const eventTitleDisplay = event.title && typeof event.title === 'string' && event.title.trim() ? event.title.trim() : '';
    
    if (event.pacerName && typeof event.pacerName === 'string' && event.pacerName.trim()) {
      const plannerName = event.pacerName.trim();
      if (eventTitleDisplay) {
        eventTitleElement.textContent = `${eventTitleDisplay} - ${plannerName}`;
        document.title = `${eventTitleDisplay} - ${plannerName} - Event Planner`;
      } else {
        eventTitleElement.textContent = `Event with ${plannerName}`;
        document.title = `Event with ${plannerName} - Event Planner`;
      }
      if (plannerNameElement) plannerNameElement.textContent = plannerName;
    } else {
      if (eventTitleDisplay) {
        eventTitleElement.textContent = eventTitleDisplay;
        document.title = `${eventTitleDisplay} - Event Planner`;
      } else {
        eventTitleElement.textContent = 'Event';
        document.title = 'Event - Event Planner';
      }
      if (plannerNameElement) plannerNameElement.textContent = '-';
    }
    
    // Format date using stored timezone if available, otherwise use browser timezone
    const eventDate = new Date(event.dateTime);
    const timezone = event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.getElementById('eventDateTime').textContent = eventDate.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    document.getElementById('eventMax').textContent = event.maxParticipants;
    
    // Display created timestamp in EST
    if (event.createdAt) {
      const createdDate = new Date(event.createdAt);
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
      const createdElement = document.getElementById('eventCreated');
      if (createdElement) {
        createdElement.textContent = createdEST;
      }
    }

    if (event.location) {
      updateMapForLocation('locationMap', event.location, true);
    }

    // Add calendar links section (after map is loaded)
    setTimeout(() => {
      addCalendarLinksSection(event);
    }, 100);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('eventInfo').style.display = 'block';
    
    // Track event view
    if (window.Analytics?.safeTrack) {
      const eventSlug = eventTitleDisplay || event.id;
      window.Analytics.safeTrack('trackEventView', eventId, eventSlug);
      
      // Set up scroll tracking for event read events
      if (window.Analytics?.setupScrollTracking) {
        window.Analytics.setupScrollTracking(eventId, eventSlug);
      }
    }
  } catch (error) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('notFound').style.display = 'block';
  }
}

/**
 * Add calendar links section below event details
 */
function addCalendarLinksSection(event) {
  const eventInfoDiv = document.getElementById('eventInfo');
  if (!eventInfoDiv) return;
  
  // Check if calendar section already exists, if so remove it
  const existingCalendarSection = document.getElementById('calendarLinksSection');
  if (existingCalendarSection) {
    existingCalendarSection.remove();
  }
  
  try {
    const googleCalendarLink = generateGoogleCalendarLink(event);
    
    // Find where to insert (after map)
    const mapElement = document.getElementById('locationMap');
    
    const calendarSection = document.createElement('div');
    calendarSection.id = 'calendarLinksSection';
    calendarSection.style.cssText = 'margin-top: 24px; margin-bottom: 24px; padding-top: 24px; border-top: 2px solid var(--border-gray);';
    calendarSection.innerHTML = `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button onclick="window.downloadICalFile(window.currentEvent)" class="button button-primary" style="flex: 1; min-width: 120px;">
          Download iCal
        </button>
        <a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="button button-secondary" style="flex: 1; min-width: 120px; text-align: center; text-decoration: none; display: inline-block;">
          Google Calendar
        </a>
        <a href="print-event.html?id=${event.id}" target="_blank" class="button button-secondary" style="flex: 1; min-width: 120px; text-align: center; text-decoration: none; display: inline-block;">
          Print Event
        </a>
      </div>
    `;
    
    // Insert after map
    if (mapElement && mapElement.parentNode) {
      mapElement.parentNode.insertBefore(calendarSection, mapElement.nextSibling);
    } else {
      // Fallback: append to eventInfo div
      eventInfoDiv.appendChild(calendarSection);
    }
  } catch (error) {
    console.error('Error adding calendar links section:', error);
  }
}








