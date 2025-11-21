// Test endpoint to debug Google Sheets read functionality
const { readFromGoogleSheets } = require('../../lib/googleSheetsClient');

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
  console.log('[TEST SHEETS READ] Handler invoked');
  console.log('[TEST SHEETS READ] Event:', JSON.stringify(event, null, 2));
  
  const action = event.queryStringParameters?.action || 'getRuns';
  const runId = event.queryStringParameters?.runId || null;
  
  console.log('[TEST SHEETS READ] Action:', action);
  console.log('[TEST SHEETS READ] RunId:', runId);
  
  try {
    const params = { action };
    if (runId) {
      params.runId = runId;
    }
    
    console.log('[TEST SHEETS READ] Calling readFromGoogleSheets with params:', params);
    
    const result = await readFromGoogleSheets(params);
    
    console.log('[TEST SHEETS READ] Result received:', JSON.stringify(result, null, 2));
    
    return jsonResponse(200, {
      success: true,
      message: 'Test completed successfully',
      params: params,
      result: result,
      endpoint: process.env.GOOGLE_APPS_SCRIPT_URL || process.env.GS_DATA_PIPELINE_URL || 'NOT SET'
    });
  } catch (error) {
    console.error('[TEST SHEETS READ] ERROR:', error);
    console.error('[TEST SHEETS READ] Error stack:', error.stack);
    console.error('[TEST SHEETS READ] Error message:', error.message);
    
    return jsonResponse(500, {
      success: false,
      error: error.message,
      stack: error.stack,
      params: { action, runId },
      endpoint: process.env.GOOGLE_APPS_SCRIPT_URL || process.env.GS_DATA_PIPELINE_URL || 'NOT SET'
    });
  }
};

