// Reusable calendar utility functions for generating calendar links
// Used across manage.html and event.html pages

/**
 * Format calendar event title from event data
 * Returns: "${eventTitle || 'Event'} with ${plannerName}"
 */
function formatCalendarTitle(event) {
  const plannerName = event.pacerName && typeof event.pacerName === 'string' && event.pacerName.trim() ? event.pacerName.trim() : '';
  const eventTitle = event.title && typeof event.title === 'string' && event.title.trim() ? event.title.trim() : '';
  
  const title = eventTitle || 'Event';
  return `${title} with ${plannerName}`;
}

/**
 * Calculate end time (start time + 1 hour)
 * Returns: Date object with end time
 */
function calculateEndTime(dateTime) {
  if (!dateTime) return null;
  const startDate = new Date(dateTime);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);
  return endDate;
}

/**
 * Extract city from location string
 */
function extractCity(location) {
  if (!location) return '';
  // Try to extract city from common address formats
  // Format: "Address, City, State ZIP" or "City, State"
  const parts = location.split(',').map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length >= 2) {
    // Usually city is the second-to-last part before state
    return parts[parts.length - 2] || parts[0] || '';
  }
  return parts[0] || '';
}

/**
 * Format date for calendar description: "Dec 25, 2024 at 6:30 PM EST"
 */
function formatDateForCalendarDescription(dateString) {
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

/**
 * Format calendar event description
 * Returns formatted description string in WhatsApp message format
 */
function formatCalendarDescription(event) {
  const plannerName = event.pacerName && typeof event.pacerName === 'string' && event.pacerName.trim() ? event.pacerName.trim() : '';
  const eventTitle = event.title && typeof event.title === 'string' && event.title.trim() ? event.title.trim() : '';
  // Use address component city field first, fall back to parsing if not available
  const city = event.city || event.town || event.village || event.municipality || extractCity(event.location || '');
  const dateFormatted = formatDateForCalendarDescription(event.dateTime);
  const location = event.location || '';
  
  // Construct confirmation link (event.html page)
  const baseUrl = window.location.origin;
  const confirmationLink = `${baseUrl}/event.html?id=${event.id}`;
  
  // Build WhatsApp-style message
  let description = 'Hi Participants, \n';
  description += `🎉 ${plannerName} here! I am hosting an event`;
  
  if (eventTitle) {
    description += `\n${eventTitle}`;
  }
  description += ':\n';
  
  description += `📅 Date: ${dateFormatted}\n`;
  description += `📍 City: ${city}\n`;
  
  // Replace last 3 lines with new format
  description += `\nMeeting at: ${location}\n`;
  description += `🔗 ${confirmationLink}\n`;
  description += '\nReminders:\n';
  description += '1. Get to the location 5-10 minutes before the start \n';
  description += '2. Stay Hydrated\n';
  description += '3. Be respectful of your fellow participants\n';
  description += '4. Bring a smile and come ready to have fun\n';
  description += '\n';
  description += `Can't wait to see you,\n${plannerName}`;
  
  return description;
}

/**
 * Format date for iCal (UTC format: YYYYMMDDTHHmmssZ)
 */
function formatDateForICal(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for iCal format
 */
function escapeICalText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

/**
 * Generate iCal (.ics) file content
 * Returns: String containing iCal file content
 */
function generateICalEvent(event) {
  const title = formatCalendarTitle(event);
  const description = formatCalendarDescription(event);
  const location = event.location || '';
  const startDate = new Date(event.dateTime);
  const endDate = calculateEndTime(event.dateTime);
  
  if (!startDate || !endDate) {
    throw new Error('Invalid date for calendar event');
  }
  
  const startTime = formatDateForICal(startDate);
  const endTime = formatDateForICal(endDate);
  const now = formatDateForICal(new Date());
  
  // Generate unique ID for the event
  const eventId = event.id || event.uuid || Date.now().toString();
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Planner//Calendar Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventId}@eventplanner.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${escapeICalText(title)}`,
    `DESCRIPTION:${escapeICalText(description)}`,
    `LOCATION:${escapeICalText(location)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}

/**
 * Download iCal file
 */
function downloadICalFile(event) {
  try {
    const icsContent = generateICalEvent(event);
    const title = formatCalendarTitle(event);
    const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading iCal file:', error);
    alert('Failed to generate calendar file. Please try again.');
  }
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmssZ)
 */
function formatDateForGoogleCalendar(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generate Google Calendar URL
 * Returns: URL string for Google Calendar
 */
function generateGoogleCalendarLink(event) {
  const title = formatCalendarTitle(event);
  const description = formatCalendarDescription(event);
  const location = event.location || '';
  const startDate = new Date(event.dateTime);
  const endDate = calculateEndTime(event.dateTime);
  
  if (!startDate || !endDate) {
    throw new Error('Invalid date for calendar event');
  }
  
  const startTime = formatDateForGoogleCalendar(startDate);
  const endTime = formatDateForGoogleCalendar(endDate);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startTime}/${endTime}`,
    details: description,
    location: location
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Note: Outlook calendar link generation deferred to future implementation

