const { signups } = require('../../lib/databaseClient');

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
  // Extract runId from path: /api/runs/:runId/signups
  const pathParts = event.path.split('/').filter(p => p);
  const runIdIndex = pathParts.indexOf('runs');
  const runId = runIdIndex >= 0 && pathParts[runIdIndex + 1] ? pathParts[runIdIndex + 1] : null;
  
  console.log('[RUNS SIGNUPS] Handler invoked for runId:', runId, 'path:', event.path);
  
  if (!runId) {
    console.error('[RUNS SIGNUPS] No runId provided');
    return jsonResponse(400, { error: 'Run ID is required', signups: [] });
  }

  try {
    // Read signups from PlanetScale database
    console.log('[RUNS SIGNUPS] Reading signups from database...');
    const runSignups = await signups.getByRunId(runId);
    
    console.log('[RUNS SIGNUPS] Success! Returning', runSignups.length, 'signups');
    return jsonResponse(200, { signups: runSignups });
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

