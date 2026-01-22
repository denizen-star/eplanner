// Load environment variables from .env file (only in local development)
// Netlify Functions get env vars from dashboard, so skip dotenv in production
if (process.env.NETLIFY !== 'true') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const { runs, signups, waivers } = require('./lib/databaseClient');
const EmailService = require('./lib/emailService');
const { 
  eventCreatedEmail,
  signupConfirmationEmail, 
  signupNotificationEmail,
  eventUpdatedEmail, 
  eventUpdatedToSignupsEmail,
  eventCancelledEmail
} = require('./lib/emailTemplates');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// Disable caching for API responses
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');
  }
  next();
});

app.use(express.static(PUBLIC_DIR, {
  setHeaders: (res, path) => {
    // Disable caching for HTML files
    if (path.endsWith('.html')) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Expires', '0');
      res.set('Pragma', 'no-cache');
    }
  }
}));

// All data is stored in PlanetScale database - no local filesystem storage
console.log('[SERVER INIT] Using PlanetScale database for data storage');

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

function extractClientMetadata(req) {
  const headers = req.headers || {};
  const normalized = Object.keys(headers).reduce((acc, key) => {
    acc[key.toLowerCase()] = headers[key];
    return acc;
  }, {});

  const ip =
    normalized['client-ip'] ||
    normalized['x-forwarded-for'] ||
    normalized['x-nf-client-connection-ip'] ||
    normalized['x-real-ip'] ||
    req.ip ||
    req.connection?.remoteAddress ||
    '';

  return {
    ipAddress: ip.split(',')[0].trim() || 'unknown',
    userAgent: normalized['user-agent'] || '',
  };
}

// Removed findRunFile - all data is now in PlanetScale database

