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
    
    // Hide loading
    loading.style.display = 'none';
    
    if (filteredEvents.length === 0) {
      noEvents.style.display = 'block';
    } else {
      // Render with the original week start for proper day alignment
      renderCalendarWeek(filteredEvents, weekRange.startDate);
      calendarContainer.style.display = 'block';
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
  
  // Handle week navigation
  const prevWeekBtn = document.getElementById('prevWeekBtn');
  const nextWeekBtn = document.getElementById('nextWeekBtn');
  
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      if (currentWeekStart) {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() - 7);
        loadCalendar(newWeekStart, dateFilterStart, dateFilterEnd, hideCancelled);
      }
    });
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      if (currentWeekStart) {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() + 7);
        loadCalendar(newWeekStart, dateFilterStart, dateFilterEnd, hideCancelled);
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
