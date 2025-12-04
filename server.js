// Load environment variables from .env file (only in local development)
// Netlify Functions get env vars from dashboard, so skip dotenv in production
if (process.env.NETLIFY !== 'true') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const { runs, signups, waivers } = require('./lib/databaseClient');

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
    hasDateTime: !!req.body.dateTime,
    maxParticipants: req.body.maxParticipants,
    isNetlify: process.env.NETLIFY === 'true'
  });

  try {
    const { location, coordinates, pacerName, plannerName, title, dateTime, maxParticipants, deviceInfo, sessionInfo, picture, description } = req.body;

    // Support both plannerName (new) and pacerName (legacy) for backward compatibility
    const nameToUse = plannerName || pacerName;

    // Validate and trim all required fields
    const trimmedLocation = location ? location.trim() : '';
    const trimmedPlannerName = nameToUse ? nameToUse.trim() : '';

    console.log('[RUN CREATE] Validating fields...');
    console.log('[RUN CREATE] Field check:', {
      hasLocation: !!trimmedLocation,
      hasPlannerName: !!trimmedPlannerName,
      hasDateTime: !!dateTime,
      maxParticipants: maxParticipants,
      maxParticipantsType: typeof maxParticipants
    });
    
    // Build detailed error message showing which fields are missing
    const missingFields = [];
    if (!trimmedLocation) missingFields.push('location');
    if (!trimmedPlannerName) missingFields.push('plannerName');
    if (!dateTime) missingFields.push('dateTime');
    if (!maxParticipants) missingFields.push('maxParticipants');
    
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

    // Save to PlanetScale database
    console.log('[RUN CREATE] Saving to PlanetScale database...');
    try {
      const createData = {
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
        picture: picture || null,
        description: description || null,
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
      if (dbError.message && (dbError.message.includes('Unknown column') || dbError.message.includes('picture') || dbError.message.includes('description'))) {
        throw new Error('Database migration required: Please add picture and description columns. See migration-add-picture-description.sql file.');
      }
      throw new Error(`Failed to save event to database: ${dbError.message}`);
    }

    console.log('[RUN CREATE] Generating response URLs...');
    const baseUrl = req.protocol + '://' + req.get('host');
    const signupLink = `${baseUrl}/signup.html?id=${shortId}`;
    const manageLink = `${baseUrl}/manage.html?id=${shortId}`;

    console.log('[RUN CREATE] Success! Run created:', { shortId, signupLink, manageLink });

    res.json({
      success: true,
      run: runData,
      signupLink: signupLink,
      manageLink: manageLink
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

app.post('/api/runs/:runId/signup', async (req, res) => {
  const { runId } = req.params;
  console.log('[SIGNUP] Request received for runId:', runId);

  try {
    const { name, phone, email, instagram, waiverAccepted, deviceInfo, sessionInfo, pageUrl, referrer, waiverText } = req.body;

    console.log('[SIGNUP] Validating signup data...');
    if (!name || !phone || !waiverAccepted) {
      console.error('[SIGNUP] Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Name, phone, and waiver acceptance are required' });
    }

    // Verify run exists and check capacity
    console.log('[SIGNUP] Verifying run exists...');
    const run = await runs.getById(runId);
    
    if (!run) {
      console.error('[SIGNUP] Run not found:', runId);
      return res.status(404).json({ error: 'Run not found' });
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
        phone: phone.trim(),
        email: email ? email.trim() : '',
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
        participantPhone: phone.trim(),
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

    // Verify run exists
    const existingRun = await runs.getById(runId);
    if (!existingRun) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Prepare updates
    const updates = {};
    if (location !== undefined) updates.location = location.trim();
    if (pacerName !== undefined) updates.pacerName = pacerName ? pacerName.trim() : '';
    if (title !== undefined) updates.title = title ? title.trim() : null;
    if (dateTime !== undefined) updates.dateTime = dateTime;
    if (coordinates !== undefined) updates.coordinates = coordinates;
    if (picture !== undefined) updates.picture = picture;
    if (description !== undefined) updates.description = description;
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

    // Update in database
    const updatedRun = await runs.update(runId, updates);

    res.json({ success: true, run: updatedRun });
  } catch (error) {
    console.error('Error updating run:', error);
    res.status(500).json({ error: 'Failed to update run', message: error.message });
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

