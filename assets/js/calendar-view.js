// Calendar view functionality for displaying public events in weekly grid
// Uses format-utils.js for consistent formatting (DRY principle)

// Helper function to get start and end of week for a given date (Monday-Sunday)
function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = 1, so calculate days to subtract to get to Monday
  // If day is 0 (Sunday), subtract 6 to get to previous Monday
  // Otherwise subtract (day - 1) to get to Monday of current week
  const diff = day === 0 ? -6 : -(day - 1);
  const startDate = new Date(d.setDate(d.getDate() + diff));
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Add 6 days to get Sunday
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

// Helper function to format week title
function formatWeekTitle(startDate) {
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const startStr = startDate.toLocaleDateString('en-US', options);
  const endStr = endDate.toLocaleDateString('en-US', options);
  
  return `${startStr} - ${endStr}`;
}

// Group events by day
function groupEventsByDay(events) {
  const grouped = {};
  
  events.forEach(event => {
    const eventDate = new Date(event.dateTime);
    const dayKey = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }
    
    grouped[dayKey].push(event);
  });
  
  // Sort events within each day by time
  Object.keys(grouped).forEach(day => {
    grouped[day].sort((a, b) => {
      return new Date(a.dateTime) - new Date(b.dateTime);
    });
  });
  
  return grouped;
}

// Get day name (e.g., "Monday", "Tuesday")
function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Get day number (e.g., "15")
function getDayNumber(date) {
  return date.getDate();
}

// Get month name (e.g., "January")
function getMonthName(date) {
  return date.toLocaleDateString('en-US', { month: 'long' });
}

// Render calendar week
function renderCalendarWeek(events, startDate) {
  const calendarWeek = document.getElementById('calendarWeek');
  if (!calendarWeek) return;

  const groupedEvents = groupEventsByDay(events);
  const days = [];
  
  // Create 7 days (Monday to Sunday)
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const dayKey = dayDate.toISOString().split('T')[0];
    days.push({
      date: dayDate,
      key: dayKey,
      events: groupedEvents[dayKey] || []
    });
  }

  // Build HTML
  let html = '';
  
  days.forEach(day => {
    const dayName = getDayName(day.date);
    const dayNumber = getDayNumber(day.date);
    const monthName = getMonthName(day.date);
    const isToday = day.key === new Date().toISOString().split('T')[0];
    
    html += `
      <div class="calendar-day ${isToday ? 'calendar-day-today' : ''}">
        <div class="calendar-day-header">
          <div class="calendar-day-name">${dayName}</div>
          <div class="calendar-day-number">${dayNumber}</div>
          <div class="calendar-day-month">${monthName}</div>
        </div>
        <div class="calendar-day-events">
          ${day.events.length === 0 
            ? '<div class="calendar-day-empty">No events</div>'
            : day.events.map(event => renderEventCard(event)).join('')
          }
        </div>
      </div>
    `;
  });
  
  calendarWeek.innerHTML = html;
}

// Render individual event card
function renderEventCard(event) {
  const timeRange = formatTimeRange(event.dateTime, event.endTime, event.timezone);
  const location = formatLocationDisplay(event.placeName, event.location);
  const signupCount = event.signupCount || 0;
  const maxParticipants = event.maxParticipants || 0;
  const signupLink = event.signupLink || event.signup_link || `signup.html?id=${event.id}`;
  
  // Check if event is cancelled
  const isCancelled = event.cancelledAt || event.status === 'cancelled';
  
  // Check if event is full
  const isFull = maxParticipants > 0 && signupCount >= maxParticipants;
  
  // Check if event is in the past
  const isPast = new Date(event.dateTime) < new Date();
  
  let eventTitle = '';
  if (event.title) {
    const titleClass = isCancelled ? 'calendar-event-title calendar-event-cancelled-title' : 'calendar-event-title';
    eventTitle = `<div class="${titleClass}">${escapeHtml(event.title)}</div>`;
  }
  
  let eventDescription = '';
  if (event.description) {
    eventDescription = `<div class="calendar-event-description">${escapeHtml(event.description)}</div>`;
  }
  
  // Status text - "Cancelled" in red if cancelled, otherwise "Attending: X"
  let statusText = '';
  if (isCancelled) {
    statusText = '<div class="calendar-event-cancelled-status">Cancelled</div>';
  } else {
    statusText = `<div class="calendar-event-attending">Attending: ${signupCount}</div>`;
  }
  
  const eventCard = `
    <a href="${isCancelled || isPast ? '#' : signupLink}" class="calendar-event ${isCancelled ? 'calendar-event-cancelled' : ''} ${isFull ? 'calendar-event-full' : ''} ${isPast ? 'calendar-event-past' : ''}" ${isCancelled || isPast ? 'onclick="return false;"' : ''} data-track-cta="calendar_event_click">
      <div class="calendar-event-time">${timeRange}</div>
      ${eventTitle}
      <div class="calendar-event-location ${isCancelled ? 'calendar-event-cancelled-location' : ''}">${escapeHtml(location)}</div>
      ${eventDescription}
      ${statusText}
      ${isFull ? '<div class="calendar-event-full-overlay"></div>' : ''}
      ${isPast ? '<div class="calendar-event-past-overlay"></div>' : ''}
    </a>
  `;
  
  return eventCard;
}

