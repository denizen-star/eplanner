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
  
  // Get HTTP method
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
  
  console.log('[RUN HANDLER] Handler invoked for runId:', runId, 'method:', httpMethod, 'path:', event.path);
  
  if (!runId) {
    console.error('[RUN HANDLER] No runId provided');
    return jsonResponse(400, { error: 'Run ID is required' });
  }

  try {
    // Handle DELETE request
    if (httpMethod === 'DELETE') {
      console.log('[RUN HANDLER] Deleting run:', runId);
      const run = await runs.getById(runId);
      
      if (!run) {
        console.log('[RUN HANDLER] Run not found for deletion:', runId);
        return jsonResponse(404, { error: 'Run not found' });
      }

      await runs.delete(runId);
      console.log('[RUN HANDLER] Run deleted successfully');
      return jsonResponse(200, { success: true, message: 'Run deleted successfully' });
    }

    // Handle PUT request (update)
    if (httpMethod === 'PUT') {
      console.log('[RUN HANDLER] Updating run:', runId);
      
      let updateData;
      try {
        updateData = JSON.parse(event.body || '{}');
      } catch (parseError) {
        console.error('[RUN HANDLER] Failed to parse request body:', parseError);
        return jsonResponse(400, { error: 'Invalid JSON in request body' });
      }

      // Check if run exists
      const existingRun = await runs.getById(runId);
      if (!existingRun) {
        console.log('[RUN HANDLER] Run not found for update:', runId);
        return jsonResponse(404, { error: 'Run not found' });
      }

      // Map frontend field names to database field names
      // Support both plannerName and pacerName for backward compatibility
      const updates = {};
      if (updateData.title !== undefined) updates.title = updateData.title;
      if (updateData.location !== undefined) updates.location = updateData.location;
      if (updateData.plannerName !== undefined) updates.plannerName = updateData.plannerName;
      if (updateData.pacerName !== undefined) updates.plannerName = updateData.pacerName;
      if (updateData.dateTime !== undefined) updates.dateTime = updateData.dateTime;
      if (updateData.maxParticipants !== undefined) updates.maxParticipants = updateData.maxParticipants;
      if (updateData.description !== undefined) updates.description = updateData.description;
      if (updateData.picture !== undefined) updates.picture = updateData.picture;
      if (updateData.coordinates !== undefined) updates.coordinates = updateData.coordinates;

      const updatedRun = await runs.update(runId, updates);
      
      // Also get signups for this run
      try {
        const runSignups = await signups.getByRunId(runId);
        updatedRun.signups = runSignups || [];
      } catch (signupsError) {
        console.warn('[RUN HANDLER] Failed to load signups:', signupsError.message);
        updatedRun.signups = [];
      }

      console.log('[RUN HANDLER] Run updated successfully');
      return jsonResponse(200, updatedRun);
    }

    // Handle GET request (default)
    console.log('[RUN HANDLER] Reading run from database...');
    const run = await runs.getById(runId);
    
    if (!run) {
      console.log('[RUN HANDLER] Run not found:', runId);
      return jsonResponse(404, { error: 'Run not found' });
    }

    // Also get signups for this run
    try {
      console.log('[RUN HANDLER] Reading signups for run...');
      const runSignups = await signups.getByRunId(runId);
      run.signups = runSignups || [];
    } catch (signupsError) {
      console.warn('[RUN HANDLER] Failed to load signups:', signupsError.message);
      run.signups = [];
    }

    console.log('[RUN HANDLER] Success! Returning run data');
    return jsonResponse(200, run);
  } catch (error) {
    console.error('[RUN HANDLER] ERROR:', error);
    console.error('[RUN HANDLER] Error stack:', error.stack);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error.message
    });
  }
};

