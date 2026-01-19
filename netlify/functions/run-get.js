const { runs, signups } = require('../../lib/databaseClient');
const serverless = require('serverless-http');
const path = require('path');

// Explicitly require express at top level so esbuild bundles it
// This ensures express is available when server.js is required
const express = require('express');

// Set Netlify flag before requiring server
process.env.NETLIFY = 'true';

// Initialize serverless handler for PUT/PATCH delegation
let updateHandler = null;
let updateHandlerError = null;
try {
  const app = require(path.join(__dirname, '../../server'));
  updateHandler = serverless(app, {
    binary: ['image/*', 'application/pdf']
  });
  console.log('[RUN GET] Update handler initialized successfully');
} catch (error) {
  console.error('[RUN GET] Error initializing update handler:', error);
  updateHandlerError = error;
}

function getUpdateHandler() {
  if (updateHandlerError) {
    throw updateHandlerError;
  }
  if (!updateHandler) {
    throw new Error('Update handler not initialized');
  }
  return updateHandler;
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

exports.handler = async (event, context) => {
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { success: true });
  }
  
  // Extract runId from path: /api/runs/:runId
  const pathParts = event.path.split('/').filter(p => p);
  const runIdIndex = pathParts.indexOf('runs');
  const runId = runIdIndex >= 0 && pathParts[runIdIndex + 1] ? pathParts[runIdIndex + 1] : null;
  
  console.log('[RUN GET] Handler invoked for runId:', runId, 'path:', event.path, 'method:', event.httpMethod);
  
  // If method is PUT or PATCH, delegate to server.js wrapper (handles updates)
  if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
    try {
      console.log('[RUN GET] Delegating PUT/PATCH to server.js wrapper');
      const handler = getUpdateHandler();
      const result = await handler(event, context);
      console.log('[RUN GET] Delegation completed:', {
        statusCode: result?.statusCode,
        hasBody: !!result?.body,
        headers: result?.headers
      });
      
      // Ensure proper headers for CORS
      if (result && result.headers) {
        result.headers['Access-Control-Allow-Origin'] = '*';
      } else if (result) {
        result.headers = {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        };
      }
      
      return result;
    } catch (error) {
      console.error('[RUN GET] Error delegating PUT/PATCH:', error);
      console.error('[RUN GET] Error stack:', error.stack);
      console.error('[RUN GET] Error details:', {
        message: error.message,
        name: error.name,
        code: error.code
      });
      
      // Try to parse error response if it's a serverless-http error
      let errorMessage = error.message || 'Failed to process update request';
      let statusCode = 500;
      
      // Check if error has a statusCode (from serverless-http)
      if (error.statusCode) {
        statusCode = error.statusCode;
      }
      
      // Try to parse error body if it exists
      if (error.body) {
        try {
          const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
          errorMessage = errorBody.error || errorBody.message || errorMessage;
          if (errorBody.message) {
            errorMessage = errorBody.message;
          }
        } catch (parseError) {
          // If we can't parse, use the original message
        }
      }
      
      console.error('[RUN GET] Returning error response:', {
        statusCode,
        errorMessage
      });
      
      return jsonResponse(statusCode, {
        error: 'Failed to process update request',
        message: errorMessage
      });
    }
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

