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

Thank you for using Event Planner!
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
    .event-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .links { margin-top: 20px; }
    .link-box { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #750787; }
    .link-label { font-weight: bold; margin-bottom: 5px; }
    .link-url { color: #0066cc; word-break: break-all; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #750787; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px 10px 0; }
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
 * @returns {Object} { html, text } - HTML and plain text versions
 */
function signupConfirmationEmail(run, signup) {
  const eventTitle = run.title || 'Event';
  const plannerName = run.plannerName || run.pacerName || 'Event Coordinator';
  const location = run.location || 'Location TBD';
  const dateTime = formatDate(run.dateTime);
  const participantName = signup.name || 'Participant';

  const subject = `Confirmation: You're signed up for ${eventTitle}`;

  const text = `
Hi ${participantName},

You're all set! You've successfully signed up for the following event:

Event Details:
- Title: ${eventTitle}
- Planner: ${plannerName}
- Location: ${location}
- Date & Time: ${dateTime}

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
    .header { background-color: #750787; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .event-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
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