app.post('/api/runs/create', async (req, res) => {
  console.log('[RUN CREATE] Request received:', {
    hasLocation: !!req.body.location,
    hasPacerName: !!req.body.pacerName,
    hasPlannerName: !!req.body.plannerName,
    hasDateTime: !!req.body.dateTime,
    maxParticipants: req.body.maxParticipants,
    hasCoordinatorEmail: !!req.body.coordinatorEmail,
    coordinatorEmailValue: req.body.coordinatorEmail,
    isNetlify: process.env.NETLIFY === 'true'
  });
  
  // Debug: Log all body keys
  console.log('[RUN CREATE] Request body keys:', Object.keys(req.body));
  console.log('[RUN CREATE] Full request body:', JSON.stringify(req.body, null, 2));

  try {
    const { location, coordinates, pacerName, plannerName, title, dateTime, endTime, timezone, maxParticipants, deviceInfo, sessionInfo, picture, description, coordinatorEmail, isPublic, placeName } = req.body;

    // Support both plannerName (new) and pacerName (legacy) for backward compatibility
    const nameToUse = plannerName || pacerName;

    // Validate and trim all required fields
    const trimmedLocation = location ? location.trim() : '';
    const trimmedPlannerName = nameToUse ? nameToUse.trim() : '';
    const trimmedCoordinatorEmail = coordinatorEmail ? coordinatorEmail.trim() : '';

    console.log('[RUN CREATE] Validating fields...');
    console.log('[RUN CREATE] Field check:', {
      hasLocation: !!trimmedLocation,
      hasPlannerName: !!trimmedPlannerName,
      hasDateTime: !!dateTime,
      maxParticipants: maxParticipants,
      maxParticipantsType: typeof maxParticipants,
      hasCoordinatorEmail: !!trimmedCoordinatorEmail
    });
    
    // Build detailed error message showing which fields are missing
    const missingFields = [];
    if (!trimmedLocation) missingFields.push('location');
    if (!trimmedPlannerName) missingFields.push('plannerName');
    if (!dateTime) missingFields.push('dateTime');
    if (!maxParticipants) missingFields.push('maxParticipants');
    if (!trimmedCoordinatorEmail) missingFields.push('coordinatorEmail');
    
    if (missingFields.length > 0) {
      console.error('[RUN CREATE] Validation failed: Missing required fields', {
        location: trimmedLocation || 'MISSING',
        plannerName: trimmedPlannerName || 'MISSING',
        dateTime: dateTime || 'MISSING',
        maxParticipants: maxParticipants || 'MISSING',
        missingFields: missingFields
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields: missingFields,
        details: `Missing: ${missingFields.join(', ')}`
      });
    }

    if (maxParticipants <= 0 || !Number.isInteger(maxParticipants)) {
      console.error('[RUN CREATE] Validation failed: Invalid maxParticipants');
      return res.status(400).json({ error: 'Max participants must be a positive integer' });
    }

    // Validate email format
    if (trimmedCoordinatorEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedCoordinatorEmail)) {
        console.error('[RUN CREATE] Validation failed: Invalid email format');
        return res.status(400).json({ error: 'Invalid coordinator email address format' });
      }
    }

    console.log('[RUN CREATE] Generating IDs...');
    const shortId = generateShortId();
    const uuid = generateUUID();
    const createdAt = new Date().toISOString();

    console.log('[RUN CREATE] Creating run data object:', { shortId, uuid });

    const runData = {
      id: shortId,
      uuid: uuid,
      location: trimmedLocation,
      pacerName: trimmedPlannerName,
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
      console.log('[RUN CREATE] Coordinates added:', coordinates);
    }

    // Extract client metadata (for future use if needed)
    console.log('[RUN CREATE] Extracting client metadata...');
    const { ipAddress, userAgent } = extractClientMetadata(req);
    console.log('[RUN CREATE] Client metadata extracted');

    // Get base URL and generate links
    const baseUrl = req.protocol + '://' + req.get('host');
    const links = generateEventLinks(baseUrl, shortId);
    const { signupLink, manageLink, eventViewLink } = links;

    // Detect app name from domain (for domain-specific event filtering)
    const host = req.get('host') || '';
    const hostLower = host.toLowerCase();
    let appName = 'eplanner'; // Default
    if (hostLower.includes('to-lgbtq')) {
      appName = 'to-lgbtq';
    } else if (hostLower.includes('eplanner') || hostLower.includes('eventplan')) {
      appName = 'eplanner';
    }
    console.log('[RUN CREATE] Detected app name:', appName);

    // Save to PlanetScale database
    console.log('[RUN CREATE] Saving to PlanetScale database...');
    try {
      const createData = {
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
        placeName: placeName ? placeName.trim() : null,
        picture: picture || null,
        description: description || null,
        signupLink: signupLink,
        manageLink: manageLink,
        eventViewLink: eventViewLink
      };
      
      console.log('[RUN CREATE] Create data prepared:', {
        hasPicture: !!createData.picture,
        hasDescription: !!createData.description,
        pictureLength: createData.picture ? createData.picture.length : 0
      });
      
      await runs.create(createData);
      console.log('[RUN CREATE] Run saved to database successfully');
    } catch (dbError) {
      console.error('[RUN CREATE] Database save failed:', dbError.message);
      console.error('[RUN CREATE] Database error stack:', dbError.stack);
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

    console.log('[RUN CREATE] Generating response URLs...');

    console.log('[RUN CREATE] Success! Run created:', { shortId, signupLink, manageLink, eventViewLink });

    // Send confirmation email to coordinator (non-blocking)
    console.log('[RUN CREATE] Sending confirmation email...');
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
      
      console.log('[RUN CREATE] Email service status:', emailStatusInfo);
      
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
          emailContent = await eventCreatedEmail(runForEmail, trimmedCoordinatorEmail, signupLink, manageLink);
          
          // Validate email content
          if (!emailContent || !emailContent.subject || !emailContent.html) {
            throw new Error('Email content generation failed: missing required fields');
          }
          
          console.log('[RUN CREATE] Email content generated successfully:', {
            hasSubject: !!emailContent.subject,
            hasHtml: !!emailContent.html,
            hasText: !!emailContent.text,
            htmlLength: emailContent.html ? emailContent.html.length : 0
          });
        } catch (templateError) {
          console.error('[RUN CREATE] Error generating email template:', templateError.message);
          console.error('[RUN CREATE] Template error stack:', templateError.stack);
          throw templateError;
        }
        
        console.log('[RUN CREATE] Attempting to send email to:', trimmedCoordinatorEmail);
        const emailResult = await emailService.sendEmail({
          to: trimmedCoordinatorEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          fromName: emailContent.fromName,
        });
        
        emailStatus.sent = emailResult;
        
        if (emailResult) {
          console.log('[RUN CREATE] Confirmation email sent successfully');
        } else {
          console.error('[RUN CREATE] Email service returned false - email not sent');
          emailStatus.error = 'Email service returned false';
        }
      } else {
        console.warn('[RUN CREATE] Email service is disabled or configuration incomplete');
        console.warn('[RUN CREATE] To enable emails, set environment variables:');
        console.warn('[RUN CREATE]   - EMAIL_ENABLED=true');
        console.warn('[RUN CREATE]   - SMTP_SERVER (e.g., smtp.zoho.com)');
        console.warn('[RUN CREATE]   - SMTP_PORT (587 or 465)');
        console.warn('[RUN CREATE]   - SENDER_EMAIL (your email address)');
        console.warn('[RUN CREATE]   - SENDER_PASSWORD (app-specific password)');
        emailStatus.error = 'Email service disabled or configuration incomplete';
      }
    } catch (emailError) {
      console.error('[RUN CREATE] Error sending confirmation email:', emailError.message);
      console.error('[RUN CREATE] Error stack:', emailError.stack);
      emailStatus.error = emailError.message;
      // Don't fail the event creation if email fails
    }

    res.json({
      success: true,
      run: runData,
      signupLink: signupLink,
      manageLink: manageLink,
      eventViewLink: eventViewLink,
      emailStatus: emailStatus
    });
  } catch (error) {
    console.error('[RUN CREATE] ERROR:', error);
    console.error('[RUN CREATE] Error stack:', error.stack);
    const statusCode = error.message.includes('Missing required fields') || error.message.includes('must be a positive integer') ? 400 : 500;
    res.status(statusCode).json({ 
      error: error.message || 'Failed to create event',
      message: error.message,
      details: process.env.NETLIFY === 'true' ? 'Netlify Functions environment' : 'Local environment'
    });
  }
});

