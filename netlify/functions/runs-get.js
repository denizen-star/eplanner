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
  console.log('[RUNS GET] Handler invoked');
  
  try {
    // Read all runs from PlanetScale database
    console.log('[RUNS GET] Reading all runs from database...');
    const allRuns = await runs.getAll();
    
    // Load signups for each run
    console.log('[RUNS GET] Loading signups for', allRuns.length, 'runs...');
    const runsWithSignups = await Promise.all(
      allRuns.map(async (run) => {
        try {
          const runSignups = await signups.getByRunId(run.id);
          return {
            ...run,
            signups: runSignups || []
          };
        } catch (signupError) {
          console.warn('[RUNS GET] Failed to load signups for run', run.id, ':', signupError.message);
          return {
            ...run,
            signups: []
          };
        }
      })
    );
    
    console.log('[RUNS GET] Success! Returning', runsWithSignups.length, 'runs with signups');
    return jsonResponse(200, { runs: runsWithSignups });
  } catch (error) {
    console.error('[RUNS GET] ERROR:', error);
    console.error('[RUNS GET] Error stack:', error.stack);
    console.error('[RUNS GET] Error message:', error.message);
    
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error.message,
      runs: []
    });
  }
};

