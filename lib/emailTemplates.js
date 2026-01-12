/**
 * Email Templates for Event Planner
 * 
 * Provides template functions for generating HTML and plain text email content
 * for various event-related notifications.
 */

/**
 * Format date for display in emails
 * @param {string} dateTimeString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateTimeString) {
  if (!dateTimeString) return 'Date TBD';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
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
  return formatted.replace(', ', ' at ') + ' EST';
}

/**
 * Generate WhatsApp message template
 */
function generateWhatsAppMessage(run, signupLink) {
  const pacerName = run.plannerName || run.pacerName || '';
  const runTitle = run.title || '';
  const city = run.city || run.town || run.village || run.municipality || extractCity(run.location || '');
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

/**
 * Generate QR code URL for signup link
 */
function generateQRCodeUrl(signupLink) {
  const encodedUrl = encodeURIComponent(signupLink);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmss)
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
  const dateFormatted = formatDateForWhatsApp(run.dateTime);
  const location = run.location || '';
  
  let description = 'Hi Participants, \n';
  description += `${plannerName} here! I am hosting an event`;
  
  if (eventTitle) {
    description += `\n${eventTitle}`;
  }
  description += ':\n';
  
  description += `Date: ${dateFormatted}\n`;
  description += `City: ${city}\n`;
  description += `\nMeeting at: ${location}\n`;
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
  
  if (!startDate || !endDate) {
    return null;
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
  const dateTime = formatDate(run.dateTime);
  const maxParticipants = run.maxParticipants || 'Unlimited';

  // Generate additional content
  const whatsappMessage = generateWhatsAppMessage(run, signupLink);
  const qrCodeUrl = generateQRCodeUrl(signupLink);
  const googleCalendarLink = generateGoogleCalendarLink(run, signupLink);
  const icalLink = generateICalLink(run, signupLink);

  // Accent color: #6488F4 (blue from image)
  const accentColor = '#6488F4';

  const subject = `Event Created: ${eventTitle}`;

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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${accentColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .event-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .links { margin-top: 20px; }
    .link-box { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid ${accentColor}; }
    .link-label { font-weight: bold; margin-bottom: 5px; }
    .link-url { color: #0066cc; word-break: break-all; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: ${accentColor}; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px 10px 0; }
    .whatsapp-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${accentColor}; }
    .whatsapp-message { background-color: #f5f5f5; padding: 12px; border-radius: 4px; border: 1px solid #ddd; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5; margin: 10px 0; }
    .qr-code-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${accentColor}; text-align: center; }
    .qr-code-img { max-width: 200px; height: auto; border: 1px solid #ddd; border-radius: 4px; }
    .calendar-links { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${accentColor}; }
    .calendar-buttons { margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Event Created Successfully!</h1>
  </div>
  <div class="content">
    <p>Your event has been created successfully. Here are the details:</p>
    
    <div class="event-details">
      <div class="detail-row">
        <span class="detail-label">Title:</span> ${eventTitle}
      </div>
      <div class="detail-row">
        <span class="detail-label">Planner:</span> ${plannerName}
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span> ${location}
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span> ${dateTime}
      </div>
      <div class="detail-row">
        <span class="detail-label">Max Participants:</span> ${maxParticipants}
      </div>
    </div>

    <div class="links">
      <div class="link-box">
        <div class="link-label">Signup Link:</div>
        <div class="link-url">${signupLink}</div>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Share this link with participants so they can sign up for your event.</p>
      </div>
      
      <div class="link-box">
        <div class="link-label">Management Link:</div>
        <div class="link-url">${manageLink}</div>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Keep this link private. Use it to view and manage signups for your event.</p>
      </div>
    </div>

    <div class="whatsapp-box">
      <div class="link-label">WhatsApp Message:</div>
      <div class="whatsapp-message">${whatsappMessage.replace(/\n/g, '<br>')}</div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Copy and paste this message to share on WhatsApp.</p>
    </div>

    <div class="qr-code-box">
      <div class="link-label">Event QR Code:</div>
      <img src="${qrCodeUrl}" alt="QR Code for ${signupLink}" class="qr-code-img" />
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Scan this QR code to access the signup page.</p>
    </div>

    <div class="calendar-links">
      <div class="link-label">Add to Calendar:</div>
      <div class="calendar-buttons">
        ${googleCalendarLink ? `<a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="button">Google Calendar</a>` : ''}
        ${icalLink ? `<a href="${manageLink}" target="_blank" rel="noopener noreferrer" class="button">Download iCal</a>` : ''}
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Add this event to your calendar. iCal file can be downloaded from your management page.</p>
    </div>
  </div>
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
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
  const dateTime = formatDate(run.dateTime);
  const participantName = signup.name || 'Participant';

  // Generate calendar links
  const googleCalendarLink = generateGoogleCalendarLink(run, eventViewLink || '');
  const icalLink = generateICalLink(run, eventViewLink || '');

  // Accent color: #6488F4 (blue from image)
  const accentColor = '#6488F4';

  const subject = `Confirmation: You're signed up for ${eventTitle}`;

  const text = `
Hi ${participantName},

You're all set! You've successfully signed up for the following event:

Event Details:
- Title: ${eventTitle}
- Planner: ${plannerName}
- Location: ${location}
- Date & Time: ${dateTime}

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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${accentColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .event-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: ${accentColor}; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px 10px 0; }
    .link-box { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${accentColor}; }
    .link-label { font-weight: bold; margin-bottom: 5px; }
    .link-url { color: #0066cc; word-break: break-all; }
    .calendar-links { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${accentColor}; }
    .calendar-buttons { margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">You're All Set!</h1>
  </div>
  <div class="content">
    <p>Hi ${participantName},</p>
    <p>You've successfully signed up for the following event:</p>
    
    <div class="event-details">
      <div class="detail-row">
        <span class="detail-label">Title:</span> ${eventTitle}
      </div>
      <div class="detail-row">
        <span class="detail-label">Planner:</span> ${plannerName}
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span> ${location}
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span> ${dateTime}
      </div>
    </div>

    ${eventViewLink ? `
    <div class="link-box">
      <div class="link-label">View Event:</div>
      <div class="link-url"><a href="${eventViewLink}" style="color: #0066cc;">${eventViewLink}</a></div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Click to view full event details.</p>
    </div>
    ` : ''}

    <div class="calendar-links">
      <div class="link-label">Add to Calendar:</div>
      <div class="calendar-buttons">
        ${googleCalendarLink ? `<a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="button">Google Calendar</a>` : ''}
        ${icalLink ? `<a href="${icalLink}" download="${(eventTitle || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics" class="button">Download iCal</a>` : ''}
      </div>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Add this event to your calendar.</p>
    </div>

    <p>We look forward to seeing you there!</p>
    <p>If you have any questions, please contact the event coordinator.</p>
  </div>
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
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
  const dateTime = formatDate(run.dateTime);

  const subject = `New Signup: ${participantName} signed up for ${eventTitle}`;

  const text = `
You have a new signup for your event!

Event: ${eventTitle}
Location: ${location}
Date & Time: ${dateTime}

New Participant:
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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #750787; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .event-info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .participant-info { background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #750787; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">New Signup!</h1>
  </div>
  <div class="content">
    <p>You have a new signup for your event:</p>
    
    <div class="event-info">
      <div class="detail-row">
        <span class="detail-label">Event:</span> ${eventTitle}
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span> ${location}
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span> ${dateTime}
      </div>
    </div>

    <div class="participant-info">
      <h3 style="margin-top: 0;">New Participant:</h3>
      <div class="detail-row">
        <span class="detail-label">Name:</span> ${participantName}
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone:</span> ${participantPhone}
      </div>
      <div class="detail-row">
        <span class="detail-label">Email:</span> ${participantEmail}
      </div>
    </div>

    <p>You can view all signups using your event management link.</p>
  </div>
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
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
  const dateTime = formatDate(run.dateTime);

  const subject = `Event Updated: ${eventTitle}`;

  const changesList = Object.keys(changes)
    .map(key => `- ${key}: ${changes[key]}`)
    .join('\n');

  const changesListHtml = Object.keys(changes)
    .map(key => `<div class="detail-row"><span class="detail-label">${key}:</span> ${changes[key]}</div>`)
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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #750787; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .event-info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .changes-box { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Event Updated</h1>
  </div>
  <div class="content">
    <p>Your event has been updated:</p>
    
    <div class="event-info">
      <div class="detail-row">
        <span class="detail-label">Event:</span> ${eventTitle}
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span> ${location}
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span> ${dateTime}
      </div>
    </div>

    <div class="changes-box">
      <h3 style="margin-top: 0;">Changes Made:</h3>
      ${changesListHtml}
    </div>

    <p>You can view and manage your event using your management link.</p>
  </div>
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
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
  const dateTime = formatDate(run.dateTime);

  const subject = `Event Update: ${eventTitle}`;

  const changesList = Object.keys(changes)
    .map(key => `- ${key}: ${changes[key]}`)
    .join('\n');

  const changesListHtml = Object.keys(changes)
    .map(key => `<div class="detail-row"><span class="detail-label">${key}:</span> ${changes[key]}</div>`)
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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #750787; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .event-info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .changes-box { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Event Update</h1>
  </div>
  <div class="content">
    <p>Hi ${participantName},</p>
    <p>The event you signed up for has been updated:</p>
    
    <div class="event-info">
      <div class="detail-row">
        <span class="detail-label">Event:</span> ${eventTitle}
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span> ${location}
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time:</span> ${dateTime}
      </div>
    </div>

    <div class="changes-box">
      <h3 style="margin-top: 0;">Changes Made:</h3>
      ${changesListHtml}
    </div>

    <p>Please review the updated details. If you have any questions, please contact the event coordinator.</p>
  </div>
  <div class="footer">
    <p>Thank you for using Event Planner!</p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

module.exports = {
  eventCreatedEmail,
  signupConfirmationEmail,
  signupNotificationEmail,
  eventUpdatedEmail,
  eventUpdatedToSignupsEmail,
};
