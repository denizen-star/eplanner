const { tenants } = require('../../lib/databaseClient');
const { jsonResponse, parseBody, requireAdmin } = require('./utils');

function adminJson(statusCode, body) {
  return jsonResponse(statusCode, body);
}

function getTenantKeyFromPath(path) {
  const base = '/api/admin/tenants/';
  if (!path || !path.startsWith(base)) return null;
  const rest = path.slice(base.length).replace(/\/$/, '');
  return rest ? decodeURIComponent(rest) : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminJson(204, {});
  }
  if (!requireAdmin(event)) {
    return adminJson(401, { error: 'Unauthorized', message: 'Admin password required' });
  }

  const tenantKey = getTenantKeyFromPath(event.path);
  if (!tenantKey) {
    return adminJson(400, { error: 'Bad request', message: 'tenantKey required in path' });
  }

  if (event.httpMethod === 'PUT') {
    try {
      const body = parseBody(event);
      const { product, subdomain, displayName, configJson, senderEmail, isActive } = body;
      const updates = {};
      if (product !== undefined) updates.product = String(product).trim().toLowerCase();
      if (subdomain !== undefined) updates.subdomain = String(subdomain).trim().toLowerCase();
      if (displayName !== undefined) updates.displayName = displayName ? String(displayName).trim() : null;
      if (configJson !== undefined) updates.configJson = configJson;
      if (senderEmail !== undefined) updates.senderEmail = senderEmail ? String(senderEmail).trim() : null;
      if (isActive !== undefined) updates.isActive = !!isActive;
      const updated = await tenants.update(tenantKey, updates);
      return adminJson(200, updated);
    } catch (err) {
      console.error('[ADMIN-TENANTS-BY-KEY] PUT error:', err);
      return adminJson(500, { error: 'Internal server error', message: err.message });
    }
  }

  if (event.httpMethod === 'DELETE') {
    try {
      await tenants.delete(tenantKey);
      return adminJson(200, { success: true });
    } catch (err) {
      console.error('[ADMIN-TENANTS-BY-KEY] DELETE error:', err);
      return adminJson(500, { error: 'Internal server error', message: err.message });
    }
  }

  return adminJson(405, { error: 'Method Not Allowed' });
};
