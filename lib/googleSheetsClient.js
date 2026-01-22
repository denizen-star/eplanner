const { URL } = require('url');

function getFetch() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch;
  }
  if (typeof fetch !== 'undefined' && typeof fetch === 'function') {
    return fetch;
  }
  throw new Error('Fetch is not available. Requires Node 18+ or browser runtime.');
}

function getSheetEndpoint() {
  const url =
    process.env.GS_DATA_PIPELINE_URL ||
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    '';

  if (!url) {
    console.warn('Google Sheets endpoint URL is not configured. Set GS_DATA_PIPELINE_URL environment variable.');
    return null;
  }

  try {
    return new URL(url).toString();
  } catch (error) {
    console.error(`Invalid Google Sheets endpoint URL: ${url}`, error);
    return null;
  }
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.join('; ');
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

function buildRequestBody(payload = {}) {
  const normalized = {};

  Object.entries(payload).forEach(([key, value]) => {
    normalized[key] = normalizeValue(value);
  });

  if (!normalized.timestamp) {
    normalized.timestamp = new Date().toISOString();
  }

  return normalized;
}

async function submitToGoogleSheets(payload, options = {}) {
  console.log('[GOOGLE SHEETS] Starting submission for dataType:', payload.dataType);
  
  const endpoint = getSheetEndpoint();
  
  // If endpoint is not configured, return early without error
  if (!endpoint) {
    console.warn('[GOOGLE SHEETS] Skipping submission: endpoint not configured');
    return { success: false, skipped: true, reason: 'endpoint_not_configured' };
  }

  console.log('[GOOGLE SHEETS] Endpoint configured:', endpoint.substring(0, 50) + '...');
  console.log('[GOOGLE SHEETS] Getting fetch implementation...');
  
  const fetchImpl = getFetch();
  console.log('[GOOGLE SHEETS] Fetch implementation ready');
  
  const requestBody = buildRequestBody({
    ...payload,
    dataSolution: 'eplanner-google-sheets',
  });

  console.log('[GOOGLE SHEETS] Request body prepared, size:', JSON.stringify(requestBody).length, 'bytes');

  const timeout = options.timeout || 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log('[GOOGLE SHEETS] Sending POST request to Google Apps Script...');
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    });

    clearTimeout(timeoutId);
    console.log('[GOOGLE SHEETS] Response received, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GOOGLE SHEETS] Request failed:', response.status, errorText);
      throw new Error(
        `Google Sheets request failed with status ${response.status}: ${errorText}`
      );
    }

    let result;
    try {
      result = await response.json();
      console.log('[GOOGLE SHEETS] Response parsed successfully:', result);
    } catch {
      result = { success: true };
      console.log('[GOOGLE SHEETS] Response not JSON, assuming success');
    }

    console.log('[GOOGLE SHEETS] Submission successful');
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('[GOOGLE SHEETS] Request timed out after', timeout, 'ms');
      throw new Error(`Google Sheets request timed out after ${timeout}ms`);
    }
    console.error('[GOOGLE SHEETS] Request error:', error.message);
    console.error('[GOOGLE SHEETS] Error stack:', error.stack);
    throw error;
  }
}

/**
 * Read data from Google Sheets via GET request
 * @param {Object} params - Query parameters for the read request
 * @param {string} params.action - Action type: 'getRun', 'getRuns', 'getSignups'
 * @param {string} [params.runId] - Run ID for getRun or getSignups
 * @param {Object} [options] - Request options
 * @returns {Promise<Object>} The data from Google Sheets
 */
async function readFromGoogleSheets(params, options = {}) {
  console.log('[GOOGLE SHEETS READ] Starting read request:', params);
  
  const endpoint = getSheetEndpoint();
  
  if (!endpoint) {
    console.warn('[GOOGLE SHEETS READ] Skipping read: endpoint not configured');
    throw new Error('Google Sheets endpoint URL is not configured');
  }

  console.log('[GOOGLE SHEETS READ] Endpoint configured:', endpoint.substring(0, 50) + '...');
  
  const fetchImpl = getFetch();
  console.log('[GOOGLE SHEETS READ] Fetch implementation ready');
  
  // Build query string - use URLSearchParams if available, otherwise build manually
  let queryString = '';
  try {
    if (typeof URLSearchParams !== 'undefined') {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      queryString = queryParams.toString();
    } else {
      // Fallback for environments without URLSearchParams
      const pairs = [];
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
      });
      queryString = pairs.join('&');
    }
  } catch (error) {
    console.error('[GOOGLE SHEETS READ] Error building query string:', error);
    // Fallback to manual encoding
    const pairs = [];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });
    queryString = pairs.join('&');
  }
  
  const url = `${endpoint}?${queryString}`;
  console.log('[GOOGLE SHEETS READ] Request URL:', url.substring(0, 100) + '...');

  const timeout = options.timeout || 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    console.log('[GOOGLE SHEETS READ] Sending GET request to Google Apps Script...');
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[GOOGLE SHEETS READ] Response received, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GOOGLE SHEETS READ] Request failed:', response.status, errorText);
      throw new Error(
        `Google Sheets read request failed with status ${response.status}: ${errorText}`
      );
    }

    let result;
    try {
      const responseText = await response.text();
      console.log('[GOOGLE SHEETS READ] Response text (first 500 chars):', responseText.substring(0, 500));
      
      // Check if response is HTML (error page from Apps Script)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html') || responseText.includes('<title>Error</title>')) {
        console.error('[GOOGLE SHEETS READ] Apps Script returned HTML error page instead of JSON');
        console.error('[GOOGLE SHEETS READ] Full HTML response:', responseText);
        throw new Error('Google Apps Script returned an HTML error page. The web app may need to be redeployed or there may be a permission issue. Check Apps Script execution logs.');
      }
      
      try {
        result = JSON.parse(responseText);
        console.log('[GOOGLE SHEETS READ] Response parsed successfully:', result);
      } catch (parseError) {
        console.error('[GOOGLE SHEETS READ] Failed to parse JSON response. Response text:', responseText);
        throw new Error(`Invalid JSON response from Google Sheets: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.error('[GOOGLE SHEETS READ] Failed to parse JSON response:', error);
      throw error;
    }

    // Check if the result indicates an error from Apps Script
    if (result && result.success === false) {
      console.error('[GOOGLE SHEETS READ] Apps Script returned error:', result.error);
      throw new Error(result.error || 'Google Apps Script returned an error');
    }

    console.log('[GOOGLE SHEETS READ] Read successful');
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('[GOOGLE SHEETS READ] Request timed out after', timeout, 'ms');
      throw new Error(`Google Sheets read request timed out after ${timeout}ms`);
    }
    console.error('[GOOGLE SHEETS READ] Request error:', error.message);
    console.error('[GOOGLE SHEETS READ] Error stack:', error.stack);
    throw error;
  }
}

module.exports = {
  submitToGoogleSheets,
  readFromGoogleSheets,
};

