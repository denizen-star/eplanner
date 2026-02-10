const { jsonResponse, parseBody, extractClientMetadata, getAppName, getTenant } = require('./utils');
const { appEvents, appMembers } = require('../../lib/databaseClient');
const { getGeolocationFromIP } = require('../../lib/ipGeolocation');

const SIGNUP_INTENT_CTAS = [
  'signup_submit_click',
  'event_signup_click',
  'calendar_event_click',
  'desktop_calendar_signup_click',
  'home_signup_button_click',
];

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

/**
 * If this is a signup-intent CTA, upsert a passive NA app_member (same request, no new endpoint).
 * Non-blocking: failures are logged but do not fail the analytics response.
 */
async function upsertPassiveMemberIfSignupCta(body, event) {
  if (body.eventType !== 'cta_click' || !body.ctaType || !SIGNUP_INTENT_CTAS.includes(body.ctaType)) {
    return;
  }
  try {
    const { appName, tenantKey } = getTenant(event);
    const sessionId = body.sessionId || null;
    const email = body.memberEmail != null ? String(body.memberEmail).trim() : null;
    const name = body.memberName != null ? String(body.memberName).trim() : null;
    const phone = body.memberPhone != null ? String(body.memberPhone).trim() : null;
    if (!sessionId && !email) return;
    await appMembers.upsertPassiveNaMember(appName, tenantKey, { sessionId, email, name, phone });
  } catch (err) {
    console.warn('[ANALYTICS] Passive member upsert failed (non-fatal):', err.message);
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

    // Reuse same call for passive app_member (signup-intent CTAs only)
    await upsertPassiveMemberIfSignupCta(body, event);
    
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
