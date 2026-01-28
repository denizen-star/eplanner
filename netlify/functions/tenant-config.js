const { tenants } = require('../../lib/databaseClient');
const { getTenantFromHost, getProductDefaults, mergeConfig } = require('../../lib/tenant');
const { jsonResponse } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    const host = event.headers?.host || event.headers?.Host || '';
    const { product, subdomain, tenantKey } = getTenantFromHost(host);
    const defaults = getProductDefaults(product);
    let overrides = null;
    let senderEmail = null;
    try {
      const row = await tenants.getByKey(tenantKey);
      if (row) {
        overrides = row.configJson || null;
        senderEmail = row.senderEmail || null;
      }
    } catch (e) {
      console.warn('[TENANT-CONFIG] tenants.getByKey failed:', e.message);
    }
    const config = mergeConfig(defaults, overrides);
    const out = {
      tenantKey,
      product,
      subdomain,
      ...config,
      senderEmail: senderEmail || null,
    };
    return jsonResponse(200, out);
  } catch (err) {
    console.error('[TENANT-CONFIG] Error:', err);
    return jsonResponse(500, { error: 'Internal server error', message: err.message });
  }
};