app.get('/api/runs/:runId', async (req, res) => {
  const { runId } = req.params;
  console.log('[GET RUN] Request for runId:', runId);
  
  try {
    const run = await runs.getById(runId);

    if (!run) {
      console.error('[GET RUN] Run not found:', runId);
      return res.status(404).json({ error: 'Run not found' });
    }

    // Get signups for this run
    try {
      const runSignups = await signups.getByRunId(runId);
      run.signups = runSignups || [];
    } catch (signupsError) {
      console.warn('[GET RUN] Failed to load signups:', signupsError.message);
      run.signups = [];
    }

    console.log('[GET RUN] Run found:', run.id);
    res.json(run);
  } catch (error) {
    console.error('[GET RUN] ERROR:', error);
    console.error('[GET RUN] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get run', message: error.message });
  }
});

app.get('/api/runs', async (req, res) => {
  console.log('[GET RUNS] Request received');
  
  try {
    const allRuns = await runs.getAll();
    console.log('[GET RUNS] Returning', allRuns.length, 'runs');
    res.json({ runs: allRuns });
  } catch (error) {
    console.error('[GET RUNS] ERROR:', error);
    console.error('[GET RUNS] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get runs', message: error.message });
  }
});

app.get('/api/runs/public-calendar', async (req, res) => {
  console.log('[GET PUBLIC CALENDAR] Request received');
  
  try {
    // Parse query parameters
    const { startDate, endDate } = req.query;
    let startDateObj, endDateObj;

    if (startDate && endDate) {
      // Use provided date range
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);
    } else {
      // Default to current week
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day; // Sunday = 0
      startDateObj = new Date(today.setDate(diff));
      startDateObj.setHours(0, 0, 0, 0);
      
      endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + 6); // Add 6 days
      endDateObj.setHours(23, 59, 59, 999);
    }

    // Validate dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format. Use YYYY-MM-DD format.' 
      });
    }

    // Detect app name from domain (for domain-specific event filtering)
    const host = req.get('host') || '';
    const hostLower = host.toLowerCase();
    let appName = 'eplanner'; // Default
    if (hostLower.includes('to-lgbtq')) {
      appName = 'to-lgbtq';
    } else if (hostLower.includes('eplanner') || hostLower.includes('eventplan')) {
      appName = 'eplanner';
    }
    console.log('[GET PUBLIC CALENDAR] Detected app name:', appName);
    
    console.log('[GET PUBLIC CALENDAR] Fetching public events:', {
      startDate: startDateObj.toISOString(),
      endDate: endDateObj.toISOString(),
      appName: appName
    });

    // Fetch public events for the date range, filtered by app_name
    const events = await runs.getPublicEvents(startDateObj.toISOString(), endDateObj.toISOString(), appName);

    console.log('[GET PUBLIC CALENDAR] Success! Returning', events.length, 'events');

    res.json({
      success: true,
      events: events,
      startDate: startDateObj.toISOString(),
      endDate: endDateObj.toISOString()
    });
  } catch (error) {
    console.error('[GET PUBLIC CALENDAR] ERROR:', error);
    console.error('[GET PUBLIC CALENDAR] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.post('/api/runs/:runId/signup', async (req, res) => {
  const { runId } = req.params;
  console.log('[SIGNUP] Request received for runId:', runId);

  try {
    const { name, phone, email, instagram, waiverAccepted, deviceInfo, sessionInfo, pageUrl, referrer, waiverText } = req.body;

    console.log('[SIGNUP] Validating signup data...');
    // At least one of phone or email must be provided
    const hasContactInfo = phone || email;
    
    if (!name || !hasContactInfo || !waiverAccepted) {
      console.error('[SIGNUP] Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Name, at least one of phone or email, and waiver acceptance are required' });
    }

    // Verify run exists and check capacity
    console.log('[SIGNUP] Verifying run exists...');
    const run = await runs.getById(runId);
    
    if (!run) {
      console.error('[SIGNUP] Run not found:', runId);
      return res.status(404).json({ error: 'Run not found' });
    }

    // Check if event is cancelled
    if (run.status === 'cancelled') {
      console.error('[SIGNUP] Event is cancelled:', runId);
      return res.status(400).json({ error: 'This event has been cancelled.' });
    }

    // Check if signups are still available (1-hour restriction)
    const eventStartTime = new Date(run.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < 1) {
      console.error('[SIGNUP] Signups blocked - event starts within 1 hour:', { runId, hoursUntilEvent });
      return res.status(400).json({ error: 'Signups are no longer available. This event starts within 1 hour.' });
    }

    // Check if run is full
    const signupCount = await signups.countByRunId(runId);
    if (signupCount >= run.maxParticipants) {
      console.error('[SIGNUP] Run is full:', { current: signupCount, max: run.maxParticipants });
      return res.status(400).json({ error: 'Run is full' });
    }

    const signedAt = new Date().toISOString();

    // Extract client metadata
    console.log('[SIGNUP] Extracting client metadata...');
    const { ipAddress, userAgent } = extractClientMetadata(req);

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
    console.log('[SIGNUP] Creating signup in database...');
    let createdSignup;
    try {
      createdSignup = await signups.create({
        runId: runId,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        instagram: instagram ? instagram.trim() : '',
        waiverAccepted: true,
        signedAt: signedAt,
        metadata: metadata,
      });
      console.log('[SIGNUP] Signup created with ID:', createdSignup.id);
    } catch (dbError) {
      console.error('[SIGNUP] Database error creating signup:', dbError.message);
      return res.status(500).json({
        error: 'Failed to create signup',
        message: dbError.message
      });
    }

    // Create waiver in database
    console.log('[SIGNUP] Creating waiver in database...');
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
      console.log('[SIGNUP] Waiver created successfully');
    } catch (waiverError) {
      console.error('[SIGNUP] Database error creating waiver:', waiverError.message);
      // Don't fail the signup if waiver creation fails, but log it
    }

    console.log('[SIGNUP] Success! Signup completed for:', name);

    // Send confirmation emails (non-blocking)
    console.log('[SIGNUP] Sending confirmation emails...');
    try {
      const emailService = new EmailService();
      if (emailService.isEnabled()) {
        // Generate event view link
        const baseUrl = req.protocol + '://' + req.get('host');
        const eventViewLink = `${baseUrl}/event.html?id=${runId}`;
        
        // Send confirmation to attendee if they provided an email
        if (createdSignup.email && createdSignup.email.trim()) {
          try {
            const attendeeEmailContent = await signupConfirmationEmail(run, createdSignup, eventViewLink);
            await emailService.sendEmail({
              to: createdSignup.email.trim(),
              subject: attendeeEmailContent.subject,
              html: attendeeEmailContent.html,
              text: attendeeEmailContent.text,
              fromName: attendeeEmailContent.fromName,
            });
            console.log('[SIGNUP] Confirmation email sent to attendee');
          } catch (attendeeEmailError) {
            console.error('[SIGNUP] Error sending email to attendee:', attendeeEmailError.message);
          }
        }

        // Send notification to coordinator if coordinator email exists
        if (run.coordinatorEmail && run.coordinatorEmail.trim()) {
          try {
            const coordinatorEmailContent = signupNotificationEmail(run, createdSignup, run.coordinatorEmail);
            await emailService.sendEmail({
              to: run.coordinatorEmail.trim(),
              subject: coordinatorEmailContent.subject,
              html: coordinatorEmailContent.html,
              text: coordinatorEmailContent.text,
              fromName: coordinatorEmailContent.fromName,
            });
            console.log('[SIGNUP] Notification email sent to coordinator');
          } catch (coordinatorEmailError) {
            console.error('[SIGNUP] Error sending email to coordinator:', coordinatorEmailError.message);
          }
        }
      } else {
        console.log('[SIGNUP] Email service is disabled, skipping emails');
      }
    } catch (emailError) {
      console.error('[SIGNUP] Error in email sending process:', emailError.message);
      // Don't fail the signup if email fails
    }

    res.json({
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
    console.error('[SIGNUP] ERROR:', error);
    console.error('[SIGNUP] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to sign up', message: error.message });
  }
});

