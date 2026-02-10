/**
 * Event digest service: fetch upcoming events for a date range (e.g. next 7 days).
 * Used by the weekly newsletter. DRY: delegates to runs.getPublicEvents.
 */

const { runs } = require('./databaseClient');

/**
 * Get upcoming public events for the next N days (from today).
 * @param {string} appName
 * @param {string|null} tenantKey
 * @param {number} days - Number of days ahead (default 7)
 * @returns {Promise<Array>} Events in same shape as runs.getPublicEvents
 */
async function getUpcomingEventsForDays(appName, tenantKey, days = 7) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);
  return runs.getPublicEvents(start.toISOString(), end.toISOString(), appName, tenantKey);
}

module.exports = { getUpcomingEventsForDays };
