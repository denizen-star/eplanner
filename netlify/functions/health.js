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
  console.log('[HEALTH CHECK] Handler invoked');
  return jsonResponse(200, {
    status: 'ok',
    environment: 'netlify',
    timestamp: new Date().toISOString(),
    hasGSDataPipelineURL: !!process.env.GS_DATA_PIPELINE_URL
  });
};

