const serverless = require('serverless-http');
const path = require('path');

// Set Netlify flag before requiring server
process.env.NETLIFY = 'true';

console.log('[NETLIFY FUNCTION] Initializing server...');
console.log('[NETLIFY FUNCTION] Environment variables:', {
  hasGSDataPipelineURL: !!process.env.GS_DATA_PIPELINE_URL,
  nodeVersion: process.version
});

// Import the Express app
let app;
try {
  app = require(path.join(__dirname, '../../server'));
  console.log('[NETLIFY FUNCTION] Server loaded successfully');
} catch (error) {
  console.error('[NETLIFY FUNCTION] Error loading server:', error);
  throw error;
}

// Configure serverless-http
let handler;
try {
  handler = serverless(app, {
    binary: ['image/*', 'application/pdf']
  });
  console.log('[NETLIFY FUNCTION] Handler created successfully');
} catch (error) {
  console.error('[NETLIFY FUNCTION] Error creating handler:', error);
  throw error;
}

exports.handler = async (event, context) => {
  console.log('[NETLIFY FUNCTION] Handler invoked:', {
    path: event.path,
    method: event.httpMethod,
    hasBody: !!event.body
  });
  
  try {
    const result = await handler(event, context);
    console.log('[NETLIFY FUNCTION] Handler completed:', {
      statusCode: result.statusCode
    });
    return result;
  } catch (error) {
    console.error('[NETLIFY FUNCTION] Handler error:', error);
    console.error('[NETLIFY FUNCTION] Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