// Simple HTML escape function
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Check if screen is desktop size
function isDesktop() {
  return window.innerWidth >= 768;
}

// Render desktop calendar panel (left: event list, right: event details)
function renderDesktopCalendarPanel(events, startDate) {
  const desktopPanel = document.getElementById('desktopCalendarPanel');
  if (!desktopPanel) return;
  
  renderDesktopEventList(events, startDate);
  
  // Auto-select first event if available
  if (events.length > 0) {
    const firstEvent = events[0];
    selectDesktopEvent(firstEvent);
  } else {
    // Show placeholder
    const detailsContainer = document.getElementById('desktopEventDetails');
    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="desktop-event-details-placeholder">
          <p style="text-align: center; color: var(--text-secondary); padding: var(--space-2xl);">
            Select an event to view details
          </p>
        </div>
      `;
    }
  }
}

// Render left panel with date-grouped events
function renderDesktopEventList(events, startDate) {
  const eventListContainer = document.getElementById('desktopEventList');
  if (!eventListContainer) return;
  
  const groupedEvents = groupEventsByDay(events);
  
  // Get all days in the date range (not just week, in case filters are applied)
  // But if no filters, use week range
  const days = [];
  const allEventDates = Object.keys(groupedEvents).sort();
  
  if (allEventDates.length > 0) {
    // Use actual event dates
    allEventDates.forEach(dayKey => {
      const dayDate = new Date(dayKey + 'T00:00:00');
      days.push({
        date: dayDate,
        key: dayKey,
        events: groupedEvents[dayKey] || []
      });
    });
  } else {
    // Fallback to week range if no events
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      const dayKey = dayDate.toISOString().split('T')[0];
      days.push({
        date: dayDate,
        key: dayKey,
        events: groupedEvents[dayKey] || []
      });
    }
  }
  
  let html = '';
  
  days.forEach(day => {
    if (day.events.length === 0) return; // Skip days with no events
    
    const dayName = getDayName(day.date);
    const dayNumber = getDayNumber(day.date);
    const monthName = getMonthName(day.date);
    const year = day.date.getFullYear();
    const today = new Date();
    const isToday = day.key === today.toISOString().split('T')[0];
    
    // Format: "Monday, January 22, 2025" or "Today, January 22, 2025"
    const dateLabel = isToday ? 'Today' : dayName;
    const formattedDate = `${dateLabel}, ${monthName} ${dayNumber}, ${year}`;
    
    html += `
      <div class="desktop-date-group">
        <div class="desktop-date-header">${formattedDate}</div>
        ${day.events.map(event => renderDesktopEventCard(event)).join('')}
      </div>
    `;
  });
  
  if (html === '') {
    html = `
      <div style="text-align: center; padding: var(--space-2xl); color: var(--text-secondary);">
        <p>No events scheduled</p>
      </div>
    `;
  }
  
  eventListContainer.innerHTML = html;
  
  // Attach click handlers
  eventListContainer.querySelectorAll('.desktop-event-card').forEach(card => {
    card.addEventListener('click', () => {
      const eventId = card.dataset.eventId;
      const event = events.find(e => e.id === eventId || e.uuid === eventId);
      if (event) {
        selectDesktopEvent(event);
      }
    });
  });
}

// Render individual event card for desktop left panel
function renderDesktopEventCard(event) {
  const timeRange = formatTimeRange(event.dateTime, event.endTime, event.timezone);
  const location = formatLocationDisplay(event.placeName, event.location);
  const signupCount = event.signupCount || 0;
  const maxParticipants = event.maxParticipants || 0;
  const isCancelled = event.cancelledAt || event.status === 'cancelled';
  const isPast = new Date(event.dateTime) < new Date();
  const eventTitle = event.title ? escapeHtml(event.title) : 'Event';
  
  // Truncate location if too long
  const locationDisplay = location.length > 50 ? location.substring(0, 47) + '...' : location;
  
  // Status text
  let statusText = `Attending: ${signupCount}${maxParticipants > 0 ? ` / ${maxParticipants}` : ''}`;
  if (isCancelled) {
    statusText = '<span style="color: #dc2626;">Cancelled</span>';
  } else if (isPast) {
    statusText = '<span style="color: var(--text-secondary);">Past Event</span>';
  }
  
  return `
    <div class="desktop-event-card ${isCancelled ? 'cancelled' : ''}" data-event-id="${event.id || event.uuid}">
      <div class="desktop-event-time">${timeRange}</div>
      <div class="desktop-event-title">${eventTitle}${isCancelled ? ' <span style="color: #dc2626;">(Cancelled)</span>' : ''}</div>
      <div class="desktop-event-location">${escapeHtml(locationDisplay)}</div>
      <div class="desktop-event-participants">${statusText}</div>
    </div>
  `;
}

// Store currently selected event
let selectedDesktopEvent = null;

// Handle event card selection
async function selectDesktopEvent(event) {
  selectedDesktopEvent = event;
  
  // Update active card styling
  document.querySelectorAll('.desktop-event-card').forEach(card => {
    card.classList.remove('active');
    if (card.dataset.eventId === (event.id || event.uuid)) {
      card.classList.add('active');
    }
  });
  
  // Always fetch full event data to ensure we have picture, description, links, etc.
  // Calendar API may return limited fields
  let fullEvent = event;
  
  if (event.id || event.uuid) {
    try {
      const eventId = event.id || event.uuid;
      const response = await fetch(`/api/runs/${eventId}`);
      if (response.ok) {
        fullEvent = await response.json();
      } else {
        console.warn('[CALENDAR] Could not fetch full event data, using calendar event data');
      }
    } catch (error) {
      console.error('[CALENDAR] Error fetching full event data:', error);
      // Continue with partial event data from calendar
    }
  }
  
  renderDesktopEventDetails(fullEvent);
}

// Render event details in right panel (reusing event.html structure)
function renderDesktopEventDetails(event) {
  const detailsContainer = document.getElementById('desktopEventDetails');
  if (!detailsContainer) return;
  
  const eventTitleDisplay = event.title && typeof event.title === 'string' && event.title.trim() ? event.title.trim() : '';
  const plannerName = event.pacerName || event.plannerName || '';
  
  // Format date/time
  const eventDate = new Date(event.dateTime);
  const timezone = event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formattedDateTime = eventDate.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Format end time if available
  let formattedEndTime = '';
  if (event.endTime) {
    const endDate = new Date(event.endTime);
    formattedEndTime = endDate.toLocaleString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // Build title
  let titleText = eventTitleDisplay || 'Event';
  if (plannerName) {
    titleText = eventTitleDisplay ? `${eventTitleDisplay} - ${plannerName}` : `Event with ${plannerName}`;
  }
  
  // Picture HTML
  let pictureHtml = '';
  if (event.picture && typeof event.picture === 'string' && event.picture.trim()) {
    const pictureSrc = event.picture.startsWith('data:') 
      ? event.picture 
      : `data:image/jpeg;base64,${event.picture}`;
    pictureHtml = `
      <div class="event-picture-container">
        <img src="${pictureSrc}" alt="Event picture" />
      </div>
    `;
  }
  
  // Description HTML
  let descriptionHtml = '';
  if (event.description && typeof event.description === 'string' && event.description.trim()) {
    descriptionHtml = `
      <div class="event-description-section">
        <h3>About This Event</h3>
        <p>${escapeHtml(event.description.trim())}</p>
      </div>
    `;
  }
  
  // Links HTML
  let linksHtml = '';
  const links = [];
  if (event.eventWebsite && typeof event.eventWebsite === 'string' && event.eventWebsite.trim()) {
    links.push({
      label: 'Website',
      url: event.eventWebsite.trim(),
      icon: '🌐'
    });
  }
  if (event.eventInstagram && typeof event.eventInstagram === 'string' && event.eventInstagram.trim()) {
    links.push({
      label: 'Instagram',
      url: event.eventInstagram.trim(),
      icon: '📷'
    });
  }
  
  if (links.length > 0) {
    linksHtml = `
      <div class="event-links-section">
        <h3>Event Links</h3>
        ${links.map(link => `
          <a href="${link.url}" target="_blank" rel="noopener noreferrer">
            <span>${link.icon}</span>
            <span>${link.label}</span>
          </a>
        `).join('')}
      </div>
    `;
  }
  
  // Map container (will be populated by updateMapForLocation)
  const mapContainerId = 'desktopEventMap';
  
  // Check if event is cancelled
  const isCancelled = event.cancelledAt || event.status === 'cancelled';
  const isPast = new Date(event.dateTime) < new Date();
  const signupLink = event.signupLink || event.signup_link || (event.id ? `signup.html?id=${event.id}` : null);
  
  // Signup button/link
  let signupButtonHtml = '';
  if (!isCancelled && !isPast && signupLink) {
    signupButtonHtml = `
      <div style="margin-top: var(--space-xl); padding-top: var(--space-lg); border-top: 2px solid var(--border-gray);">
        <a href="${signupLink}" class="button button-primary" style="display: inline-block; text-decoration: none;" data-track-cta="desktop_calendar_signup_click">
          Sign Up for This Event
        </a>
      </div>
    `;
  } else if (isCancelled) {
    signupButtonHtml = `
      <div style="margin-top: var(--space-xl); padding: var(--space-md); background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; color: #991b1b;">
        <strong>This event has been cancelled</strong>
        ${event.cancellationMessage ? `<p style="margin-top: 8px; margin-bottom: 0;">${escapeHtml(event.cancellationMessage)}</p>` : ''}
      </div>
    `;
  } else if (isPast) {
    signupButtonHtml = `
      <div style="margin-top: var(--space-xl); padding: var(--space-md); background: var(--light-gray-1); border: 1px solid var(--border-gray); border-radius: 8px; color: var(--text-secondary);">
        <strong>This event has already occurred</strong>
      </div>
    `;
  }
  
  const html = `
    <div class="desktop-event-details-content active">
      <h1>${escapeHtml(titleText)}${isCancelled ? ' <span style="color: #dc2626; font-size: 0.7em;">(Cancelled)</span>' : ''}</h1>
      
      ${pictureHtml}
      
      <div class="event-info-section">
        <p><strong>Location:</strong> ${escapeHtml(event.location || 'TBD')}</p>
        <p><strong>Event Planner:</strong> ${escapeHtml(plannerName || '-')}</p>
        <p><strong>Date & Time:</strong> ${formattedDateTime}${formattedEndTime ? ` - ${formattedEndTime}` : ''}</p>
        <p><strong>Max Participants:</strong> ${event.maxParticipants || 'Unlimited'}</p>
        <p><strong>Attending:</strong> ${event.signupCount || 0}${event.maxParticipants ? ` / ${event.maxParticipants}` : ''}</p>
      </div>
      
      ${descriptionHtml}
      
      ${linksHtml}
      
      <div class="event-map-container">
        <div id="${mapContainerId}" class="location-map" style="display: none;"></div>
      </div>
      
      ${signupButtonHtml}
    </div>
  `;
  
  detailsContainer.innerHTML = html;
  
  // Render map if location exists
  if (event.location && typeof updateMapForLocation === 'function') {
    // Wait a bit longer to ensure DOM is ready and Leaflet is loaded
    setTimeout(() => {
      const mapElement = document.getElementById(mapContainerId);
      if (mapElement) {
        mapElement.style.display = 'block';
        updateMapForLocation(mapContainerId, event.location, true).catch(error => {
          console.warn('[CALENDAR] Map rendering error:', error);
        });
      }
    }, 200);
  }
}

// Fetch public events for date range
async function fetchPublicEvents(startDate, endDate) {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const url = `/api/runs/public-calendar?startDate=${startDateStr}&endDate=${endDateStr}`;
  
  console.log('[CALENDAR] Fetching events from:', url);
  
  try {
    const response = await fetch(url);
    console.log('[CALENDAR] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error || errorData.message) {
          errorDetails += ` - ${errorData.error || errorData.message}`;
        }
      } catch (e) {
        // If response isn't JSON, use status text
        errorDetails += ` - ${response.statusText}`;
      }
      throw new Error(errorDetails);
    }
    
    const data = await response.json();
    console.log('[CALENDAR] Response data:', { 
      success: data.success, 
      eventCount: data.events ? data.events.length : 0 
    });
    
    if (data.success && data.events) {
      return data.events;
    } else {
      throw new Error(data.error || 'Failed to fetch events');
    }
  } catch (error) {
    console.error('[CALENDAR] Error fetching events:', error);
    console.error('[CALENDAR] Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Main function to load and display calendar
let currentWeekStart = null;
let dateFilterStart = null;
let dateFilterEnd = null;
let hideCancelled = false;

async function loadCalendar(weekStart = null, filterStart = null, filterEnd = null, hideCancelledEvents = false) {
  const loading = document.getElementById('loading');
  const calendarContainer = document.getElementById('calendarContainer');
  const noEvents = document.getElementById('noEvents');
  const errorDiv = document.getElementById('error');
  const weekTitle = document.getElementById('weekTitle');
  
  // Hide all states initially
  loading.style.display = 'block';
  calendarContainer.style.display = 'none';
  noEvents.style.display = 'none';
  errorDiv.style.display = 'none';
  const desktopPanel = document.getElementById('desktopCalendarPanel');
  if (desktopPanel) desktopPanel.style.display = 'none';
  
  try {
    // Determine week start date (Monday)
    if (!weekStart) {
      weekStart = new Date();
      const day = weekStart.getDay();
      // Monday = 1, so calculate days to subtract to get to Monday
      const diff = day === 0 ? -6 : -(day - 1);
      weekStart = new Date(weekStart.setDate(weekStart.getDate() + diff));
      weekStart.setHours(0, 0, 0, 0);
    }
    
    currentWeekStart = weekStart;
    const weekRange = getWeekRange(weekStart);
    
    // Update week title
    if (weekTitle) {
      weekTitle.textContent = formatWeekTitle(weekRange.startDate);
    }
    
    // Determine date range for fetching events
    let fetchStartDate = weekRange.startDate;
    let fetchEndDate = weekRange.endDate;
    
    // Apply date filters if provided
    if (filterStart) {
      fetchStartDate = new Date(filterStart);
      fetchStartDate.setHours(0, 0, 0, 0);
    }
    if (filterEnd) {
      fetchEndDate = new Date(filterEnd);
      fetchEndDate.setHours(23, 59, 59, 999);
    } else {
      // If no end date filter, limit to 30 days from start date
      fetchEndDate = new Date(fetchStartDate);
      fetchEndDate.setDate(fetchEndDate.getDate() + 30);
      fetchEndDate.setHours(23, 59, 59, 999);
    }
    
    // Fetch events
    const events = await fetchPublicEvents(fetchStartDate, fetchEndDate);
    
    // Apply filters
    let filteredEvents = events;
    
    // Filter out cancelled events if requested
    if (hideCancelledEvents) {
      filteredEvents = filteredEvents.filter(event => {
        return !event.cancelledAt && event.status !== 'cancelled';
      });
    }
    
    // Filter by date range if provided (additional client-side filtering for precision)
    if (filterStart || filterEnd) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.dateTime);
        if (filterStart && eventDate < new Date(filterStart)) return false;
        if (filterEnd && eventDate > new Date(filterEnd)) return false;
        return true;
      });
    }
    
    // Limit to 15 events or 30 days, whichever is met first
    // Sort by date to ensure we get the earliest events
    filteredEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    
    // Calculate 30-day cutoff from start date
    const maxDate = new Date(fetchStartDate);
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(23, 59, 59, 999);
    
    // Filter to events within 30 days and limit to 15 events
    filteredEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.dateTime);
      return eventDate <= maxDate;
    });
    
    // Limit to 15 events (whichever comes first: 15 events or 30 days)
    if (filteredEvents.length > 15) {
      filteredEvents = filteredEvents.slice(0, 15);
    }
    
    // Hide loading
    loading.style.display = 'none';
    
    if (filteredEvents.length === 0) {
      noEvents.style.display = 'block';
      // Hide both views when no events
      calendarContainer.style.display = 'none';
      const desktopPanel = document.getElementById('desktopCalendarPanel');
      if (desktopPanel) desktopPanel.style.display = 'none';
      const desktopEventList = document.getElementById('desktopEventList');
      if (desktopEventList) {
        desktopEventList.innerHTML = `
          <div style="text-align: center; padding: var(--space-2xl); color: var(--text-secondary);">
            <p>No events scheduled</p>
          </div>
        `;
      }
    } else {
      // Determine which view to show based on screen size
      if (isDesktop()) {
        // Desktop: Show panel layout
        const desktopPanel = document.getElementById('desktopCalendarPanel');
        if (desktopPanel) {
          desktopPanel.style.display = 'flex';
          renderDesktopCalendarPanel(filteredEvents, weekRange.startDate);
        }
        calendarContainer.style.display = 'none';
      } else {
        // Mobile: Show week grid
        calendarContainer.style.display = 'block';
        renderCalendarWeek(filteredEvents, weekRange.startDate);
        const desktopPanel = document.getElementById('desktopCalendarPanel');
        if (desktopPanel) desktopPanel.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('[CALENDAR] Error loading calendar:', error);
    loading.style.display = 'none';
    errorDiv.textContent = `Failed to load events: ${error.message}`;
    errorDiv.style.display = 'block';
  }
}

// Initialize calendar on page load
document.addEventListener('DOMContentLoaded', () => {
  // Load current week
  loadCalendar();
  
  // Handle window resize to switch between desktop and mobile views
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Reload calendar to switch views if needed
      if (currentWeekStart !== null) {
        loadCalendar(currentWeekStart, dateFilterStart, dateFilterEnd, hideCancelled);
      }
    }, 250);
  });
  
  // Handle filter toggle
  const filterToggleBtn = document.getElementById('filterToggleBtn');
  const filterSection = document.getElementById('filterSection');
  const filterContent = document.getElementById('filterContent');
  
  if (filterToggleBtn && filterSection && filterContent) {
    // Start collapsed by default
    filterSection.classList.add('collapsed');
    filterToggleBtn.classList.remove('expanded');
    
    filterToggleBtn.addEventListener('click', () => {
      const isCollapsed = filterSection.classList.contains('collapsed');
      
      if (isCollapsed) {
        // Expand
        filterSection.classList.remove('collapsed');
        filterSection.classList.add('expanded');
        filterToggleBtn.classList.add('expanded');
        filterContent.style.display = 'block';
      } else {
        // Collapse
        filterSection.classList.remove('expanded');
        filterSection.classList.add('collapsed');
        filterToggleBtn.classList.remove('expanded');
        filterContent.style.display = 'none';
      }
    });
  }
  
  // Handle date range filter
  const applyDateFilterBtn = document.getElementById('applyDateFilterBtn');
  const clearDateFilterBtn = document.getElementById('clearDateFilterBtn');
  const filterStartDate = document.getElementById('filterStartDate');
  const filterEndDate = document.getElementById('filterEndDate');
  
  if (applyDateFilterBtn) {
    applyDateFilterBtn.addEventListener('click', () => {
      const startValue = filterStartDate ? filterStartDate.value : null;
      const endValue = filterEndDate ? filterEndDate.value : null;
      
      if (!startValue && !endValue) {
        alert('Please select at least a start date or end date');
        return;
      }
      
      dateFilterStart = startValue;
      dateFilterEnd = endValue;
      loadCalendar(currentWeekStart, dateFilterStart, dateFilterEnd, hideCancelled);
    });
  }
  
  if (clearDateFilterBtn) {
    clearDateFilterBtn.addEventListener('click', () => {
      dateFilterStart = null;
      dateFilterEnd = null;
      if (filterStartDate) filterStartDate.value = '';
      if (filterEndDate) filterEndDate.value = '';
      loadCalendar(currentWeekStart, null, null, hideCancelled);
    });
  }
  
  // Handle hide cancelled checkbox
  const hideCancelledCheckbox = document.getElementById('hideCancelledCheckbox');
  if (hideCancelledCheckbox) {
    hideCancelledCheckbox.addEventListener('change', (e) => {
      hideCancelled = e.target.checked;
      loadCalendar(currentWeekStart, dateFilterStart, dateFilterEnd, hideCancelled);
    });
  }
});