app.get('/api/runs/:runId/signups', async (req, res) => {
  try {
    const { runId } = req.params;

    // Verify run exists
    const run = await runs.getById(runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const runSignups = await signups.getByRunId(runId);
    res.json({ signups: runSignups });
  } catch (error) {
    console.error('Error getting signups:', error);
    res.status(500).json({ error: 'Failed to get signups' });
  }
});

app.delete('/api/runs/:runId/signups/:signupId', async (req, res) => {
  try {
    const { runId, signupId } = req.params;
    const signupIdInt = parseInt(signupId);

    if (isNaN(signupIdInt) || signupIdInt < 0) {
      return res.status(400).json({ error: 'Invalid signup ID' });
    }

    // Verify run exists
    const run = await runs.getById(runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Verify signup exists and belongs to this run
    const signup = await signups.getById(signupIdInt);
    if (!signup || signup.runId !== runId) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    await signups.delete(signupIdInt);
    const remainingSignups = await signups.getByRunId(runId);

    res.json({ success: true, signups: remainingSignups });
  } catch (error) {
    console.error('Error deleting signup:', error);
    res.status(500).json({ error: 'Failed to delete signup' });
  }
});

app.put('/api/runs/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const { location, pacerName, title, dateTime, maxParticipants, coordinates, picture, description } = req.body;

    console.log('[RUN UPDATE] Request received:', {
      runId,
      bodyKeys: Object.keys(req.body),
      location: location ? location.substring(0, 50) : location,
      pacerName: pacerName,
      title: title,
      dateTime: dateTime,
      maxParticipants: maxParticipants,
      hasPicture: !!picture,
      description: description ? description.substring(0, 50) : description
    });

    // Verify run exists
    const existingRun = await runs.getById(runId);
    if (!existingRun) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Check if event is cancelled
    if (existingRun.status === 'cancelled') {
      return res.status(400).json({ error: 'This event has been cancelled.' });
    }

    // Check if event can be modified (24-hour restriction)
    const eventStartTime = new Date(existingRun.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < 24) {
      return res.status(400).json({ error: 'Event cannot be modified within 24 hours of the event start time.' });
    }

    // Prepare updates
    // Support both plannerName (new) and pacerName (legacy) for backward compatibility
    const plannerName = req.body.plannerName || pacerName;
    const updates = {};
    if (location !== undefined) updates.location = location.trim();
    if (plannerName !== undefined) updates.plannerName = plannerName ? plannerName.trim() : '';
    if (title !== undefined) updates.title = title ? title.trim() : null;
    if (dateTime !== undefined) updates.dateTime = dateTime;
    if (coordinates !== undefined) updates.coordinates = coordinates;
    if (picture !== undefined) updates.picture = picture;
    if (description !== undefined) updates.description = description;
    if (req.body.placeName !== undefined) updates.placeName = req.body.placeName ? req.body.placeName.trim() : null;
    
    // Address component fields - ALWAYS include them if they're in the request body
    // This ensures address components are updated even if they're null (to clear old values)
    console.log('[RUN UPDATE] Checking address components in request body:', {
      has_house_number: req.body.house_number !== undefined,
      has_road: req.body.road !== undefined,
      has_city: req.body.city !== undefined,
      has_state: req.body.state !== undefined,
      has_postcode: req.body.postcode !== undefined,
      has_country: req.body.country !== undefined,
      house_number_value: req.body.house_number,
      road_value: req.body.road,
      city_value: req.body.city,
      state_value: req.body.state,
      postcode_value: req.body.postcode,
      country_value: req.body.country
    });
    
    if (req.body.house_number !== undefined) {
      updates.house_number = req.body.house_number ? req.body.house_number.trim() : null;
      console.log('[RUN UPDATE] Setting house_number:', updates.house_number);
    }
    if (req.body.road !== undefined) {
      updates.road = req.body.road ? req.body.road.trim() : null;
      console.log('[RUN UPDATE] Setting road:', updates.road);
    }
    if (req.body.suburb !== undefined) {
      updates.suburb = req.body.suburb ? req.body.suburb.trim() : null;
    }
    if (req.body.city !== undefined) {
      updates.city = req.body.city ? req.body.city.trim() : null;
      console.log('[RUN UPDATE] Setting city:', updates.city);
    }
    if (req.body.county !== undefined) {
      updates.county = req.body.county ? req.body.county.trim() : null;
    }
    if (req.body.state !== undefined) {
      updates.state = req.body.state ? req.body.state.trim() : null;
      console.log('[RUN UPDATE] Setting state:', updates.state);
    }
    if (req.body.postcode !== undefined) {
      updates.postcode = req.body.postcode ? req.body.postcode.trim() : null;
      console.log('[RUN UPDATE] Setting postcode:', updates.postcode);
    }
    if (req.body.country !== undefined) {
      updates.country = req.body.country ? req.body.country.trim() : null;
      console.log('[RUN UPDATE] Setting country:', updates.country);
    }
    if (req.body.country_code !== undefined) {
      updates.country_code = req.body.country_code ? req.body.country_code.trim() : null;
    }
    if (req.body.neighbourhood !== undefined) {
      updates.neighbourhood = req.body.neighbourhood ? req.body.neighbourhood.trim() : null;
    }
    if (req.body.city_district !== undefined) {
      updates.city_district = req.body.city_district ? req.body.city_district.trim() : null;
    }
    if (req.body.village !== undefined) {
      updates.village = req.body.village ? req.body.village.trim() : null;
    }
    if (req.body.town !== undefined) {
      updates.town = req.body.town ? req.body.town.trim() : null;
    }
    if (req.body.municipality !== undefined) {
      updates.municipality = req.body.municipality ? req.body.municipality.trim() : null;
    }
    
    console.log('[RUN UPDATE] Updates prepared:', {
      updateKeys: Object.keys(updates),
      hasLocation: updates.location !== undefined,
      hasPlannerName: updates.plannerName !== undefined,
      plannerNameValue: updates.plannerName,
      hasTitle: updates.title !== undefined,
      hasDateTime: updates.dateTime !== undefined,
      dateTimeValue: updates.dateTime,
      hasMaxParticipants: updates.maxParticipants !== undefined,
      hasPicture: updates.picture !== undefined,
      hasDescription: updates.description !== undefined,
      hasCoordinates: updates.coordinates !== undefined,
      hasPlaceName: updates.placeName !== undefined,
      addressComponents: {
        hasHouseNumber: updates.house_number !== undefined,
        hasRoad: updates.road !== undefined,
        hasCity: updates.city !== undefined,
        hasState: updates.state !== undefined,
        hasPostcode: updates.postcode !== undefined,
        hasCountry: updates.country !== undefined
      }
    });
    if (maxParticipants !== undefined) {
      if (maxParticipants <= 0 || !Number.isInteger(maxParticipants)) {
        return res.status(400).json({ error: 'Max participants must be a positive integer' });
      }
      // Check current signup count
      const signupCount = await signups.countByRunId(runId);
      if (signupCount > maxParticipants) {
        return res.status(400).json({ error: 'Cannot set max participants below current signup count' });
      }
      updates.maxParticipants = parseInt(maxParticipants);
    }

    // Track changes for email notifications
    const changes = {};
    if (updates.location !== undefined && updates.location !== existingRun.location) {
      changes['Location'] = `${existingRun.location} → ${updates.location}`;
    }
    if (updates.title !== undefined && updates.title !== existingRun.title) {
      changes['Title'] = `${existingRun.title || '(none)'} → ${updates.title || '(none)'}`;
    }
    // Compare dates by converting to ISO strings to handle different formats
    if (updates.dateTime !== undefined) {
      const oldDateObj = new Date(existingRun.dateTime);
      const newDateObj = new Date(updates.dateTime);
      // Compare timestamps (in milliseconds) to detect actual changes
      if (oldDateObj.getTime() !== newDateObj.getTime()) {
        const oldDate = oldDateObj.toLocaleString();
        const newDate = newDateObj.toLocaleString();
        changes['Date & Time'] = `${oldDate} → ${newDate}`;
        console.log('[RUN UPDATE] Date changed detected:', {
          oldDate: existingRun.dateTime,
          newDate: updates.dateTime,
          oldTimestamp: oldDateObj.getTime(),
          newTimestamp: newDateObj.getTime()
        });
      }
    }
    if (updates.maxParticipants !== undefined && updates.maxParticipants !== existingRun.maxParticipants) {
      changes['Max Participants'] = `${existingRun.maxParticipants} → ${updates.maxParticipants}`;
    }
    if (updates.plannerName !== undefined && updates.plannerName !== existingRun.plannerName) {
      changes['Planner Name'] = `${existingRun.plannerName} → ${updates.plannerName}`;
    }
    if (updates.description !== undefined && updates.description !== existingRun.description) {
      changes['Description'] = 'Updated';
    }
    
    console.log('[RUN UPDATE] Changes detected:', Object.keys(changes).length > 0 ? changes : 'No changes');
    console.log('[RUN UPDATE] Will send emails:', Object.keys(changes).length > 0);

    // Update in database
    console.log('[RUN UPDATE] Calling runs.update with:', {
      runId,
      updateKeys: Object.keys(updates),
      updatesCount: Object.keys(updates).length
    });
    const updatedRun = await runs.update(runId, updates);
    console.log('[RUN UPDATE] Database update completed. Updated run:', {
      id: updatedRun?.id,
      location: updatedRun?.location?.substring(0, 50),
      plannerName: updatedRun?.plannerName,
      title: updatedRun?.title,
      dateTime: updatedRun?.dateTime,
      addressComponents: {
        houseNumber: updatedRun?.houseNumber,
        house_number: updatedRun?.house_number,
        road: updatedRun?.road,
        city: updatedRun?.city,
        state: updatedRun?.state,
        postcode: updatedRun?.postcode,
        country: updatedRun?.country
      }
    });

    // Send update emails if there were changes (non-blocking)
    if (Object.keys(changes).length > 0) {
      console.log('[RUN UPDATE] Changes detected, sending update emails...');
      console.log('[RUN UPDATE] Coordinator email:', updatedRun.coordinatorEmail || 'NOT SET');
      try {
        const emailService = new EmailService();
        // Only log boolean value, never log sensitive information
        console.log('[RUN UPDATE] Email service enabled:', !!emailService.isEnabled());
        if (emailService.isEnabled()) {
          // Send email to coordinator
          if (updatedRun.coordinatorEmail && updatedRun.coordinatorEmail.trim()) {
            try {
              const coordinatorEmailContent = eventUpdatedEmail(updatedRun, changes, updatedRun.coordinatorEmail);
              await emailService.sendEmail({
                to: updatedRun.coordinatorEmail.trim(),
                subject: coordinatorEmailContent.subject,
                html: coordinatorEmailContent.html,
                text: coordinatorEmailContent.text,
                fromName: coordinatorEmailContent.fromName,
              });
              console.log('[RUN UPDATE] Update email sent to coordinator');
            } catch (coordinatorEmailError) {
              console.error('[RUN UPDATE] Error sending email to coordinator:', coordinatorEmailError.message);
            }
          }

          // Send email to all signups with email addresses
          try {
            const allSignups = await signups.getByRunId(runId);
            console.log('[RUN UPDATE] Total signups:', allSignups.length);
            const signupsWithEmail = allSignups.filter(s => s.email && s.email.trim());
            console.log('[RUN UPDATE] Signups with email:', signupsWithEmail.length);
            console.log('[RUN UPDATE] Signup emails:', signupsWithEmail.map(s => s.email));
            
            if (signupsWithEmail.length > 0) {
              const emailPromises = signupsWithEmail.map(async (signup) => {
                try {
                  const signupEmailContent = eventUpdatedToSignupsEmail(updatedRun, changes, signup);
                  await emailService.sendEmail({
                    to: signup.email.trim(),
                    subject: signupEmailContent.subject,
                    html: signupEmailContent.html,
                    text: signupEmailContent.text,
                    fromName: signupEmailContent.fromName,
                  });
                } catch (signupEmailError) {
                  console.error(`[RUN UPDATE] Error sending email to signup ${signup.id}:`, signupEmailError.message);
                }
              });
              
              await Promise.all(emailPromises);
              console.log(`[RUN UPDATE] Update emails sent to ${signupsWithEmail.length} signup(s)`);
            }
          } catch (signupsEmailError) {
            console.error('[RUN UPDATE] Error sending emails to signups:', signupsEmailError.message);
          }
        } else {
          console.log('[RUN UPDATE] Email service is disabled, skipping emails');
        }
      } catch (emailError) {
        console.error('[RUN UPDATE] Error in email sending process:', emailError.message);
        // Don't fail the update if email fails
      }
    }

    res.json({ success: true, run: updatedRun });
  } catch (error) {
    console.error('[RUN UPDATE] Error updating run:', error);
    console.error('[RUN UPDATE] Error stack:', error.stack);
    console.error('[RUN UPDATE] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    
    // Provide more detailed error message
    let errorMessage = error.message || 'Failed to update run';
    if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: 'Failed to update run', 
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.patch('/api/runs/:runId/cancel', async (req, res) => {
  try {
    const { runId } = req.params;
    const isAdmin = req.query.isAdmin === 'true' || req.headers['x-is-admin'] === 'true';
    
    // Extract cancellation data from request body
    const { coordinatorEmail, cancellationMessage } = req.body;

    console.log('[CANCEL] Request received for runId:', runId, 'isAdmin:', isAdmin);

    // Verify run exists
    const existingRun = await runs.getById(runId);
    if (!existingRun) {
      console.error('[CANCEL] Run not found:', runId);
      return res.status(404).json({ error: 'Run not found' });
    }

    // Verify coordinator email matches (unless admin)
    if (!isAdmin) {
      if (!coordinatorEmail || coordinatorEmail.trim().toLowerCase() !== existingRun.coordinatorEmail.toLowerCase()) {
        console.error('[CANCEL] Coordinator email does not match:', { provided: coordinatorEmail, expected: existingRun.coordinatorEmail });
        return res.status(403).json({ error: 'Coordinator email does not match' });
      }
    }

    // Check if already cancelled
    if (existingRun.status === 'cancelled') {
      console.error('[CANCEL] Event already cancelled:', runId);
      return res.status(400).json({ error: 'This event has already been cancelled.' });
    }

    // Check time-based restrictions
    const eventStartTime = new Date(existingRun.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);

    if (isAdmin) {
      // Admins can cancel up to event start time
      if (eventStartTime < now) {
        console.error('[CANCEL] Event has already started:', runId);
        return res.status(400).json({ error: 'Event cannot be cancelled after it has started.' });
      }
    } else {
      // Coordinators can cancel up to 6 hours before event start
      if (hoursUntilEvent < 6) {
        console.error('[CANCEL] Event cannot be cancelled by coordinator - within 6 hours:', { runId, hoursUntilEvent });
        return res.status(400).json({ error: 'Event cannot be cancelled within 6 hours of start time by coordinators.' });
      }
    }

    // Update event status to 'cancelled' with cancellation message and timestamp
    const cancelledAt = new Date().toISOString();
    const updateData = { 
      status: 'cancelled',
      cancelledAt: cancelledAt
    };

    if (cancellationMessage && cancellationMessage.trim()) {
      updateData.cancellationMessage = cancellationMessage.trim();
    }

    console.log('[CANCEL] Updating event status to cancelled...');
    await runs.update(runId, updateData);
    const cancelledRun = await runs.getById(runId);

    // Send cancellation emails to all signups (non-blocking)
    console.log('[CANCEL] ===== STARTING CANCELLATION EMAIL PROCESS =====');
    console.log('[CANCEL] Event ID:', runId);
    console.log('[CANCEL] Event Title:', cancelledRun.title || 'N/A');
    
    try {
      const emailService = new EmailService();
      const isEmailEnabled = emailService.isEnabled();
      // Only log boolean value, never log sensitive information
      console.log('[CANCEL] Email service enabled:', !!isEmailEnabled);
      
      if (!isEmailEnabled) {
        console.warn('[CANCEL] ⚠️ Email service is DISABLED - cancellation emails will NOT be sent');
        console.warn('[CANCEL] Check EMAIL_ENABLED environment variable');
      } else {
        console.log('[CANCEL] Email service is enabled, proceeding with email sending...');
        
        // Step 1: Get all signups
        console.log('[CANCEL] Step 1: Retrieving all signups for event...');
        const allSignups = await signups.getByRunId(runId);
        console.log(`[CANCEL] Total signups retrieved: ${allSignups.length}`);
        
        if (allSignups.length === 0) {
          console.warn('[CANCEL] ⚠️ No signups found for this event');
        } else {
          // Log signup details for debugging
          allSignups.forEach((signup, index) => {
            console.log(`[CANCEL] Signup ${index + 1}: ID=${signup.id}, Name=${signup.name || 'N/A'}, Email=${signup.email ? 'YES' : 'NO'}, EmailValue="${signup.email || 'N/A'}"`);
          });
        }
        
        // Step 2: Filter signups with email addresses
        console.log('[CANCEL] Step 2: Filtering signups with email addresses...');
        const signupsWithEmail = allSignups.filter(s => {
          const hasEmail = s.email && typeof s.email === 'string' && s.email.trim().length > 0;
          if (!hasEmail) {
            console.log(`[CANCEL] Signup ${s.id} (${s.name || 'N/A'}) excluded - no email address`);
          }
          return hasEmail;
        });
        
        console.log(`[CANCEL] Signups with email addresses: ${signupsWithEmail.length} out of ${allSignups.length}`);
        
        if (signupsWithEmail.length === 0) {
          console.warn('[CANCEL] ⚠️ No signups have email addresses - cancellation emails cannot be sent');
          console.warn('[CANCEL] This means participants will NOT receive cancellation notifications via email');
        } else {
          // Step 3: Build BCC list
          console.log('[CANCEL] Step 3: Building BCC recipient list...');
          const bccRecipients = ['info@kervinapps.com'];
          if (cancelledRun.coordinatorEmail && cancelledRun.coordinatorEmail.trim()) {
            const coordinatorEmail = cancelledRun.coordinatorEmail.trim();
            if (coordinatorEmail.includes('@')) {
              bccRecipients.push(coordinatorEmail);
              console.log(`[CANCEL] Added coordinator email to BCC: ${coordinatorEmail}`);
            } else {
              console.warn(`[CANCEL] Coordinator email invalid (no @ symbol): ${coordinatorEmail}`);
            }
          } else {
            console.warn('[CANCEL] No coordinator email found for BCC');
          }
          console.log(`[CANCEL] BCC recipients: ${bccRecipients.join(', ')}`);

          // Step 4: Send emails to each signup
          console.log('[CANCEL] Step 4: Sending cancellation emails to participants...');
          let successCount = 0;
          let failureCount = 0;
          const emailResults = [];

          const emailPromises = signupsWithEmail.map(async (signup) => {
            const signupEmail = signup.email.trim();
            console.log(`[CANCEL] Attempting to send email to signup ${signup.id} (${signup.name || 'N/A'}) at ${signupEmail}...`);
            
            try {
              const cancellationEmailContent = eventCancelledEmail(cancelledRun, signup, cancelledRun.cancellationMessage || null);
              console.log(`[CANCEL] Email content generated for signup ${signup.id}, subject: "${cancellationEmailContent.subject}"`);
              
              await emailService.sendEmail({
                to: signupEmail,
                bcc: bccRecipients,
                subject: cancellationEmailContent.subject,
                html: cancellationEmailContent.html,
                text: cancellationEmailContent.text,
                fromName: cancellationEmailContent.fromName,
              });
              
              successCount++;
              emailResults.push({ signupId: signup.id, email: signupEmail, status: 'success' });
              console.log(`[CANCEL] ✅ SUCCESS: Cancellation email sent to signup ${signup.id} (${signup.name || 'N/A'}) at ${signupEmail} with BCC to ${bccRecipients.join(', ')}`);
            } catch (signupEmailError) {
              failureCount++;
              emailResults.push({ signupId: signup.id, email: signupEmail, status: 'failed', error: signupEmailError.message });
              console.error(`[CANCEL] ❌ FAILED: Error sending email to signup ${signup.id} (${signup.name || 'N/A'}) at ${signupEmail}:`, signupEmailError.message);
              console.error(`[CANCEL] Error stack:`, signupEmailError.stack);
              // Continue with other emails even if one fails
            }
          });

          await Promise.all(emailPromises);
          
          // Step 5: Summary
          console.log('[CANCEL] ===== EMAIL SENDING SUMMARY =====');
          console.log(`[CANCEL] Total signups: ${allSignups.length}`);
          console.log(`[CANCEL] Signups with email: ${signupsWithEmail.length}`);
          console.log(`[CANCEL] Emails sent successfully: ${successCount}`);
          console.log(`[CANCEL] Emails failed: ${failureCount}`);
          
          if (failureCount > 0) {
            console.error(`[CANCEL] ⚠️ WARNING: ${failureCount} email(s) failed to send. Check logs above for details.`);
            emailResults.filter(r => r.status === 'failed').forEach(result => {
              console.error(`[CANCEL] Failed: Signup ${result.signupId} at ${result.email} - ${result.error}`);
            });
          }
          
          if (successCount === 0 && signupsWithEmail.length > 0) {
            console.error(`[CANCEL] ❌ CRITICAL: All ${signupsWithEmail.length} email(s) failed to send!`);
          } else if (successCount > 0) {
            console.log(`[CANCEL] ✅ Successfully sent ${successCount} cancellation email(s) with BCC copies`);
          }
        }
      }
    } catch (emailError) {
      console.error('[CANCEL] ❌ CRITICAL ERROR in email sending process:', emailError.message);
      console.error('[CANCEL] Error stack:', emailError.stack);
      // Don't fail the cancellation if email fails, but log the error clearly
    }
    
    console.log('[CANCEL] ===== CANCELLATION EMAIL PROCESS COMPLETE =====');

    console.log('[CANCEL] Success! Event cancelled:', runId);
    res.json({ success: true, run: cancelledRun });
  } catch (error) {
    console.error('[CANCEL] Error cancelling run:', error);
    res.status(500).json({ error: 'Failed to cancel run', message: error.message });
  }
});

app.delete('/api/runs/:runId', async (req, res) => {
  try {
    const { runId } = req.params;

    // Verify run exists
    const run = await runs.getById(runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Soft delete by setting status to 'deleted'
    // Foreign key constraints will handle cascading deletes of signups and waivers
    await runs.delete(runId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting run:', error);
    res.status(500).json({ error: 'Failed to delete run', message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('[HEALTH CHECK] Request received');
  res.json({ 
    status: 'ok', 
    environment: process.env.NETLIFY === 'true' ? 'netlify' : 'local',
    timestamp: new Date().toISOString()
  });
});

// API 404 handler - catches unmatched API routes before static middleware
app.use('/api', (req, res) => {
  console.log('[API 404] Route not found:', req.path);
  res.status(404).json({ error: 'API endpoint not found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

