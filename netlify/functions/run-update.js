const serverless = require('serverless-http');
const path = require('path');

// Set Netlify flag before requiring server
process.env.NETLIFY = 'true';

console.log('[RUN UPDATE FUNCTION] Initializing server...');

// Import the Express app
let app;
try {
  app = require(path.join(__dirname, '../../server'));
  console.log('[RUN UPDATE FUNCTION] Server loaded successfully');
} catch (error) {
  console.error('[RUN UPDATE FUNCTION] Error loading server:', error);
  throw error;
}

// Configure serverless-http
let handler;
try {
  handler = serverless(app, {
    binary: ['image/*', 'application/pdf']
  });
  console.log('[RUN UPDATE FUNCTION] Handler created successfully');
} catch (error) {
  console.error('[RUN UPDATE FUNCTION] Error creating handler:', error);
  throw error;
}

exports.handler = async (event, context) => {
  console.log('[RUN UPDATE FUNCTION] Handler invoked:', {
    path: event.path,
    method: event.httpMethod,
    hasBody: !!event.body
  });
  
  try {
    const result = await handler(event, context);
    console.log('[RUN UPDATE FUNCTION] Handler completed:', {
      statusCode: result.statusCode
    });
    return result;
  } catch (error) {
    console.error('[RUN UPDATE FUNCTION] Handler error:', error);
    console.error('[RUN UPDATE FUNCTION] Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
