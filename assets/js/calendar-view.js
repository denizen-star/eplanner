// Calendar view functionality for displaying public events in weekly grid
// Uses format-utils.js for consistent formatting (DRY principle)

// Helper function to get start and end of week for a given date
function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday = 0, so subtract to get Sunday
  const startDate = new Date(d.setDate(diff));
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Add 6 days to get Saturday
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
  
  // Create 7 days (Sunday to Saturday)
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
  const signupLink = event.signupLink || event.signup_link || `signup.html?id=${event.id}`;
  
  let eventTitle = '';
  if (event.title) {
    eventTitle = `<div class="calendar-event-title">${escapeHtml(event.title)}</div>`;
  }
  
  let eventDescription = '';
  if (event.description) {
    eventDescription = `<div class="calendar-event-description">${escapeHtml(event.description)}</div>`;
  }
  
  return `
    <a href="${signupLink}" class="calendar-event" data-track-cta="calendar_event_click">
      <div class="calendar-event-time">${timeRange}</div>
      ${eventTitle}
      <div class="calendar-event-location">${escapeHtml(location)}</div>
      ${eventDescription}
      <div class="calendar-event-attending">Attending: ${signupCount}</div>
    </a>
  `;
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

async function loadCalendar(weekStart = null) {
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
    // Determine week start date
    if (!weekStart) {
      weekStart = new Date();
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day;
      weekStart = new Date(weekStart.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);
    }
    
    currentWeekStart = weekStart;
    const weekRange = getWeekRange(weekStart);
    
    // Update week title
    if (weekTitle) {
      weekTitle.textContent = formatWeekTitle(weekRange.startDate);
    }
    
    // Fetch events
    const events = await fetchPublicEvents(weekRange.startDate, weekRange.endDate);
    
    // Hide loading
    loading.style.display = 'none';
    
    if (events.length === 0) {
      noEvents.style.display = 'block';
    } else {
      renderCalendarWeek(events, weekRange.startDate);
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
        loadCalendar(newWeekStart);
      }
    });
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      if (currentWeekStart) {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(newWeekStart.getDate() + 7);
        loadCalendar(newWeekStart);
      }
    });
  }
});
