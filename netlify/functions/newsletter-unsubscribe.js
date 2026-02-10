const { appMembers } = require('../../lib/databaseClient');
const { verifyUnsubscribeToken } = require('../../lib/newsletterUnsubscribe');

function htmlResponse(statusCode, title, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
    body: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family: sans-serif; max-width: 560px; margin: 40px auto; padding: 20px;"><h1>${title}</h1><p>${body}</p></body></html>`,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return htmlResponse(405, 'Method Not Allowed', 'Use GET with token and sig query parameters.');
  }

  const q = event.queryStringParameters || {};
  const token = q.token || '';
  const sig = q.sig || '';
  const payload = verifyUnsubscribeToken(token, sig);

  if (!payload) {
    return htmlResponse(400, 'Invalid link', 'This unsubscribe link is invalid or expired. If you continue to receive emails, please contact support.');
  }

  try {
    await appMembers.setWeeklyStatusByEmail(payload.appName, payload.tenantKey, payload.email, 'opt-out');
  } catch (err) {
    console.error('[NEWSLETTER UNSUBSCRIBE]', err.message);
    return htmlResponse(500, 'Error', 'We could not process your request. Please try again later.');
  }

  return htmlResponse(200, 'Unsubscribed', 'You have been unsubscribed from weekly event emails. You can re-subscribe next time you register for an event.');
};
