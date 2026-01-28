const { submitToGoogleSheets } = require('../../lib/googleSheetsClient');
const { getTenantFromHost } = require('../../lib/tenant');

const SKIP_SHEETS = process.env.SKIP_SHEETS === '1';

function allowCors(headers = {}, methods = 'GET, POST, OPTIONS') {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Access-Control-Allow-Methods': methods,
    ...headers,
  };
}

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: allowCors({
      'Content-Type': 'application/json',
      ...extraHeaders,
    }),
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event || !event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw new Error('Invalid JSON payload');
  }
}

function extractClientMetadata(headers = {}) {
  const normalized = Object.keys(headers || {}).reduce((acc, key) => {
    acc[key.toLowerCase()] = headers[key];
    return acc;
  }, {});

  const ip =
    normalized['client-ip'] ||
    normalized['x-forwarded-for'] ||
    normalized['x-nf-client-connection-ip'] ||
    normalized['x-real-ip'] ||
    '';

  return {
    ipAddress: ip.split(',')[0].trim(),
    userAgent: normalized['user-agent'] || '',
  };
}

async function forwardToSheets(payload) {
  if (SKIP_SHEETS) {
    console.warn('[Sheets] Submission skipped (SKIP_SHEETS=1). Payload preview:', {
      dataType: payload?.dataType,
      sessionId: payload?.sessionId,
    });
    return { success: true, skipped: true };
  }

  return submitToGoogleSheets(payload);
}

function getAppName(event) {
  const host = event?.headers?.['host'] || event?.headers?.['Host'] || '';
  return getTenantFromHost(host).appName;
}

function getTenant(event) {
  const host = event?.headers?.['host'] || event?.headers?.['Host'] || '';
  return getTenantFromHost(host);
}

function requireAdmin(event) {
  const h = event?.headers || {};
  const pw = h['x-admin-password'] || h['X-Admin-Password'] || '';
  const expected = process.env.ADMIN_PASSWORD;
  return !!(expected && pw === expected);
}

module.exports = {
  jsonResponse,
  parseBody,
  extractClientMetadata,
  forwardToSheets,
  getAppName,
  getTenant,
  requireAdmin,
};

