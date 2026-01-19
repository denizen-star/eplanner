/**
 * Email Templates for Event Planner
 * 
 * Provides template functions for generating HTML and plain text email content
 * for various event-related notifications.
 */

/**
 * Format date for display in emails
 * @param {string} dateTimeString - ISO date string
 * @param {string} [timezone] - Optional timezone (IANA timezone identifier)
 * @returns {string} Formatted date string
 */
function formatDate(dateTimeString, timezone = null) {
  if (!dateTimeString) return 'Date TBD';
  const date = new Date(dateTimeString);
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  if (timezone) {
    options.timeZone = timezone;
  }
  return date.toLocaleString('en-US', options);
}

/**
 * Extract city from location string
 */
function extractCity(location) {
  if (!location) return '';
  const parts = location.split(',').map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length >= 2) {
    return parts[parts.length - 2] || parts[0] || '';
  }
  return parts[0] || '';
}

/**
 * Format date for WhatsApp message: "Dec 25, 2024 at 6:30 PM EST"
 */
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
  return formatted.replace(', ', ' at ');
}

/**
 * Generate WhatsApp message template
 */
function generateWhatsAppMessage(run, signupLink) {
  const pacerName = run.plannerName || run.pacerName || '';
  const runTitle = run.title || '';
  const city = run.city || run.town || run.village || run.municipality || extractCity(run.location || '');
  const eventTimezone = run.timezone || null;
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

/**
 * Generate QR code URL for signup link
 */
function generateQRCodeUrl(signupLink) {
  const encodedUrl = encodeURIComponent(signupLink);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmss)
 * Formats the date/time as it appears in the specified timezone
 */
function formatDateForGoogleCalendar(date, timezone = null) {
  if (!date) return '';
  const d = new Date(date);
  
  // Use Intl.DateTimeFormat to get date components in the specified timezone
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone || undefined
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(d);
  
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hours = parts.find(p => p.type === 'hour').value;
  const minutes = parts.find(p => p.type === 'minute').value;
  const seconds = parts.find(p => p.type === 'second').value;
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Calculate end time (start time + 1 hour)
 */
function calculateEndTime(dateTime) {
  if (!dateTime) return null;
  const startDate = new Date(dateTime);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);
  return endDate;
}

/**
 * Format calendar event title
 */
function formatCalendarTitle(run) {
  const plannerName = run.plannerName || run.pacerName || '';
  const eventTitle = run.title || 'Event';
  return `${eventTitle} with ${plannerName}`;
}

/**
 * Format calendar event description
 */
function formatCalendarDescription(run, signupLink) {
  const plannerName = run.plannerName || run.pacerName || '';
  const eventTitle = run.title || '';
  const city = run.city || run.town || run.village || run.municipality || extractCity(run.location || '');
  const eventTimezone = run.timezone || null;
  const dateFormatted = formatDateForWhatsApp(run.dateTime, eventTimezone);
  const location = run.location || '';
  const eventDescription = run.description || '';
  
  let description = 'Hi Participants, \n';
  description += `${plannerName} here! I am hosting an event`;
  
  if (eventTitle) {
    description += `\n${eventTitle}`;
  }
  description += ':\n';
  
  description += `Date: ${dateFormatted}\n`;
  description += `City: ${city}\n`;
  description += `\nMeeting at: ${location}\n`;
  
  if (eventDescription) {
    description += `\n${eventDescription}\n`;
  }
  
  description += `${signupLink}\n`;
  description += '\n';
  description += 'Looking forward,\n';
  description += `${plannerName}`;
  
  return description;
}

/**
 * Generate Google Calendar URL
 */
function generateGoogleCalendarLink(run, signupLink) {
  const title = formatCalendarTitle(run);
  const description = formatCalendarDescription(run, signupLink);
  const location = run.location || '';
  const startDate = new Date(run.dateTime);
  const endDate = calculateEndTime(run.dateTime);
  const eventTimezone = run.timezone || null;
  
  if (!startDate || !endDate) {
    return null;
  }
  
  const startTime = formatDateForGoogleCalendar(startDate, eventTimezone);
  const endTime = formatDateForGoogleCalendar(endDate, eventTimezone);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startTime}/${endTime}`,
    details: description,
    location: location
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
 * Generate iCal file download link (data URI)
 */
function generateICalLink(run, signupLink) {
  const title = formatCalendarTitle(run);
  const description = formatCalendarDescription(run, signupLink);
  const location = run.location || '';
  const startDate = new Date(run.dateTime);
  const endDate = calculateEndTime(run.dateTime);
  
  if (!startDate || !endDate) {
    return null;
  }
  
  const startTime = formatDateForICal(startDate);
  const endTime = formatDateForICal(endDate);
  const now = formatDateForICal(new Date());
  
  const eventId = run.id || run.uuid || Date.now().toString();
  
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
  
  // Return data URI for iCal file
  const base64 = Buffer.from(icsContent).toString('base64');
  return `data:text/calendar;charset=utf-8;base64,${base64}`;
}

/**
 * Generate static map URL from coordinates
 * @param {Array<number>|null} coordinates - [lat, lon] array or null
 * @returns {string|null} Static map URL or null if coordinates invalid
 */
function generateStaticMapUrl(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }
  
  const [lat, lon] = coordinates;
  
  // Validate coordinates are valid numbers
  if (typeof lat !== 'number' || typeof lon !== 'number' || 
      isNaN(lat) || isNaN(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }
  
  // Use OpenStreetMap static map API (no API key required)
  // Note: Some email clients may block external images by default
  // The URL is encoded to ensure proper formatting
  try {
    // Using OpenStreetMap static map service
    // Format: center={lat},{lon}&zoom=15&size=140x140&markers={lat},{lon},red
    const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(lat)},${encodeURIComponent(lon)}&zoom=15&size=140x140&markers=${encodeURIComponent(lat)},${encodeURIComponent(lon)},red`;
    return mapUrl;
  } catch (error) {
    // Fallback: Return null if URL construction fails
    return null;
  }
}

