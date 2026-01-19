// Shared formatting utilities (DRY principle)
// Reusable functions for time and event formatting across the application

/**
 * Format a single time as "HH:MM AM/PM"
 * @param {Date|string} date - Date object or ISO string
 * @param {string|null} timezone - Optional timezone (e.g., "America/New_York")
 * @returns {string} Formatted time string
 */
function formatTime(date, timezone = null) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const options = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  if (timezone) {
    options.timeZone = timezone;
  }

  return dateObj.toLocaleTimeString('en-US', options);
}

/**
 * Format a time range as "6:30 PM - 8:30 PM"
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {string|null} timezone - Optional timezone
 * @returns {string} Formatted time range string
 */
function formatTimeRange(startDate, endDate, timezone = null) {
  if (!startDate) return '';
  
  const startTime = formatTime(startDate, timezone);
  if (!endDate) return startTime;
  
  const endTime = formatTime(endDate, timezone);
  return `${startTime} - ${endTime}`;
}

/**
 * Format location display as "Place: Address" or just "Address"
 * @param {string|null} placeName - Place name (e.g., "Gaythering")
 * @param {string} address - Full address
 * @returns {string} Formatted location string
 */
function formatLocationDisplay(placeName, address) {
  if (!address) return '';
  if (placeName) {
    return `${placeName}: ${address}`;
  }
  return address;
}

/**
 * Format full event display string
 * Format: "<Start time> - <end time> (HH:MM AM/PM) - Event Title - <Event Location name>: <Event location address>"
 * @param {Object} event - Event object with dateTime, endTime, title, placeName, location
 * @param {string|null} timezone - Optional timezone
 * @returns {string} Formatted event string
 */
function formatEventDisplayString(event, timezone = null) {
  if (!event) return '';

  const parts = [];

  // Time range
  const timeRange = formatTimeRange(event.dateTime, event.endTime, timezone || event.timezone);
  if (timeRange) {
    parts.push(timeRange);
  }

  // Title
  if (event.title) {
    parts.push(event.title);
  }

  // Location
  const location = formatLocationDisplay(event.placeName, event.location);
  if (location) {
    parts.push(location);
  }

  return parts.join(' - ');
}
