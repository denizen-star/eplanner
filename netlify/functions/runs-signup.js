const { runs, signups, waivers, telemetry } = require('../../lib/databaseClient');
const { getGeolocationFromIP } = require('../../lib/ipGeolocation');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
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
    ipAddress: ip.split(',')[0].trim() || 'unknown',
    userAgent: normalized['user-agent'] || '',
  };
}

exports.handler = async (event) => {
  console.log('[RUNS SIGNUP] Handler invoked');
  
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { success: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    // Extract runId from path: /api/runs/:runId/signup
    const pathParts = event.path.split('/').filter(p => p);
    const runIdIndex = pathParts.indexOf('runs');
    const runId = runIdIndex >= 0 && pathParts[runIdIndex + 1] ? pathParts[runIdIndex + 1] : null;
    
    const body = parseBody(event);
    const { name, phone, email, instagram, waiverAccepted, deviceInfo, sessionInfo, pageUrl, referrer, waiverText } = body;

    console.log('[RUNS SIGNUP] Request received for runId:', runId);

    if (!name || !phone || !waiverAccepted) {
      console.error('[RUNS SIGNUP] Validation failed: Missing required fields');
      return jsonResponse(400, { success: false, error: 'Name, phone, and waiver acceptance are required' });
    }

    if (!runId) {
      console.error('[RUNS SIGNUP] Run ID not found in path');
      return jsonResponse(404, { success: false, error: 'Run not found' });
    }

    // Verify run exists and check capacity
    console.log('[RUNS SIGNUP] Verifying run exists...');
    const run = await runs.getById(runId);
    
    if (!run) {
      console.error('[RUNS SIGNUP] Run not found:', runId);
      return jsonResponse(404, { success: false, error: 'Run not found' });
    }

    // Check if run is full
    const signupCount = await signups.countByRunId(runId);
    if (signupCount >= run.maxParticipants) {
      console.error('[RUNS SIGNUP] Run is full:', { current: signupCount, max: run.maxParticipants });
      return jsonResponse(400, { success: false, error: 'Run is full' });
    }

    const signedAt = new Date().toISOString();
    
    // Extract client metadata
    console.log('[RUNS SIGNUP] Extracting client metadata...');
    const { ipAddress, userAgent } = extractClientMetadata(event.headers);

    // Prepare metadata
    const metadata = {
      deviceInfo: deviceInfo || null,
      sessionInfo: sessionInfo || null,
      ipAddress: ipAddress,
      userAgent: userAgent,
      pageUrl: pageUrl || null,
      referrer: referrer || null,
    };

    // Create signup in database
    console.log('[RUNS SIGNUP] Creating signup in database...');
    let createdSignup;
    try {
      createdSignup = await signups.create({
        runId: runId,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        instagram: instagram ? instagram.trim() : '',
        waiverAccepted: true,
        signedAt: signedAt,
        metadata: metadata,
      });
      console.log('[RUNS SIGNUP] Signup created with ID:', createdSignup.id);
    } catch (dbError) {
      console.error('[RUNS SIGNUP] Database error creating signup:', dbError.message);
      return jsonResponse(500, {
        success: false,
        error: 'Failed to create signup',
        message: dbError.message
      });
    }

    // Create waiver in database
    console.log('[RUNS SIGNUP] Creating waiver in database...');
    try {
      await waivers.create({
        runId: runId,
        signupId: createdSignup.id,
        participantName: name.trim(),
        participantPhone: phone.trim(),
        waiverText: waiverText || '',
        timestamp: signedAt,
        metadata: metadata,
      });
      console.log('[RUNS SIGNUP] Waiver created successfully');
    } catch (waiverError) {
      console.error('[RUNS SIGNUP] Database error creating waiver:', waiverError.message);
      // Don't fail the signup if waiver creation fails, but log it
    }

    // Create telemetry record (non-blocking, don't fail if this fails)
    console.log('[RUNS SIGNUP] Creating telemetry record...');
    try {
      // Extract session ID from sessionInfo
      const sessionId = sessionInfo?.sessionId || null;
      
      // Get IP geolocation
      let ipGeolocation = null;
      if (ipAddress && ipAddress !== 'unknown') {
        try {
          console.log('[RUNS SIGNUP] Fetching geolocation for IP:', ipAddress);
          ipGeolocation = await getGeolocationFromIP(ipAddress);
          console.log('[RUNS SIGNUP] Geolocation result:', ipGeolocation ? 'success' : 'null');
        } catch (geoError) {
          console.warn('[RUNS SIGNUP] IP geolocation failed:', geoError.message);
        }
      } else {
        console.log('[RUNS SIGNUP] Skipping geolocation - invalid IP:', ipAddress);
      }

      await telemetry.create({
        eventType: 'signup',
        runId: runId,
        signupId: createdSignup.id,
        sessionId: sessionId,
        ipAddress: ipAddress,
        ipGeolocation: ipGeolocation,
        deviceInfo: deviceInfo || null,
        sessionInfo: sessionInfo || null,
        pageUrl: pageUrl || null,
        referrer: referrer || null,
      });
      console.log('[RUNS SIGNUP] Telemetry record created successfully');
    } catch (telemetryError) {
      console.error('[RUNS SIGNUP] Database error creating telemetry:', telemetryError.message);
      // Don't fail the signup if telemetry creation fails, but log it
    }

    console.log('[RUNS SIGNUP] Success! Signup completed for:', name);
    return jsonResponse(200, {
      success: true,
      signup: {
        id: createdSignup.id,
        name: createdSignup.name,
        phone: createdSignup.phone,
        email: createdSignup.email,
        instagram: createdSignup.instagram,
        waiverAccepted: true,
        signedAt: signedAt
      }
    });
  } catch (error) {
    console.error('[RUNS SIGNUP] ERROR:', error);
    console.error('[RUNS SIGNUP] Error stack:', error.stack);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to sign up',
      message: error.message
    });
  }
};

