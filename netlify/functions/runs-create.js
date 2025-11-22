const { runs } = require('../../lib/databaseClient');

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

function generateShortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

exports.handler = async (event) => {
  console.log('[RUNS CREATE] Handler invoked');
  
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { success: true });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = parseBody(event);
    const { 
      location, coordinates, plannerName, pacerName, title, dateTime, maxParticipants, deviceInfo, sessionInfo,
      house_number, road, suburb, city, county, state, postcode, country, country_code,
      neighbourhood, city_district, village, town, municipality
    } = body;
    // Support both plannerName (new) and pacerName (legacy) for backward compatibility
    const nameToUse = plannerName || pacerName;

    console.log('[RUNS CREATE] Request received:', {
      hasLocation: !!location,
      hasPlannerName: !!nameToUse,
      hasDateTime: !!dateTime,
      maxParticipants: maxParticipants
    });

    // Validate and trim all required fields
    const trimmedLocation = location ? location.trim() : '';
    const trimmedPlannerName = nameToUse ? nameToUse.trim() : '';

    if (!trimmedLocation || !trimmedPlannerName || !dateTime || !maxParticipants) {
      console.error('[RUNS CREATE] Validation failed: Missing required fields');
      return jsonResponse(400, { success: false, error: 'Missing required fields' });
    }

    if (maxParticipants <= 0 || !Number.isInteger(maxParticipants)) {
      console.error('[RUNS CREATE] Validation failed: Invalid maxParticipants');
      return jsonResponse(400, { success: false, error: 'Max participants must be a positive integer' });
    }

    console.log('[RUNS CREATE] Generating IDs...');
    const shortId = generateShortId();
    const uuid = generateUUID();
    const runDate = new Date(dateTime).toISOString().split('T')[0];
    const createdAt = new Date().toISOString();

    const runData = {
      id: shortId,
      uuid: uuid,
      location: trimmedLocation,
      plannerName: trimmedPlannerName,
      title: title ? title.trim() : null,
      dateTime: dateTime,
      maxParticipants: parseInt(maxParticipants),
      createdAt: createdAt,
      signups: [],
      status: 'active'
    };

    // Store coordinates if provided from geocoding
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      runData.coordinates = coordinates;
      console.log('[RUNS CREATE] Coordinates added:', coordinates);
    }

    // Extract client metadata (for future use if needed)
    console.log('[RUNS CREATE] Extracting client metadata...');
    const { ipAddress, userAgent } = extractClientMetadata(event.headers);
    console.log('[RUNS CREATE] Client metadata extracted');

    // Store metadata for potential future use
    const metadata = {
      deviceInfo: deviceInfo || null,
      ipAddress: ipAddress,
      userAgent: userAgent,
    };

    // Save to PlanetScale database
    console.log('[RUNS CREATE] Saving to PlanetScale database...');
    try {
      await runs.create({
        id: shortId,
        uuid: uuid,
        location: trimmedLocation,
        coordinates: coordinates || null,
        plannerName: trimmedPlannerName,
        title: title ? title.trim() : null,
        dateTime: dateTime,
        maxParticipants: parseInt(maxParticipants),
        status: 'active',
        createdAt: createdAt,
        // Address component fields
        house_number: house_number || null,
        road: road || null,
        suburb: suburb || null,
        city: city || null,
        county: county || null,
        state: state || null,
        postcode: postcode || null,
        country: country || null,
        country_code: country_code || null,
        neighbourhood: neighbourhood || null,
        city_district: city_district || null,
        village: village || null,
        town: town || null,
        municipality: municipality || null
      });
      console.log('[RUNS CREATE] Run saved to database successfully');
    } catch (dbError) {
      console.error('[RUNS CREATE] Database save failed:', dbError.message);
      throw new Error('Failed to save event to database');
    }

    // Get base URL from event
    const host = event.headers?.host || event.headers?.Host || 'eplanner.kervinapps.com';
    const protocol = event.headers?.['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    const signupLink = `${baseUrl}/signup.html?id=${shortId}`;
    const manageLink = `${baseUrl}/manage.html?id=${shortId}`;

    console.log('[RUNS CREATE] Success! Run created:', { shortId, signupLink, manageLink });

    return jsonResponse(200, {
      success: true,
      run: runData,
      signupLink: signupLink,
      manageLink: manageLink
    });
  } catch (error) {
    console.error('[RUNS CREATE] ERROR:', error);
    console.error('[RUNS CREATE] Error stack:', error.stack);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to create event',
      message: error.message
    });
  }
};

