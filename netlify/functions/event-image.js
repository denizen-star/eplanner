const { runs } = require('../../lib/databaseClient');

function imageResponse(statusCode, imageData, contentType = 'image/jpeg') {
  return {
    statusCode,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
    body: imageData,
    isBase64Encoded: true,
  };
}

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
  console.log('[EVENT IMAGE] Handler invoked');
  
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { success: true });
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    // Extract runId from path: /api/event-image/:runId
    const pathParts = event.path.split('/').filter(p => p);
    const runIdIndex = pathParts.indexOf('event-image');
    const runId = runIdIndex >= 0 && pathParts[runIdIndex + 1] ? pathParts[runIdIndex + 1] : null;
    
    if (!runId) {
      console.error('[EVENT IMAGE] Run ID not found in path');
      return jsonResponse(400, { success: false, error: 'Run ID is required' });
    }

    console.log('[EVENT IMAGE] Fetching event:', runId);
    
    // Get event from database
    const run = await runs.getById(runId);
    
    if (!run) {
      console.error('[EVENT IMAGE] Event not found:', runId);
      return jsonResponse(404, { success: false, error: 'Event not found' });
    }

    // Check if event has a picture
    if (!run.picture || typeof run.picture !== 'string' || !run.picture.trim()) {
      console.log('[EVENT IMAGE] Event has no picture, returning 404');
      return jsonResponse(404, { success: false, error: 'Event has no picture' });
    }

    // Return the base64 image data
    // The picture is stored as base64 string (without data URI prefix)
    const base64Data = run.picture.trim();
    
    console.log('[EVENT IMAGE] Returning image for event:', runId);
    return imageResponse(200, base64Data, 'image/jpeg');
    
  } catch (error) {
    console.error('[EVENT IMAGE] ERROR:', error);
    console.error('[EVENT IMAGE] Error stack:', error.stack);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to retrieve event image',
      message: error.message
    });
  }
};
