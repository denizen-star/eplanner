const { runs } = require('../../lib/databaseClient');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  console.log('[RUNS COMPLETE] Handler invoked');
  
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { success: true });
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    // Get all active runs
    console.log('[RUNS COMPLETE] Fetching active runs...');
    const allRuns = await runs.getAll();
    
    // Filter to only active runs
    const activeRuns = allRuns.filter(run => run.status === 'active');
    console.log('[RUNS COMPLETE] Found', activeRuns.length, 'active runs');
    
    // Calculate 4 hours ago
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
    
    // Find runs that are more than 4 hours past their scheduled time
    const runsToComplete = activeRuns.filter(run => {
      const runDateTime = new Date(run.dateTime);
      return runDateTime < fourHoursAgo;
    });
    
    console.log('[RUNS COMPLETE] Found', runsToComplete.length, 'runs to complete');
    
    // Update each run to completed status
    let completedCount = 0;
    for (const run of runsToComplete) {
      try {
        await runs.update(run.id, { status: 'completed' });
        completedCount++;
        console.log('[RUNS COMPLETE] Marked run', run.id, 'as completed');
      } catch (error) {
        console.error('[RUNS COMPLETE] Error updating run', run.id, ':', error.message);
      }
    }
    
    console.log('[RUNS COMPLETE] Success! Completed', completedCount, 'runs');
    return jsonResponse(200, {
      success: true,
      completed: completedCount,
      totalChecked: activeRuns.length,
      message: `Successfully completed ${completedCount} run(s)`
    });
  } catch (error) {
    console.error('[RUNS COMPLETE] ERROR:', error);
    console.error('[RUNS COMPLETE] Error stack:', error.stack);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to complete runs',
      message: error.message
    });
  }
};

