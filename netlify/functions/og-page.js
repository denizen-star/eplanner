/**
 * Serves event.html and signup.html with injected Open Graph meta so crawlers
 * (WhatsApp, Facebook, Twitter, etc.) see the correct link preview image and title.
 * Only runs when ?id= is present; otherwise redirects are not used and static HTML is served.
 */
const { runs } = require('../../lib/databaseClient');

function htmlResponse(statusCode, html) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
    body: html,
  };
}

function getOrigin(event) {
  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const proto = event.headers['x-forwarded-proto'] || (event.headers['x-nf-url'] ? new URL(event.headers['x-nf-url']).protocol.replace(':', '') : 'https');
  return `${proto}://${host}`;
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildEventMeta(run, runId, origin) {
  const titleDisplay = run.title && typeof run.title === 'string' && run.title.trim() ? run.title.trim() : '';
  const plannerName = run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim() ? run.pacerName.trim() : '';
  let title = 'Event - Event Planner';
  if (titleDisplay && plannerName) title = `${titleDisplay} - ${plannerName} - Event Planner`;
  else if (titleDisplay) title = `${titleDisplay} - Event Planner`;
  else if (plannerName) title = `Event with ${plannerName} - Event Planner`;

  const description = 'Community event management - find and coordinate events.';
  const ogImageUrl = run.picture && typeof run.picture === 'string' && run.picture.trim()
    ? `${origin}/api/event-image/${runId}`
    : `${origin}/assets/images/og-default.jpeg`;

  return { title, description, ogImageUrl };
}

function buildSignupMeta(run, runId, origin) {
  const runTitleDisplay = run.title && typeof run.title === 'string' && run.title.trim() ? run.title.trim() : '';
  const pacerName = run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim() ? run.pacerName.trim() : '';
  let title = 'Sign Up for Run - Gay Run Club';
  if (runTitleDisplay) title = `${runTitleDisplay} - Gay Run Club`;
  else if (pacerName) title = `Run with ${pacerName} - Gay Run Club`;

  const date = new Date(run.dateTime);
  const formattedDate = date.toLocaleString('en-US', {
    timeZone: run.timezone || 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  let description = 'Join us for a run!';
  if (run.location) description += ` Location: ${run.location}`;
  if (formattedDate) description += ` | Date: ${formattedDate}`;
  if (pacerName) description += ` | Pacer: ${pacerName}`;

  const ogImageUrl = run.picture && typeof run.picture === 'string' && run.picture.trim()
    ? `${origin}/api/event-image/${runId}`
    : `${origin}/assets/images/og-default.jpeg`;

  return { title, description, ogImageUrl };
}

function injectMeta(html, meta, pageUrl) {
  const { title, description, ogImageUrl } = meta;
  let out = html;
  out = out.replace(/<meta property="og:image" content="[^"]*" id="og-image">/, `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" id="og-image">`);
  out = out.replace(/<meta name="twitter:image" content="[^"]*" id="twitter-image">/, `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" id="twitter-image">`);
  out = out.replace(/<meta property="og:url" content="[^"]*" id="og-url">/, `<meta property="og:url" content="${escapeHtml(pageUrl)}" id="og-url">`);
  out = out.replace(/<meta property="og:title" content="[^"]*" id="og-title">/, `<meta property="og:title" content="${escapeHtml(title)}" id="og-title">`);
  out = out.replace(/<meta property="og:description" content="[^"]*" id="og-description">/, `<meta property="og:description" content="${escapeHtml(description)}" id="og-description">`);
  out = out.replace(/<meta name="twitter:title" content="[^"]*" id="twitter-title">/, `<meta name="twitter:title" content="${escapeHtml(title)}" id="twitter-title">`);
  out = out.replace(/<meta name="twitter:description" content="[^"]*" id="twitter-description">/, `<meta name="twitter:description" content="${escapeHtml(description)}" id="twitter-description">`);
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const path = (event.path || '').split('?')[0];
  const isEvent = path === '/event.html' || path === '/event';
  const isSignup = path === '/signup.html' || path === '/signup';
  if (!isEvent && !isSignup) {
    return { statusCode: 404, body: 'Not Found' };
  }

  const runId = event.queryStringParameters?.id || event.multiValueQueryStringParameters?.id?.[0];
  if (!runId) {
    return { statusCode: 404, body: 'Not Found' };
  }

  const origin = getOrigin(event);
  const pageUrl = `${origin}${path}?id=${encodeURIComponent(runId)}`;
  const staticPath = isEvent ? '/event.html' : '/signup.html';

  try {
    const run = await runs.getById(runId);
    if (!run) {
      return { statusCode: 404, body: 'Event not found' };
    }

    const res = await fetch(`${origin}${staticPath}`);
    if (!res.ok) {
      return { statusCode: 502, body: 'Failed to load page' };
    }
    let html = await res.text();

    const meta = isEvent
      ? buildEventMeta(run, runId, origin)
      : buildSignupMeta(run, runId, origin);
    html = injectMeta(html, meta, pageUrl);

    return htmlResponse(200, html);
  } catch (err) {
    console.error('[OG-PAGE] Error:', err);
    return { statusCode: 500, body: 'Server error' };
  }
};
