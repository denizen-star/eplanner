const { jsonResponse, parseBody, extractClientMetadata, getAppName } = require('./utils');
const { appEvents } = require('../../lib/databaseClient');
const { getGeolocationFromIP } = require('../../lib/ipGeolocation');

/**
 * Validate required event data
 */
function validateEventRequirements(body) {
  if (!body.eventType) {
    return { valid: false, error: 'eventType is required' };
  }
  return { valid: true };
}

/**
 * Build telemetry payload from request body and event metadata
 */
async function buildTelemetryPayload(body, event) {
  const { ipAddress, userAgent } = extractClientMetadata(event.headers);
  const appName = getAppName(event);
  
  // Fetch IP geolocation if IP address is available
  let ipGeolocation = null;
  if (ipAddress && ipAddress !== 'unknown' && !ipAddress.startsWith('127.')) {
    try {
      ipGeolocation = await getGeolocationFromIP(ipAddress);
    } catch (error) {
      console.warn('[ANALYTICS] Failed to get geolocation:', error.message);
      // Continue without geolocation - non-blocking
    }
  }

  // Build payload - map frontend field names to database field names
  const payload = {
    appName: appName,
    timestamp: body.timestamp || new Date().toISOString(),
    sessionId: body.sessionId || null,
    eventType: body.eventType,
    pageCategory: body.pageCategory || null,
    pageUrl: body.pageUrl || null,
    articleId: body.articleId || null,
    articleSlug: body.articleSlug || null,
    articleContext: body.articleContext || null,
    ctaType: body.ctaType || null,
    depthPercent: body.depthPercent || null,
    referrer: body.referrer || null,
    deviceInfo: body.deviceInfo || null,
    ipAddress: ipAddress || null,
    ipGeolocation: ipGeolocation,
    userAgent: userAgent || null,
  };

  return payload;
}

/**
 * Write telemetry data to database
 */
async function writeTelemetryToDatabase(payload) {
  try {
    await appEvents.create(payload);
    return { success: true };
  } catch (error) {
    // Log error but don't throw - telemetry should never break the app
    console.error('[ANALYTICS] Failed to write to database:', error.message);
    throw error;
  }
}

exports.handler = async (event) => {
  console.log('[ANALYTICS EVENT] Handler invoked');
  
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { success: true });
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { 
      success: false, 
      error: 'Method Not Allowed. Only POST requests are accepted.' 
    });
  }

  try {
    // Parse request body using shared utility
    const body = parseBody(event);
    
    // Validate required fields
    const validation = validateEventRequirements(body);
    if (!validation.valid) {
      return jsonResponse(400, {
        success: false,
        error: validation.error,
      });
    }

    // Build telemetry payload with IP geolocation
    const payload = await buildTelemetryPayload(body, event);
    
    // Write to database
    await writeTelemetryToDatabase(payload);
    
    // Return success response
    return jsonResponse(200, {
      success: true,
      message: 'Event tracked successfully',
    });

  } catch (error) {
    console.error('[ANALYTICS EVENT] Error:', error.message);
    console.error('[ANALYTICS EVENT] Stack:', error.stack);
    
    // Return error response - but make it non-fatal
    return jsonResponse(500, {
      success: false,
      error: 'Failed to track event',
      // Don't expose internal error details in production
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};
