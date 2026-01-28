const { runs } = require('../../lib/databaseClient');
const { jsonResponse, getTenant } = require('./utils');

// Helper function to get start and end of week for a given date
function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday = 0, so subtract to get Sunday
  const startDate = new Date(d.setDate(diff));
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Add 6 days to get Saturday
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

exports.handler = async (event) => {
  console.log('[RUNS PUBLIC CALENDAR] Handler invoked');
  console.log('[RUNS PUBLIC CALENDAR] HTTP Method:', event.httpMethod);
  console.log('[RUNS PUBLIC CALENDAR] Query params:', event.queryStringParameters);
  
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { success: true });
  }

  if (event.httpMethod !== 'GET') {
    console.error('[RUNS PUBLIC CALENDAR] Invalid method:', event.httpMethod);
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    let startDate, endDate;

    if (queryParams.startDate && queryParams.endDate) {
      // Use provided date range
      startDate = new Date(queryParams.startDate);
      endDate = new Date(queryParams.endDate);
    } else {
      // Default to current week
      const weekRange = getWeekRange();
      startDate = weekRange.startDate;
      endDate = weekRange.endDate;
    }

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('[RUNS PUBLIC CALENDAR] Invalid date format:', {
        startDate: queryParams.startDate,
        endDate: queryParams.endDate
      });
      return jsonResponse(400, { 
        success: false, 
        error: 'Invalid date format. Use YYYY-MM-DD format.' 
      });
    }

    const { tenantKey, appName } = getTenant(event);
    console.log('[RUNS PUBLIC CALENDAR] Detected tenant:', tenantKey, 'appName:', appName);

    console.log('[RUNS PUBLIC CALENDAR] Fetching public events:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      tenantKey,
      appName
    });

    const events = await runs.getPublicEvents(startDate.toISOString(), endDate.toISOString(), appName, tenantKey);

    console.log('[RUNS PUBLIC CALENDAR] Success! Returning', events.length, 'events');

    return jsonResponse(200, {
      success: true,
      events: events,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  } catch (error) {
    console.error('[RUNS PUBLIC CALENDAR] ERROR:', error);
    console.error('[RUNS PUBLIC CALENDAR] Error stack:', error.stack);
    console.error('[RUNS PUBLIC CALENDAR] Error message:', error.message);
    return jsonResponse(500, {
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
