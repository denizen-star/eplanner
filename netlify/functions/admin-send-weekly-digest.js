const { jsonResponse, requireAdmin, getTenant } = require('./utils');
const { appMembers } = require('../../lib/databaseClient');
const { getUpcomingEventsForDays } = require('../../lib/eventDigestService');
const { weeklyEventsDigestEmail } = require('../../lib/emailTemplates');
const { getNewsletterSenderEmail } = require('../../lib/tenant');
const { buildUnsubscribeUrl } = require('../../lib/newsletterUnsubscribe');
const EmailService = require('../../lib/emailService');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { success: true });
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }
  if (!requireAdmin(event)) {
    return jsonResponse(401, { success: false, error: 'Unauthorized', message: 'Admin password required' });
  }

  try {
    const host = event.headers?.host || event.headers?.Host || '';
    const protocol = event.headers?.['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    const { appName, tenantKey } = getTenant(event);
    const members = await appMembers.getActiveWeeklyMembers(appName, tenantKey);
    const events = await getUpcomingEventsForDays(appName, tenantKey, 7);

    const fromEmail = getNewsletterSenderEmail(appName, tenantKey);
    const emailService = new EmailService();
    let sentCount = 0;
    let skipCount = 0;

    for (const member of members) {
      const email = member.email && String(member.email).trim();
      if (!email) {
        skipCount++;
        continue;
      }
      const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, email, appName, tenantKey) || `${baseUrl}/api/newsletter/unsubscribe`;
      const { subject, html, text } = weeklyEventsDigestEmail({
        appName,
        tenantKey,
        member: { email: member.email, name: member.name },
        events,
        unsubscribeUrl,
        baseUrl,
      });
      const sent = await emailService.sendEmail({
        to: email,
        subject,
        html,
        text,
        fromEmail: fromEmail || undefined,
        fromName: 'Weekly Events',
      });
      if (sent) sentCount++;
      else skipCount++;
    }

    return jsonResponse(200, {
      success: true,
      sentCount,
      skippedCount: skipCount,
      eventsCount: events.length,
      memberCount: members.length,
    });
  } catch (err) {
    console.error('[ADMIN SEND WEEKLY DIGEST]', err.message);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to send weekly digest',
      message: err.message,
    });
  }
};
