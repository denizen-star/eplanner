/**
 * Build and verify newsletter unsubscribe links (token + HMAC signature).
 * Used by admin-send-weekly-digest (build) and newsletter-unsubscribe (verify).
 */

const crypto = require('crypto');

const SECRET_ENV = 'NEWSLETTER_UNSUBSCRIBE_SECRET';
const TYPE_WEEKLY = 'Weekly';

function getSecret() {
  const s = process.env[SECRET_ENV];
  if (!s || typeof s !== 'string') return null;
  return s.trim();
}

/**
 * Build an unsubscribe URL for a given email/app/tenant. Token is base64url payload; sig is HMAC-SHA256.
 * @param {string} baseUrl - e.g. https://example.com
 * @param {string} email
 * @param {string} appName
 * @param {string|null} tenantKey
 * @returns {string|null} Full URL or null if secret not set
 */
function buildUnsubscribeUrl(baseUrl, email, appName, tenantKey) {
  const secret = getSecret();
  if (!secret) return null;
  const payload = { email, appName, tenantKey: tenantKey || null, type: TYPE_WEEKLY };
  const token = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(token).digest('base64url');
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}&sig=${encodeURIComponent(sig)}`;
}

/**
 * Verify token and signature; return decoded payload or null.
 * @param {string} token - base64url token
 * @param {string} sig - base64url HMAC
 * @returns {{ email: string, appName: string, tenantKey: string|null, type: string }|null}
 */
function verifyUnsubscribeToken(token, sig) {
  const secret = getSecret();
  if (!secret || !token || !sig) return null;
  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(token).digest('base64url');
    if (expectedSig !== sig) return null;
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const payload = JSON.parse(raw);
    if (payload.type !== TYPE_WEEKLY || !payload.email || !payload.appName) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

module.exports = { buildUnsubscribeUrl, verifyUnsubscribeToken, TYPE_WEEKLY };
