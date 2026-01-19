const { runs, signups } = require('../../lib/databaseClient');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  // Extract runId from path: /api/runs/:runId
  const pathParts = event.path.split('/').filter(p => p);
  const runIdIndex = pathParts.indexOf('runs');
  const runId = runIdIndex >= 0 && pathParts[runIdIndex + 1] ? pathParts[runIdIndex + 1] : null;
  
  console.log('[RUN GET] Handler invoked for runId:', runId, 'path:', event.path, 'method:', event.httpMethod);
  
  // If method is PUT or PATCH, delegate to server.js wrapper (handles updates)
  if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
    const serverless = require('serverless-http');
    const path = require('path');
    process.env.NETLIFY = 'true';
    
    const app = require(path.join(__dirname, '../../server'));
    const handler = serverless(app, {
      binary: ['image/*', 'application/pdf']
    });
    
    console.log('[RUN GET] Delegating PUT/PATCH to server.js wrapper');
    return await handler(event);
  }
  
  // Handle GET requests only
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method Not Allowed. Use PUT for updates.' });
  }
  
  if (!runId) {
    console.error('[RUN GET] No runId provided');
    return jsonResponse(400, { error: 'Run ID is required' });
  }

  try {
    // Read run from PlanetScale database
    console.log('[RUN GET] Reading run from database...');
    const run = await runs.getById(runId);
    
    if (!run) {
      console.log('[RUN GET] Run not found:', runId);
      return jsonResponse(404, { error: 'Run not found' });
    }

    // Also get signups for this run
    try {
      console.log('[RUN GET] Reading signups for run...');
      const runSignups = await signups.getByRunId(runId);
      run.signups = runSignups || [];
    } catch (signupsError) {
      console.warn('[RUN GET] Failed to load signups:', signupsError.message);
      run.signups = [];
    }

    console.log('[RUN GET] Success! Returning run data');
    return jsonResponse(200, run);
  } catch (error) {
    console.error('[RUN GET] ERROR:', error);
    console.error('[RUN GET] Error stack:', error.stack);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error.message
    });
  }
};

