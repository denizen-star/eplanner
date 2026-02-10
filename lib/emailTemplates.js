/**
 * Email Templates for Event Planner.
 * Re-exports signup/notification templates from legacy module and adds weekly digest template.
 */

const {
  signupConfirmationEmail,
  signupNotificationEmail,
} = require('./emailTemplatesLegacy');

/**
 * Format date for display in emails
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
  if (timezone) options.timeZone = timezone;
  return date.toLocaleString('en-US', options);
}

/**
 * Weekly events digest email (HTML + text). Cards with title, organizer (link), image (or fallback), location, datetime. Footer with unsubscribe.
 * @param {{ appName: string, tenantKey: string|null, member: { email, name }, events: Array<{ id, title, plannerName, picture, location, dateTime, timezone, signupLink, eventViewLink }>, unsubscribeUrl: string, baseUrl?: string }} opts
 */
function weeklyEventsDigestEmail({ appName, tenantKey, member, events, unsubscribeUrl, baseUrl = 'https://eplanner.kervinapps.com' }) {
  const fallbackImage = `${baseUrl}/assets/images/emailfallback.png`;
  const cardColors = ['#F7F3ED', '#E8F4F8', '#F0EDE5', '#E5F0E8'];
  const subject = 'Your weekly events digest';
  const memberName = (member && member.name && String(member.name).trim()) ? escapeHtml(String(member.name).trim()) : '';
  const greeting = memberName ? `Hi ${memberName},` : 'Hi,';

  let htmlCards = '';
  let textLines = '';

  (events || []).forEach((evt, i) => {
    const signupLink = evt.signupLink || evt.eventViewLink || `${baseUrl}/signup.html?id=${evt.id}`;
    const imgSrc = evt.picture && evt.id ? `${baseUrl}/api/event-image/${evt.id}` : fallbackImage;
    const dateStr = formatDate(evt.dateTime, evt.timezone);
    const color = cardColors[i % cardColors.length];
    htmlCards += `
    <div style="margin-bottom: 20px; padding: 16px; border-radius: 8px; background: ${color}; border: 1px solid #ddd;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="120" valign="top" style="padding-right: 12px;">
          <a href="${signupLink}" style="display: block;"><img src="${imgSrc}" alt="" width="100" height="80" style="object-fit: cover; border-radius: 6px; display: block;" /></a>
        </td>
        <td valign="top">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;"><a href="${signupLink}" style="color: #1a1a1a; text-decoration: none;">${escapeHtml(evt.title || 'Event')}</a></div>
          <div style="font-size: 14px; margin-bottom: 4px;"><a href="${signupLink}" style="color: #333; text-decoration: none;">${escapeHtml(evt.plannerName || '')}</a></div>
          <div style="font-size: 13px; color: #555;">${escapeHtml(evt.location || '')}</div>
          <div style="font-size: 13px; color: #555;">${dateStr}</div>
        </td>
      </tr></table>
    </div>`;
    textLines += `${evt.title || 'Event'} | ${evt.plannerName || ''} | ${evt.location || ''} | ${dateStr}\n${signupLink}\n\n`;
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Weekly Events</title></head>
<body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p style="margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 600; color: #1a1a1a;">${greeting}</p>
  <p style="margin: 0 0 4px 0; font-size: 1.125rem; font-weight: 600; color: #1a1a1a;">Your weekly planned events</p>
  <p style="margin: 0 0 20px 0; font-size: 0.9375rem; color: #555;">Here are the upcoming events for the next 7 days.</p>
  ${htmlCards || '<p style="font-size: 0.9375rem; color: #555;">No events in the next 7 days.</p>'}
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="font-size: 13px; color: #666;">You are receiving this email because you signed up for weekly event updates. To stop receiving these emails, <a href="${unsubscribeUrl}">click here to unsubscribe</a>.</p>
</body>
</html>`.trim();

  const text = `${greeting}\n\nYour weekly planned events\n\nHere are the upcoming events for the next 7 days.\n\n${textLines || 'No events in the next 7 days.\n\n'}You are receiving this email because you signed up for weekly event updates. To unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  signupConfirmationEmail,
  signupNotificationEmail,
  weeklyEventsDigestEmail,
};
