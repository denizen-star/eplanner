const { tenants } = require('../../lib/databaseClient');
const { jsonResponse, parseBody, requireAdmin } = require('./utils');

function adminJson(statusCode, body) {
  return jsonResponse(statusCode, body);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminJson(204, {});
  }
  if (!requireAdmin(event)) {
    return adminJson(401, { error: 'Unauthorized', message: 'Admin password required' });
  }

  if (event.httpMethod === 'GET') {
    try {
      const list = await tenants.getAll();
      return adminJson(200, { tenants: list });
    } catch (err) {
      console.error('[ADMIN-TENANTS] GET error:', err);
      return adminJson(500, { error: 'Internal server error', message: err.message });
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = parseBody(event);
      const { product, subdomain, displayName, configJson, senderEmail } = body;
      if (!product || !subdomain || typeof subdomain !== 'string') {
        return adminJson(400, { error: 'Bad request', message: 'product and subdomain are required' });
      }
      const sk = String(subdomain).trim().toLowerCase();
      const pk = String(product).trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(pk) || !/^[a-z0-9_-]+$/.test(sk)) {
        return adminJson(400, { error: 'Bad request', message: 'product and subdomain must be alphanumeric (with - _)' });
      }
      const tenantKey = `${pk}:${sk}`;
      const created = await tenants.create({
        tenantKey,
        product: pk,
        subdomain: sk,
        displayName: displayName ? String(displayName).trim() : null,
        configJson: configJson || null,
        senderEmail: senderEmail ? String(senderEmail).trim() : null,
      });
      return adminJson(201, created);
    } catch (err) {
      console.error('[ADMIN-TENANTS] POST error:', err);
      if (err.message && err.message.includes('Duplicate')) {
        return adminJson(409, { error: 'Conflict', message: 'Tenant already exists' });
      }
      return adminJson(500, { error: 'Internal server error', message: err.message });
    }
  }

  return adminJson(405, { error: 'Method Not Allowed' });
};
