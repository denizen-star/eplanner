const { runs, signups } = require('../../lib/databaseClient');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { success: true });
  }

  // Extract runId from path: /api/runs/:runId/signups(/:signupId)
  const pathParts = event.path.split('/').filter(p => p);
  const runIdIndex = pathParts.indexOf('runs');
  const runId = runIdIndex >= 0 && pathParts[runIdIndex + 1] ? pathParts[runIdIndex + 1] : null;
  const signupsIndex = pathParts.indexOf('signups');
  const signupId = signupsIndex >= 0 && pathParts[signupsIndex + 1] ? pathParts[signupsIndex + 1] : null;
  
  console.log('[RUNS SIGNUPS] Handler invoked for runId:', runId, 'signupId:', signupId, 'path:', event.path, 'method:', event.httpMethod);
  
  if (!runId) {
    console.error('[RUNS SIGNUPS] No runId provided');
    return jsonResponse(400, { error: 'Run ID is required', signups: [] });
  }

  try {
    if (event.httpMethod === 'GET') {
      // Read signups from PlanetScale database
      console.log('[RUNS SIGNUPS] Reading signups from database...');
      const runSignups = await signups.getByRunId(runId);
      
      console.log('[RUNS SIGNUPS] Success! Returning', runSignups.length, 'signups');
      return jsonResponse(200, { signups: runSignups });
    }

    if (event.httpMethod === 'DELETE') {
      const signupIdInt = parseInt(String(signupId), 10);
      if (!signupId || isNaN(signupIdInt) || signupIdInt < 0) {
        return jsonResponse(400, { error: 'Invalid signup ID' });
      }

      // Verify run exists
      const run = await runs.getById(runId);
      if (!run) {
        return jsonResponse(404, { error: 'Run not found' });
      }

      // Verify signup exists and belongs to run
      const signup = await signups.getById(signupIdInt);
      if (!signup || signup.runId !== runId) {
        return jsonResponse(404, { error: 'Signup not found' });
      }

      await signups.delete(signupIdInt);
      const remaining = await signups.getByRunId(runId);
      return jsonResponse(200, { success: true, signups: remaining });
    }

    return jsonResponse(405, { error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[RUNS SIGNUPS] ERROR:', error);
    console.error('[RUNS SIGNUPS] Error stack:', error.stack);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error.message,
      signups: []
    });
  }
};

