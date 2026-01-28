const { runs, signups, waivers, tenants } = require('../../lib/databaseClient');
const EmailService = require('../../lib/emailService');
const { signupConfirmationEmail, signupNotificationEmail } = require('../../lib/emailTemplates');

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
    const { name, phone, email, instagram, waiverAccepted, externalSignup, deviceInfo, sessionInfo, pageUrl, referrer, waiverText } = body;

    console.log('[RUNS SIGNUP] Request received for runId:', runId);

    // At least one of phone or email must be provided
    const hasContactInfo = phone || email;
    
    if (!name || !hasContactInfo || !waiverAccepted) {
      console.error('[RUNS SIGNUP] Validation failed: Missing required fields');
      return jsonResponse(400, { success: false, error: 'Name, at least one of phone or email, and waiver acceptance are required' });
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

    // Check if event is cancelled
    if (run.status === 'cancelled') {
      console.error('[RUNS SIGNUP] Event is cancelled:', runId);
      return jsonResponse(400, { success: false, error: 'This event has been cancelled.' });
    }

    // Check if signups are still available (1-hour restriction)
    const eventStartTime = new Date(run.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < 1) {
      console.error('[RUNS SIGNUP] Signups blocked - event starts within 1 hour:', { runId, hoursUntilEvent });
      return jsonResponse(400, { success: false, error: 'Signups are no longer available. This event starts within 1 hour.' });
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
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        instagram: instagram ? instagram.trim() : '',
        waiverAccepted: true,
        externalSignup: !!externalSignup,
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
        participantPhone: phone ? phone.trim() : null,
        waiverText: waiverText || '',
        timestamp: signedAt,
        metadata: metadata,
      });
      console.log('[RUNS SIGNUP] Waiver created successfully');
    } catch (waiverError) {
      console.error('[RUNS SIGNUP] Database error creating waiver:', waiverError.message);
      // Don't fail the signup if waiver creation fails, but log it
    }

    console.log('[RUNS SIGNUP] Success! Signup completed for:', name);

    // Send confirmation emails (non-blocking)
    console.log('[RUNS SIGNUP] Sending confirmation emails...');
    console.log('[RUNS SIGNUP] Created signup object:', JSON.stringify({
      id: createdSignup.id,
      name: createdSignup.name,
      email: createdSignup.email,
      phone: createdSignup.phone
    }));
    try {
      const emailService = new EmailService();
      const emailEnabled = emailService.isEnabled();
      // Only log boolean value, never log sensitive information
      console.log('[RUNS SIGNUP] Email service enabled:', !!emailEnabled);
      if (emailEnabled) {
        const host = event.headers?.host || event.headers?.Host || 'eplanner.kervinapps.com';
        const protocol = event.headers?.['x-forwarded-proto'] || 'https';
        const baseUrl = `${protocol}://${host}`;
        const eventViewLink = `${baseUrl}/event.html?id=${runId}`;
        let fromEmail = null;
        try {
          const tk = run.tenantKey || null;
          if (tk) {
            const tn = await tenants.getByKey(tk);
            if (tn && tn.senderEmail) fromEmail = tn.senderEmail;
          }
        } catch (e) { /* ignore */ }
        const fromOpt = fromEmail ? { fromEmail } : {};

        if (createdSignup.email && createdSignup.email.trim()) {
          try {
            const attendeeEmail = createdSignup.email.trim();
            console.log('[RUNS SIGNUP] Sending confirmation email to:', attendeeEmail);
            const attendeeEmailContent = await signupConfirmationEmail(run, createdSignup, eventViewLink, !!externalSignup);
            const emailResult = await emailService.sendEmail({
              to: attendeeEmail,
              subject: attendeeEmailContent.subject,
              html: attendeeEmailContent.html,
              text: attendeeEmailContent.text,
              fromName: attendeeEmailContent.fromName,
              ...fromOpt,
            });
            if (emailResult) {
              console.log('[RUNS SIGNUP] Confirmation email sent successfully to attendee:', attendeeEmail);
            } else {
              console.error('[RUNS SIGNUP] Email service returned false for attendee email');
            }
          } catch (attendeeEmailError) {
            console.error('[RUNS SIGNUP] Error sending email to attendee:', attendeeEmailError.message);
          }
        } else {
          console.log('[RUNS SIGNUP] No email provided by attendee, skipping confirmation email');
        }

        if (run.coordinatorEmail && run.coordinatorEmail.trim()) {
          try {
            const coordinatorEmailContent = signupNotificationEmail(run, createdSignup, run.coordinatorEmail);
            await emailService.sendEmail({
              to: run.coordinatorEmail.trim(),
              subject: coordinatorEmailContent.subject,
              html: coordinatorEmailContent.html,
              text: coordinatorEmailContent.text,
              fromName: coordinatorEmailContent.fromName,
              ...fromOpt,
            });
            console.log('[RUNS SIGNUP] Notification email sent to coordinator');
          } catch (coordinatorEmailError) {
            console.error('[RUNS SIGNUP] Error sending email to coordinator:', coordinatorEmailError.message);
          }
        }
      } else {
        console.log('[RUNS SIGNUP] Email service is disabled, skipping emails');
      }
    } catch (emailError) {
      console.error('[RUNS SIGNUP] Error in email sending process:', emailError.message);
      // Don't fail the signup if email fails
    }

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
