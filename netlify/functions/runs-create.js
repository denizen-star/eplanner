const { runs, telemetry } = require('../../lib/databaseClient');
const { getGeolocationFromIP } = require('../../lib/ipGeolocation');
const EmailService = require('../../lib/emailService');
const { eventCreatedEmail } = require('../../lib/emailTemplates');
const { getAppName } = require('./utils');

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

// Helper function to generate all event links (DRY principle)
function generateEventLinks(baseUrl, eventId) {
  return {
    signupLink: `${baseUrl}/signup.html?id=${eventId}`,
    manageLink: `${baseUrl}/manage.html?id=${eventId}`,
    eventViewLink: `${baseUrl}/event.html?id=${eventId}`
  };
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
      location, coordinates, plannerName, pacerName, title, dateTime, endTime, timezone, maxParticipants, deviceInfo, sessionInfo,
      house_number, road, suburb, city, county, state, postcode, country, country_code,
      neighbourhood, city_district, village, town, municipality, pageUrl, referrer, picture, description,
      coordinatorEmail, isPublic, placeName, eventWebsite, eventInstagram
    } = body;
    // Support both plannerName (new) and pacerName (legacy) for backward compatibility
    const nameToUse = plannerName || pacerName;

    console.log('[RUNS CREATE] Request received:', {
      hasLocation: !!location,
      hasPlannerName: !!nameToUse,
      hasDateTime: !!dateTime,
      maxParticipants: maxParticipants,
      hasCoordinatorEmail: !!coordinatorEmail
    });

    // Validate and trim all required fields
    const trimmedLocation = location ? location.trim() : '';
    const trimmedPlannerName = nameToUse ? nameToUse.trim() : '';
    const trimmedCoordinatorEmail = coordinatorEmail ? coordinatorEmail.trim() : '';

    if (!trimmedLocation || !trimmedPlannerName || !dateTime || !maxParticipants || !trimmedCoordinatorEmail) {
      console.error('[RUNS CREATE] Validation failed: Missing required fields');
      return jsonResponse(400, { success: false, error: 'Missing required fields: location, plannerName, dateTime, maxParticipants, and coordinatorEmail are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedCoordinatorEmail)) {
      console.error('[RUNS CREATE] Validation failed: Invalid email format');
      return jsonResponse(400, { success: false, error: 'Invalid coordinator email address format' });
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

    // Get base URL from event (needed before generating links)
    const host = event.headers?.host || event.headers?.Host || 'eplanner.kervinapps.com';
    const protocol = event.headers?.['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Detect app name from domain (for domain-specific event filtering)
    const appName = getAppName(event);
    console.log('[RUNS CREATE] Detected app name:', appName);
    
    // Generate all event links using helper function (DRY) - MUST be before database insert
    const links = generateEventLinks(baseUrl, shortId);
    const { signupLink, manageLink, eventViewLink } = links;

    // Save to PlanetScale database
    console.log('[RUNS CREATE] Saving to PlanetScale database...');
    try {
      await runs.create({
        id: shortId,
        uuid: uuid,
        location: trimmedLocation,
        coordinates: coordinates || null,
        plannerName: trimmedPlannerName,
        coordinatorEmail: trimmedCoordinatorEmail,
        title: title ? title.trim() : null,
        dateTime: dateTime,
        endTime: endTime || null,
        timezone: timezone || null,
        maxParticipants: parseInt(maxParticipants),
        status: 'active',
        isPublic: isPublic !== undefined ? isPublic : true, // Default to true
        appName: appName, // Store app name for domain filtering
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
        municipality: municipality || null,
        placeName: placeName ? placeName.trim() : null,
        picture: picture || null,
        description: description || null,
        // Store links in database
        signupLink: signupLink,
        manageLink: manageLink,
        eventViewLink: eventViewLink,
        eventWebsite: eventWebsite ? eventWebsite.trim() : null,
        eventInstagram: eventInstagram ? eventInstagram.trim() : null
      });
      console.log('[RUNS CREATE] Run saved to database successfully');
    } catch (dbError) {
      console.error('[RUNS CREATE] Database save failed:', dbError.message);
      console.error('[RUNS CREATE] Database error stack:', dbError.stack);
      // Check if it's a column error (database migration not run)
      if (dbError.message && dbError.message.includes('Unknown column')) {
        const missingColumns = [];
        if (dbError.message.includes('is_public')) missingColumns.push('is_public');
        if (dbError.message.includes('end_time')) missingColumns.push('end_time');
        if (dbError.message.includes('place_name')) missingColumns.push('place_name');
        if (dbError.message.includes('signup_link')) missingColumns.push('signup_link');
        if (dbError.message.includes('manage_link')) missingColumns.push('manage_link');
        if (dbError.message.includes('event_view_link')) missingColumns.push('event_view_link');
        if (dbError.message.includes('picture') || dbError.message.includes('description')) {
          missingColumns.push('picture/description');
        }
        if (missingColumns.length > 0) {
          throw new Error(`Database migration required: Please add columns: ${missingColumns.join(', ')}. See migration-add-public-endtime-place-links.sql file.`);
        }
      }
      throw new Error(`Failed to save event to database: ${dbError.message}`);
    }

    // Create telemetry record (non-blocking, don't fail if this fails)
    console.log('[RUNS CREATE] Creating telemetry record...');
    try {
      // Extract session ID from sessionInfo
      const sessionId = sessionInfo?.sessionId || null;
      
      // Get IP geolocation
      let ipGeolocation = null;
      if (ipAddress && ipAddress !== 'unknown') {
        try {
          console.log('[RUNS CREATE] Fetching geolocation for IP:', ipAddress);
          ipGeolocation = await getGeolocationFromIP(ipAddress);
          console.log('[RUNS CREATE] Geolocation result:', ipGeolocation ? 'success' : 'null');
        } catch (geoError) {
          console.warn('[RUNS CREATE] IP geolocation failed:', geoError.message);
        }
      } else {
        console.log('[RUNS CREATE] Skipping geolocation - invalid IP:', ipAddress);
      }

      await telemetry.create({
        eventType: 'event_create',
        runId: shortId,
        signupId: null,
        sessionId: sessionId,
        ipAddress: ipAddress,
        ipGeolocation: ipGeolocation,
        deviceInfo: deviceInfo || null,
        sessionInfo: sessionInfo || null,
        pageUrl: pageUrl || null,
        referrer: referrer || null,
      });
      console.log('[RUNS CREATE] Telemetry record created successfully');
    } catch (telemetryError) {
      console.error('[RUNS CREATE] Database error creating telemetry:', telemetryError.message);
      // Don't fail the event creation if telemetry creation fails, but log it
    }

    console.log('[RUNS CREATE] Success! Run created:', { shortId, signupLink, manageLink });

    // Send confirmation email to coordinator (non-blocking)
    console.log('[RUNS CREATE] Sending confirmation email...');
    let emailStatus = {
      attempted: false,
      enabled: false, // Always boolean, never password or other value
      sent: false,
      error: null
    };
    
    try {
      const emailService = new EmailService();
      
      // Diagnostic logging (NEVER log passwords!)
      const emailStatusInfo = {
        enabled: !!emailService.enabled, // Ensure boolean
        isEnabled: emailService.isEnabled(),
        hasSmtpServer: !!emailService.config.smtpServer,
        hasSenderEmail: !!emailService.config.senderEmail,
        hasSenderPassword: !!emailService.config.senderPassword, // Only boolean, never the actual password
        smtpServer: emailService.config.smtpServer || 'NOT SET',
        senderEmail: emailService.config.senderEmail || 'NOT SET',
        // NEVER log senderPassword - security risk!
      };
      
      console.log('[RUNS CREATE] Email service status:', emailStatusInfo);
      
      emailStatus.attempted = true;
      emailStatus.enabled = !!emailService.isEnabled(); // Ensure boolean, never password
      
      if (emailService.isEnabled()) {
        const runForEmail = {
          ...runData,
          plannerName: trimmedPlannerName,
          location: trimmedLocation,
          timezone: timezone || null,
          coordinates: coordinates || null,
          picture: picture || null,
          description: description || null,
        };
        
        let emailContent;
        try {
          emailContent = eventCreatedEmail(runForEmail, trimmedCoordinatorEmail, signupLink, manageLink);
          
          // Validate email content
          if (!emailContent || !emailContent.subject || !emailContent.html) {
            throw new Error('Email content generation failed: missing required fields');
          }
          
          console.log('[RUNS CREATE] Email content generated successfully:', {
            hasSubject: !!emailContent.subject,
            hasHtml: !!emailContent.html,
            hasText: !!emailContent.text,
            htmlLength: emailContent.html ? emailContent.html.length : 0
          });
        } catch (templateError) {
          console.error('[RUNS CREATE] Error generating email template:', templateError.message);
          console.error('[RUNS CREATE] Template error stack:', templateError.stack);
          throw templateError;
        }
        
        console.log('[RUNS CREATE] Attempting to send email to:', trimmedCoordinatorEmail);
        const emailResult = await emailService.sendEmail({
          to: trimmedCoordinatorEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          fromName: emailContent.fromName,
        });
        
        emailStatus.sent = emailResult;
        
        if (emailResult) {
          console.log('[RUNS CREATE] Confirmation email sent successfully');
        } else {
          console.error('[RUNS CREATE] Email service returned false - email not sent');
          emailStatus.error = 'Email service returned false';
        }
      } else {
        console.warn('[RUNS CREATE] Email service is disabled or configuration incomplete');
        console.warn('[RUNS CREATE] To enable emails, set environment variables:');
        console.warn('[RUNS CREATE]   - EMAIL_ENABLED=true');
        console.warn('[RUNS CREATE]   - SMTP_SERVER (e.g., smtp.zoho.com)');
        console.warn('[RUNS CREATE]   - SMTP_PORT (587 or 465)');
        console.warn('[RUNS CREATE]   - SENDER_EMAIL (your email address)');
        console.warn('[RUNS CREATE]   - SENDER_PASSWORD (app-specific password)');
        emailStatus.error = 'Email service disabled or configuration incomplete';
      }
    } catch (emailError) {
      console.error('[RUNS CREATE] Error sending confirmation email:', emailError.message);
      console.error('[RUNS CREATE] Error stack:', emailError.stack);
      emailStatus.error = emailError.message;
      // Don't fail the event creation if email fails
    }

    // Log final email status for debugging
    console.log('[RUNS CREATE] Final email status:', {
      attempted: emailStatus.attempted,
      enabled: emailStatus.enabled,
      sent: emailStatus.sent,
      error: emailStatus.error || 'none'
    });

    return jsonResponse(200, {
      success: true,
      run: runData,
      signupLink: signupLink,
      manageLink: manageLink,
      eventViewLink: eventViewLink,
      emailStatus: emailStatus
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

