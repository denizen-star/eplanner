const { submitToGoogleSheets } = require('../../lib/googleSheetsClient');

const SKIP_SHEETS = process.env.SKIP_SHEETS === '1';

function allowCors(headers = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

module.exports = {
  jsonResponse,
  parseBody,
  extractClientMetadata,
  forwardToSheets,
};