/**
 * Format creation date for email header
 * @param {string|Date} createdAt - Creation date string or Date object
 * @returns {string} Formatted date string
 */
function formatCreationDate(createdAt) {
  if (!createdAt) {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Generate event created confirmation email
 * @param {Object} run - Event/run object
 * @param {string} coordinatorEmail - Coordinator's email address
 * @param {string} signupLink - Signup link for the event
 * @param {string} manageLink - Management link for the event
 * @returns {Object} { html, text } - HTML and plain text versions
 */
function eventCreatedEmail(run, coordinatorEmail, signupLink, manageLink) {
  const eventTitle = run.title || 'Event';
  const plannerName = run.plannerName || run.pacerName || 'Event Coordinator';
  const location = run.location || 'Location TBD';
  const placeName = run.placeName || null; // Public name/location name if available
  const dateTime = formatDate(run.dateTime, run.timezone);
  const maxParticipants = run.maxParticipants ? String(run.maxParticipants) : 'Unlimited';
  const createdAt = formatCreationDate(run.createdAt);
  const eventDescription = run.description || '';

  // Generate additional content
  const whatsappMessage = generateWhatsAppMessage(run, signupLink);
  const qrCodeUrl = generateQRCodeUrl(signupLink);
  const googleCalendarLink = generateGoogleCalendarLink(run, signupLink);
  const icalLink = generateICalLink(run, signupLink);

  // Event picture (base64, if available) or fallback to local default image
  // Extract base URL from signupLink or manageLink for absolute image URL
  let baseUrl = 'https://eplanner.kervinapps.com'; // Default production URL
  if (signupLink) {
    try {
      const url = new URL(signupLink);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch (e) {
      // If signupLink is not a valid URL, use default
    }
  } else if (manageLink) {
    try {
      const url = new URL(manageLink);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch (e) {
      // If manageLink is not a valid URL, use default
    }
  }
  const defaultEventImage = `${baseUrl}/assets/images/emailfallback.png`;
  const eventPicture = run.picture ? `data:image/jpeg;base64,${run.picture}` : defaultEventImage;

  // Color constants
  const warmBeige = '#F7F3ED';
  const darkBorder = '#44390d';
  const tealButton = '#0b6799';
  const lightBlueText = '#d9f0fc';

  const subject = `Event Created: ${eventTitle}`;
  
  // Generate "From" name: "<Event Title> - Confirmation" or "Event Confirmation" if no title
  const fromName = eventTitle && eventTitle !== 'Event' 
    ? `${eventTitle} - Confirmation`
    : 'Event Confirmation';

  const text = `
Your event has been created successfully!

Event Details:
- Title: ${eventTitle}
- Planner: ${plannerName}
- Location: ${location}
- Date & Time: ${dateTime}
- Max Participants: ${maxParticipants}

Links:
- Signup Link: ${signupLink}
  Share this link with participants so they can sign up for your event.

- Management Link: ${manageLink}
  Keep this link private. Use it to view and manage signups for your event.

WhatsApp Message:
${whatsappMessage}

Calendar Links:
${googleCalendarLink ? `- Google Calendar: ${googleCalendarLink}` : ''}
- iCal: Download from your management page (${manageLink})

Thank you for using Event Planner!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Typography */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 0;
      background-color: ${warmBeige};
    }
    
    /* Header */
    .email-header { 
      background-color: ${warmBeige}; 
      padding: 24px 20px;
      position: relative;
      border-bottom: 1px solid rgba(68, 57, 13, 0.1);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: ${darkBorder};
      letter-spacing: 1px;
    }
    .creation-date {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    .header-title {
      font-size: 28px;
      font-weight: 600;
      color: white;
      background-color: ${darkBorder};
      padding: 12px 16px;
      border-radius: 8px;
      display: block;
      text-align: center;
    }
    
    /* Content Container */
    .email-content { 
      background-color: ${warmBeige}; 
      padding: 0;
    }
    
    /* Event Photo Section */
    .photo-section {
      position: relative;
      width: 100%;
      max-width: 600px;
      max-height: 400px;
      overflow: hidden;
      background-color: ${warmBeige};
      margin: 0 auto;
    }
    .event-photo {
      width: 100%;
      height: auto;
      max-height: 400px;
      opacity: 0.5;
      display: block;
      object-fit: cover;
      object-position: center;
    }
    .event-description-overlay {
      position: absolute;
      bottom: 0;
      left: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 12px 12px 0 0;
      z-index: 2;
      max-width: calc(100% - 40px);
      font-size: 16px; /* Match body font size */
    }
    .event-description-overlay .link-label {
      font-size: 16px; /* Match body font size */
    }
    .event-description-overlay div {
      font-size: 16px; /* Match body font size */
    }
    
    /* Glass Morphism Event Details Box */
    .event-details-glass {
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.05); /* Fallback for email clients */
      padding: 24px;
      margin: -150px 20px 20px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1;
    }
    .detail-row { 
      margin: 12px 0; 
      font-size: 15px;
    }
    .detail-label { 
      font-weight: 600; 
      color: #555;
      display: inline-block;
      min-width: 100px;
      font-size: 16px;
    }
    .detail-value {
      color: #333;
      font-weight: 500;
    }
    
    /* Glass Morphism Boxes */
    .glass-box {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.8); /* Fallback for email clients */
      padding: 20px;
      border-radius: 8px;
      margin: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .link-box-left {
      border-left: 3px solid ${darkBorder};
    }
    .link-box-right {
      border-right: 3px solid ${darkBorder};
    }
    .whatsapp-box {
      border-left: 3px solid ${darkBorder};
    }
    .qr-code-box {
      border-right: 3px solid ${darkBorder};
      text-align: center;
    }
    
    .link-label { 
      font-weight: 600; 
      margin-bottom: 8px;
      color: ${darkBorder};
      font-size: 16px;
    }
    .link-url { 
      color: #0066cc; 
      word-break: break-all;
      font-size: 14px;
      line-height: 1.5;
    }
    .link-description {
      margin: 10px 0 0 0; 
      font-size: 13px; 
      color: #666;
      line-height: 1.5;
    }
    
    .whatsapp-message { 
      background-color: #f5f5f5; 
      padding: 12px; 
      border-radius: 6px; 
      border: 1px solid #ddd; 
      white-space: pre-wrap; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      font-size: 14px; 
      line-height: 1.5; 
      margin: 10px 0;
      color: #333;
    }
    
    .qr-code-img { 
      max-width: 200px; 
      height: auto; 
      border: 2px solid ${darkBorder};
      border-radius: 8px;
      margin: 10px 0;
    }
    
    /* Calendar Section */
    .calendar-links {
      text-align: center;
    }
    .calendar-buttons { 
      margin-top: 12px;
      text-align: center;
    }
    .calendar-button { 
      display: inline-block; 
      padding: 12px 24px; 
      background-color: ${tealButton}; 
      color: ${lightBlueText}; 
      text-decoration: none; 
      border-radius: 6px; 
      margin: 6px;
      font-weight: 500;
      font-size: 15px;
    }
    .calendar-button:hover {
      background-color: #094d73;
    }
    
    /* Footer */
    .footer { 
      margin-top: 20px; 
      padding: 20px;
      padding-top: 20px; 
      border-top: 1px solid rgba(68, 57, 13, 0.1); 
      color: #666; 
      font-size: 13px;
      text-align: center;
      background-color: ${warmBeige};
    }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      body {
        padding: 0;
      }
      .email-header {
        padding: 20px 16px;
      }
      .header-title {
        font-size: 22px;
        padding: 10px 14px;
      }
      .logo-text {
        font-size: 20px;
      }
      .creation-date {
        font-size: 12px;
      }
      .photo-section {
        max-height: 300px;
      }
      .event-photo {
        max-height: 300px;
      }
      .event-details-glass {
        margin: -100px 16px 16px 16px;
        padding: 20px;
      }
      .glass-box {
        margin: 16px;
        padding: 16px;
      }
      .event-description-overlay {
        bottom: 0;
        left: 10px;
        right: 10px;
        padding: 16px;
        max-width: calc(100% - 20px);
      }
      .detail-label {
        display: block;
        margin-bottom: 4px;
        min-width: auto;
      }
      .calendar-button {
        display: block;
        width: 100%;
        margin: 8px 0;
      }
      .qr-code-img {
        max-width: 180px;
      }
    }
  </style>
</head>
<body>
  <div class="email-header">
    <div class="header-top">
      <div class="logo-text">EP</div>
      <div class="creation-date">${createdAt}</div>
  </div>
    <div class="header-title">${eventTitle} - Created</div>
  </div>
  
  <div class="email-content">
    <div class="photo-section">
      <img src="${eventPicture}" alt="Event Photo" class="event-photo" />
      ${eventDescription ? `
      <div class="event-description-overlay">
        <div class="link-label" style="color: ${darkBorder}; margin-bottom: 8px; font-size: 16px;">Event Description:</div>
        <div style="color: #333; line-height: 1.6; white-space: pre-wrap; font-size: 16px;">${eventDescription.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
      </div>
      ` : ''}
    </div>
    
    <div class="event-details-glass">
      <div class="detail-row">
        <span class="detail-value">${eventTitle} <span style="font-weight: 400; color: #666;">(${maxParticipants} participants)</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-value">${plannerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-value">${placeName ? `${placeName}<br>${location}` : location}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span>
        <span class="detail-value">${dateTime}</span>
      </div>
      
    </div>

    <div class="glass-box link-box-left">
      <div class="link-label">Signup Link:</div>
      <div class="link-url">${signupLink}</div>
      <p class="link-description">Share this link with participants so they can sign up for your event.</p>
    </div>
      
    <div class="glass-box link-box-right">
      <div class="link-label">Management Link:</div>
      <div class="link-url">${manageLink}</div>
      <p class="link-description">Keep this link private. Use it to view and manage signups for your event.</p>
    </div>

    <div class="glass-box whatsapp-box">
      <div class="link-label">WhatsApp Message:</div>
      <div class="whatsapp-message">${whatsappMessage.replace(/\n/g, '<br>')}</div>
      <p class="link-description">Copy and paste this message to share on WhatsApp.</p>
    </div>

    <div class="glass-box qr-code-box">
      <div class="link-label">Event QR Code:</div>
      <img src="${qrCodeUrl}" alt="QR Code for ${signupLink}" class="qr-code-img" />
      <p class="link-description">Scan this QR code to access the signup page.</p>
    </div>

    <div class="glass-box calendar-links">
      <div class="link-label">Add to Calendar:</div>
      <div class="calendar-buttons">
        ${googleCalendarLink ? `<a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="calendar-button">Google Calendar</a>` : ''}
        ${icalLink ? `<a href="${manageLink}" target="_blank" rel="noopener noreferrer" class="calendar-button">Download iCal</a>` : ''}
      </div>
      <p class="link-description">Add this event to your calendar. iCal file can be downloaded from your management page.</p>
    </div>
  </div>
  
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text, fromName };
}

/**
 * Generate signup confirmation email for attendee
 * @param {Object} run - Event/run object
 * @param {Object} signup - Signup object
 * @param {string} [eventViewLink] - Optional link to view the event (event.html?id=...)
 * @returns {Object} { html, text } - HTML and plain text versions
 */
function signupConfirmationEmail(run, signup, eventViewLink = null) {
  const eventTitle = run.title || 'Event';
  const plannerName = run.plannerName || run.pacerName || 'Event Coordinator';
  const location = run.location || 'Location TBD';
  const placeName = run.placeName || null;
  const dateTime = formatDate(run.dateTime, run.timezone);
  const participantName = signup.name || 'Participant';
  const eventDescription = run.description || '';
  const maxParticipants = run.maxParticipants ? String(run.maxParticipants) : 'Unlimited';
  const createdAt = formatCreationDate(new Date());

  // Generate calendar links
  const googleCalendarLink = generateGoogleCalendarLink(run, eventViewLink || '');
  const icalLink = generateICalLink(run, eventViewLink || '');

  // Event picture (base64, if available) or fallback to local default image
  // Extract base URL from eventViewLink for absolute image URL
  let baseUrl = 'https://eplanner.kervinapps.com'; // Default production URL
  if (eventViewLink) {
    try {
      const url = new URL(eventViewLink);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch (e) {
      // If eventViewLink is not a valid URL, use default
    }
  }
  const defaultEventImage = `${baseUrl}/assets/images/emailfallback.png`;
  const eventPicture = run.picture ? `data:image/jpeg;base64,${run.picture}` : defaultEventImage;

  // Color constants
  const warmBeige = '#F7F3ED';
  const darkBorder = '#44390d';
  const tealButton = '#0b6799';
  const lightBlueText = '#d9f0fc';

  const subject = `Confirmation: You're signed up for ${eventTitle}`;
  
  // Generate "From" name: "<Event Title> - Confirmation" or "Event Confirmation" if no title
  const fromName = eventTitle && eventTitle !== 'Event' 
    ? `${eventTitle} - Confirmation`
    : 'Event Confirmation';

  const text = `
Hi ${participantName},

You're all set! You've successfully signed up for the following event:

Event Details:
- Title: ${eventTitle}
- Planner: ${plannerName}
- Location: ${location}
- Date & Time: ${dateTime}
${eventDescription ? `\n- Description: ${eventDescription}` : ''}

${eventViewLink ? `View Event: ${eventViewLink}` : ''}

Calendar Links:
${googleCalendarLink ? `- Google Calendar: ${googleCalendarLink}` : ''}
${icalLink ? '- iCal: Download from email HTML version' : ''}

We look forward to seeing you there!

If you have any questions, please contact the event coordinator.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Typography */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 0;
      background-color: ${warmBeige};
    }
    
    /* Header */
    .email-header { 
      background-color: ${warmBeige}; 
      padding: 24px 20px;
      position: relative;
      border-bottom: 1px solid rgba(68, 57, 13, 0.1);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: ${darkBorder};
      letter-spacing: 1px;
    }
    .creation-date {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    .header-title {
      font-size: 28px;
      font-weight: 600;
      color: white;
      background-color: ${darkBorder};
      padding: 12px 16px;
      border-radius: 8px;
      display: block;
      text-align: center;
    }
    
    /* Content Container */
    .email-content { 
      background-color: ${warmBeige}; 
      padding: 0;
    }
    
    /* Event Photo Section */
    .photo-section {
      position: relative;
      width: 100%;
      max-width: 600px;
      max-height: 400px;
      overflow: hidden;
      background-color: ${warmBeige};
      margin: 0 auto;
    }
    .event-photo {
      width: 100%;
      height: auto;
      max-height: 400px;
      opacity: 0.5;
      display: block;
      object-fit: cover;
      object-position: center;
    }
    .event-description-overlay {
      position: absolute;
      bottom: 0;
      left: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 12px 12px 0 0;
      z-index: 2;
      max-width: calc(100% - 40px);
      font-size: 16px;
    }
    .event-description-overlay .link-label {
      font-size: 16px;
    }
    .event-description-overlay div {
      font-size: 16px;
    }
    
    /* Glass Morphism Event Details Box */
    .event-details-glass {
      position: relative;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.05);
      padding: 24px;
      margin: -150px 20px 20px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1;
    }
    .detail-row { 
      margin: 12px 0; 
      font-size: 15px;
    }
    .detail-label { 
      font-weight: 600; 
      color: #555;
      display: inline-block;
      min-width: 120px;
      font-size: 16px;
    }
    .detail-value {
      color: #333;
      font-weight: 500;
    }
    
    /* Glass Morphism Boxes */
    .glass-box {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.8);
      padding: 20px;
      border-radius: 8px;
      margin: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .link-box-left {
      border-left: 3px solid ${darkBorder};
    }
    .link-box-right {
      border-right: 3px solid ${darkBorder};
    }
    
    .link-label { 
      font-weight: 600; 
      margin-bottom: 8px;
      color: ${darkBorder};
      font-size: 16px;
    }
    .link-url { 
      color: #0066cc; 
      word-break: break-all;
      font-size: 14px;
      line-height: 1.5;
    }
    .link-description {
      margin: 10px 0 0 0; 
      font-size: 13px; 
      color: #666;
      line-height: 1.5;
    }
    
    /* Calendar Section */
    .calendar-links {
      text-align: center;
    }
    .calendar-buttons { 
      margin-top: 12px;
      text-align: center;
    }
    .calendar-button { 
      display: inline-block; 
      padding: 12px 24px; 
      background-color: ${tealButton}; 
      color: ${lightBlueText}; 
      text-decoration: none; 
      border-radius: 6px; 
      margin: 6px;
      font-weight: 500;
      font-size: 15px;
    }
    .calendar-button:hover {
      background-color: #094d73;
    }
    
    /* Footer */
    .footer { 
      margin-top: 20px; 
      padding: 20px;
      padding-top: 20px; 
      border-top: 1px solid rgba(68, 57, 13, 0.1); 
      color: #666; 
      font-size: 13px;
      text-align: center;
      background-color: ${warmBeige};
    }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      body {
        padding: 0;
      }
      .email-header {
        padding: 20px 16px;
      }
      .header-title {
        font-size: 22px;
        padding: 10px 14px;
      }
      .logo-text {
        font-size: 20px;
      }
      .creation-date {
        font-size: 12px;
      }
      .photo-section {
        max-height: 300px;
      }
      .event-photo {
        max-height: 300px;
      }
      .event-details-glass {
        margin: -100px 16px 16px 16px;
        padding: 20px;
      }
      .glass-box {
        margin: 16px;
        padding: 16px;
      }
      .event-description-overlay {
        bottom: 0;
        left: 10px;
        right: 10px;
        padding: 16px;
        max-width: calc(100% - 20px);
      }
      .detail-label {
        display: block;
        margin-bottom: 4px;
        min-width: auto;
      }
      .calendar-button {
        display: block;
        width: 100%;
        margin: 8px 0;
      }
    }
  </style>
</head>
<body>
  <div class="email-header">
    <div class="header-top">
      <div class="logo-text">EP</div>
      <div class="creation-date">${createdAt}</div>
    </div>
    <div class="header-title">You're All Set!</div>
  </div>
  
  <div class="email-content">
    <p style="padding: 20px 20px 0 20px; font-size: 16px;">Hi ${participantName},</p>
    <p style="padding: 10px 20px 0 20px; font-size: 16px;">You've successfully signed up for the following event:</p>
    
    <div class="photo-section">
      <img src="${eventPicture}" alt="Event Photo" class="event-photo" />
      ${eventDescription ? `
      <div class="event-description-overlay">
        <div class="link-label" style="color: ${darkBorder}; margin-bottom: 8px; font-size: 16px;">Event Description:</div>
        <div style="color: #333; line-height: 1.6; white-space: pre-wrap; font-size: 16px;">${eventDescription.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
      </div>
      ` : ''}
    </div>
    
    <div class="event-details-glass">
      <div class="detail-row">
        <span class="detail-value">${eventTitle} <span style="font-weight: 400; color: #666;">(${maxParticipants} participants)</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-value">${plannerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-value">${placeName ? `${placeName}<br>${location}` : location}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span>
        <span class="detail-value">${dateTime}</span>
      </div>
    </div>

    ${eventViewLink ? `
    <div class="glass-box link-box-right">
      <div class="link-label">View Event:</div>
      <div class="link-url"><a href="${eventViewLink}" style="color: #0066cc;">${eventViewLink}</a></div>
      <p class="link-description">Click to view full event details.</p>
    </div>
    ` : ''}

    <div class="glass-box calendar-links">
      <div class="link-label">Add to Calendar:</div>
      <div class="calendar-buttons">
        ${googleCalendarLink ? `<a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="calendar-button">Google Calendar</a>` : ''}
        ${icalLink ? `<a href="${icalLink}" download="${(eventTitle || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics" class="calendar-button">Download iCal</a>` : ''}
      </div>
      <p class="link-description">Add this event to your calendar.</p>
    </div>

    <p style="padding: 0 20px 20px 20px; font-size: 16px;">We look forward to seeing you there!</p>
    <p style="padding: 0 20px 20px 20px; font-size: 16px;">If you have any questions, please contact the event coordinator.</p>
  </div>
  
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text, fromName };
}

/**
 * Generate signup notification email for coordinator
 * @param {Object} run - Event/run object
 * @param {Object} signup - Signup object
 * @param {string} coordinatorEmail - Coordinator's email address
 * @returns {Object} { html, text } - HTML and plain text versions
 */
function signupNotificationEmail(run, signup, coordinatorEmail) {
  const eventTitle = run.title || 'Event';
  const participantName = signup.name || 'Participant';
  const participantPhone = signup.phone || 'N/A';
  const participantEmail = signup.email || 'No email provided';
  const location = run.location || 'Location TBD';
  const dateTime = formatDate(run.dateTime, run.timezone);
  const createdAt = formatCreationDate(new Date());

  // Color constants
  const warmBeige = '#F7F3ED';
  const darkBorder = '#44390d';

  const subject = `New Signup: ${participantName} signed up for ${eventTitle}`;
  
  // Generate "From" name: "<Event Title> - Confirmation" or "Event Confirmation" if no title
  const fromName = eventTitle && eventTitle !== 'Event' 
    ? `${eventTitle} - Confirmation`
    : 'Event Confirmation';

  const text = `
Event: ${eventTitle}
Location: ${location}
Date & Time: ${dateTime}

- Name: ${participantName}
- Phone: ${participantPhone}
- Email: ${participantEmail}

You can view all signups using your event management link.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Typography */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 0;
      background-color: ${warmBeige};
    }
    
    /* Header */
    .email-header { 
      background-color: ${warmBeige}; 
      padding: 24px 20px;
      position: relative;
      border-bottom: 1px solid rgba(68, 57, 13, 0.1);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: ${darkBorder};
      letter-spacing: 1px;
    }
    .creation-date {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    .header-title {
      font-size: 28px;
      font-weight: 600;
      color: white;
      background-color: ${darkBorder};
      padding: 12px 16px;
      border-radius: 8px;
      display: block;
      text-align: center;
    }
    
    /* Content Container */
    .email-content { 
      background-color: ${warmBeige}; 
      padding: 0;
    }
    
    /* Glass Morphism Boxes */
    .glass-box {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.8);
      padding: 20px;
      border-radius: 8px;
      margin: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .link-box-left {
      border-left: 3px solid ${darkBorder};
    }
    .link-box-right {
      border-right: 3px solid ${darkBorder};
    }
    
    .detail-row { 
      margin: 12px 0; 
      font-size: 15px;
    }
    .detail-label { 
      font-weight: 600; 
      color: ${darkBorder};
      display: inline-block;
      min-width: 100px;
      font-size: 16px;
    }
    .detail-value {
      color: #333;
      font-weight: 500;
      font-size: 15px;
    }
    
    /* Footer */
    .footer { 
      margin-top: 20px; 
      padding: 20px;
      padding-top: 20px; 
      border-top: 1px solid rgba(68, 57, 13, 0.1); 
      color: #666; 
      font-size: 13px;
      text-align: center;
      background-color: ${warmBeige};
    }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      body {
        padding: 0;
      }
      .email-header {
        padding: 20px 16px;
      }
      .header-title {
        font-size: 22px;
        padding: 10px 14px;
      }
      .logo-text {
        font-size: 20px;
      }
      .creation-date {
        font-size: 12px;
      }
      .glass-box {
        margin: 16px;
        padding: 16px;
      }
      .detail-label {
        display: block;
        margin-bottom: 4px;
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-header">
    <div class="header-top">
      <div class="logo-text">EP</div>
      <div class="creation-date">${createdAt}</div>
    </div>
    <div class="header-title">New Signup!</div>
  </div>
  
  <div class="email-content">
    <div class="glass-box link-box-left">
      <div class="detail-row">
        <span class="detail-label">Event:</span>
        <span class="detail-value">${eventTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span>
        <span class="detail-value">${location}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span>
        <span class="detail-value">${dateTime}</span>
      </div>
    </div>

    <div class="glass-box link-box-right">
      <div class="detail-row">
        <span class="detail-label">Name:</span>
        <span class="detail-value">${participantName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone:</span>
        <span class="detail-value">${participantPhone}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${participantEmail}</span>
      </div>
    </div>

    <p style="padding: 0 20px 20px 20px; font-size: 16px;">You can view all signups using your event management link.</p>
  </div>
  
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text, fromName };
}

/**
 * Generate event updated notification email for coordinator
 * @param {Object} run - Updated event/run object
 * @param {Object} changes - Object describing what changed
 * @param {string} coordinatorEmail - Coordinator's email address
 * @returns {Object} { html, text } - HTML and plain text versions
 */
function eventUpdatedEmail(run, changes, coordinatorEmail) {
  const eventTitle = run.title || 'Event';
  const location = run.location || 'Location TBD';
  const dateTime = formatDate(run.dateTime, run.timezone);
  const createdAt = formatCreationDate(new Date());

  // Color constants
  const warmBeige = '#F7F3ED';
  const darkBorder = '#44390d';

  const subject = `Changed: Event Updated: ${eventTitle}`;
  
  // Generate "From" name: "<Event Title> - Confirmation" or "Event Confirmation" if no title
  const fromName = eventTitle && eventTitle !== 'Event' 
    ? `${eventTitle} - Confirmation`
    : 'Event Confirmation';

  const changesList = Object.keys(changes)
    .map(key => `- ${key}: ${changes[key]}`)
    .join('\n');

  const changesListHtml = Object.keys(changes)
    .map(key => `<div class="detail-row"><span class="detail-label">${key}:</span> <span class="detail-value">${changes[key]}</span></div>`)
    .join('');

  const text = `
Your event has been updated:

Event: ${eventTitle}
Location: ${location}
Date & Time: ${dateTime}

Changes Made:
${changesList}

You can view and manage your event using your management link.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Typography */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 0;
      background-color: ${warmBeige};
    }
    
    /* Header */
    .email-header { 
      background-color: ${warmBeige}; 
      padding: 24px 20px;
      position: relative;
      border-bottom: 1px solid rgba(68, 57, 13, 0.1);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: ${darkBorder};
      letter-spacing: 1px;
    }
    .creation-date {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    .header-title {
      font-size: 28px;
      font-weight: 600;
      color: white;
      background-color: ${darkBorder};
      padding: 12px 16px;
      border-radius: 8px;
      display: block;
      text-align: center;
    }
    
    /* Content Container */
    .email-content { 
      background-color: ${warmBeige}; 
      padding: 0;
    }
    
    /* Glass Morphism Boxes */
    .glass-box {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.8);
      padding: 20px;
      border-radius: 8px;
      margin: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .link-box-left {
      border-left: 3px solid ${darkBorder};
    }
    .link-box-right {
      border-right: 3px solid ${darkBorder};
    }
    .changes-box {
      background-color: rgba(255, 243, 205, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-left: 3px solid #ffc107;
    }
    
    .detail-row { 
      margin: 12px 0; 
      font-size: 15px;
    }
    .detail-label { 
      font-weight: 600; 
      color: ${darkBorder};
      display: inline-block;
      min-width: 120px;
      font-size: 16px;
    }
    .detail-value {
      color: #333;
      font-weight: 500;
      font-size: 15px;
    }
    
    /* Footer */
    .footer { 
      margin-top: 20px; 
      padding: 20px;
      padding-top: 20px; 
      border-top: 1px solid rgba(68, 57, 13, 0.1); 
      color: #666; 
      font-size: 13px;
      text-align: center;
      background-color: ${warmBeige};
    }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      body {
        padding: 0;
      }
      .email-header {
        padding: 20px 16px;
      }
      .header-title {
        font-size: 22px;
        padding: 10px 14px;
      }
      .logo-text {
        font-size: 20px;
      }
      .creation-date {
        font-size: 12px;
      }
      .glass-box {
        margin: 16px;
        padding: 16px;
      }
      .detail-label {
        display: block;
        margin-bottom: 4px;
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-header">
    <div class="header-top">
      <div class="logo-text">EP</div>
      <div class="creation-date">${createdAt}</div>
    </div>
    <div class="header-title">Event Updated</div>
  </div>
  
  <div class="email-content">
    <p style="padding: 20px 20px 0 20px; font-size: 16px;">Your event has been updated:</p>
    
    <div class="glass-box link-box-left">
      <div class="detail-row">
        <span class="detail-label">Event:</span>
        <span class="detail-value">${eventTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span>
        <span class="detail-value">${location}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span>
        <span class="detail-value">${dateTime}</span>
      </div>
    </div>

    <div class="glass-box changes-box link-box-right">
      <h3 style="margin-top: 0; color: ${darkBorder}; font-size: 18px; font-weight: 600;">Changes Made:</h3>
      ${changesListHtml}
    </div>

    <p style="padding: 0 20px 20px 20px; font-size: 16px;">You can view and manage your event using your management link.</p>
  </div>
  
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text, fromName };
}

/**
 * Generate event updated notification email for signups
 * @param {Object} run - Updated event/run object
 * @param {Object} changes - Object describing what changed
 * @param {Object} signup - Signup object
 * @returns {Object} { html, text } - HTML and plain text versions
 */
function eventUpdatedToSignupsEmail(run, changes, signup) {
  const eventTitle = run.title || 'Event';
  const participantName = signup.name || 'Participant';
  const location = run.location || 'Location TBD';
  const dateTime = formatDate(run.dateTime, run.timezone);
  const createdAt = formatCreationDate(new Date());

  // Color constants
  const warmBeige = '#F7F3ED';
  const darkBorder = '#44390d';

  const subject = `Changed: Event Update: ${eventTitle}`;
  
  // Generate "From" name: "<Event Title> - Confirmation" or "Event Confirmation" if no title
  const fromName = eventTitle && eventTitle !== 'Event' 
    ? `${eventTitle} - Confirmation`
    : 'Event Confirmation';

  const changesList = Object.keys(changes)
    .map(key => `- ${key}: ${changes[key]}`)
    .join('\n');

  const changesListHtml = Object.keys(changes)
    .map(key => `<div class="detail-row"><span class="detail-label">${key}:</span> <span class="detail-value">${changes[key]}</span></div>`)
    .join('');

  const text = `
Hi ${participantName},

The event you signed up for has been updated:

Event: ${eventTitle}
Location: ${location}
Date & Time: ${dateTime}

Changes Made:
${changesList}

Please review the updated details. If you have any questions, please contact the event coordinator.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Typography */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 0;
      background-color: ${warmBeige};
    }
    
    /* Header */
    .email-header { 
      background-color: ${warmBeige}; 
      padding: 24px 20px;
      position: relative;
      border-bottom: 1px solid rgba(68, 57, 13, 0.1);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: ${darkBorder};
      letter-spacing: 1px;
    }
    .creation-date {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    .header-title {
      font-size: 28px;
      font-weight: 600;
      color: white;
      background-color: ${darkBorder};
      padding: 12px 16px;
      border-radius: 8px;
      display: block;
      text-align: center;
    }
    
    /* Content Container */
    .email-content { 
      background-color: ${warmBeige}; 
      padding: 0;
    }
    
    /* Glass Morphism Boxes */
    .glass-box {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.8);
      padding: 20px;
      border-radius: 8px;
      margin: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .link-box-left {
      border-left: 3px solid ${darkBorder};
    }
    .link-box-right {
      border-right: 3px solid ${darkBorder};
    }
    .changes-box {
      background-color: rgba(255, 243, 205, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-left: 3px solid #ffc107;
    }
    
    .detail-row { 
      margin: 12px 0; 
      font-size: 15px;
    }
    .detail-label { 
      font-weight: 600; 
      color: ${darkBorder};
      display: inline-block;
      min-width: 120px;
      font-size: 16px;
    }
    .detail-value {
      color: #333;
      font-weight: 500;
      font-size: 15px;
    }
    
    /* Footer */
    .footer { 
      margin-top: 20px; 
      padding: 20px;
      padding-top: 20px; 
      border-top: 1px solid rgba(68, 57, 13, 0.1); 
      color: #666; 
      font-size: 13px;
      text-align: center;
      background-color: ${warmBeige};
    }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      body {
        padding: 0;
      }
      .email-header {
        padding: 20px 16px;
      }
      .header-title {
        font-size: 22px;
        padding: 10px 14px;
      }
      .logo-text {
        font-size: 20px;
      }
      .creation-date {
        font-size: 12px;
      }
      .glass-box {
        margin: 16px;
        padding: 16px;
      }
      .detail-label {
        display: block;
        margin-bottom: 4px;
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-header">
    <div class="header-top">
      <div class="logo-text">EP</div>
      <div class="creation-date">${createdAt}</div>
    </div>
    <div class="header-title">Event Update</div>
  </div>
  
  <div class="email-content">
    <p style="padding: 20px 20px 0 20px; font-size: 16px;">Hi ${participantName},</p>
    <p style="padding: 10px 20px 0 20px; font-size: 16px;">The event you signed up for has been updated:</p>
    
    <div class="glass-box link-box-left">
      <div class="detail-row">
        <span class="detail-label">Event:</span>
        <span class="detail-value">${eventTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span>
        <span class="detail-value">${location}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span>
        <span class="detail-value">${dateTime}</span>
      </div>
    </div>

    <div class="glass-box changes-box link-box-right">
      <h3 style="margin-top: 0; color: ${darkBorder}; font-size: 18px; font-weight: 600;">Changes Made:</h3>
      ${changesListHtml}
    </div>

    <p style="padding: 0 20px 20px 20px; font-size: 16px;">Please review the updated details. If you have any questions, please contact the event coordinator.</p>
  </div>
  
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text, fromName };
}

module.exports = {
  eventCreatedEmail,
  signupConfirmationEmail,
  signupNotificationEmail,
  eventUpdatedEmail,
  eventUpdatedToSignupsEmail,
};
