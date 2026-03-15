/**
 * Single source of truth: hostname -> tenant identity.
 * Used by Netlify functions, local server, and frontend (via API or shared logic).
 */

function normalizeHostname(host) {
  if (!host || typeof host !== 'string') return '';
  const h = host.toLowerCase().split(':')[0].trim();
  return h.replace(/^www\./, '');
}

/**
 * @param {string} host - Host header (e.g. "mia.lgbtq-hub.com", "mywedding.eplanner.kervinapps.com")
 * @returns {{ product: string, subdomain: string, tenantKey: string, appName: string }}
 */
function getTenantFromHost(host) {
  const hostname = normalizeHostname(host);
  if (!hostname) {
    return { product: 'eplanner', subdomain: 'default', tenantKey: 'eplanner:default', appName: 'eplanner' };
  }

  if (hostname === 'to.lgbtq-hub.com' || hostname === 'www.to.lgbtq-hub.com' || hostname.includes('to-lgbtq.kervinapps.com')) {
    return { product: 'lgbtq-hub', subdomain: 'to', tenantKey: 'lgbtq-hub:to', appName: 'to-lgbtq' };
  }

  const lgbtqMatch = hostname.match(/^([^.]+)\.lgbtq-hub\.com$/);
  if (lgbtqMatch) {
    const sub = lgbtqMatch[1];
    return { product: 'lgbtq-hub', subdomain: sub, tenantKey: `lgbtq-hub:${sub}`, appName: 'to-lgbtq' };
  }

  const eplannerMatch = hostname.match(/^([^.]+)\.eplanner\.kervinapps\.com$/);
  if (eplannerMatch) {
    const sub = eplannerMatch[1];
    return { product: 'eplanner', subdomain: sub, tenantKey: `eplanner:${sub}`, appName: 'eplanner' };
  }

  if (hostname === 'eplanner.kervinapps.com' || hostname.includes('eplanner') || hostname.includes('eventplan')) {
    return { product: 'eplanner', subdomain: 'default', tenantKey: 'eplanner:default', appName: 'eplanner' };
  }

  return { product: 'eplanner', subdomain: 'default', tenantKey: 'eplanner:default', appName: process.env.APP_NAME || 'eplanner' };
}

function getProductDefaults(product) {
  const e = {
    titleBrand: 'Event Planner',
    favicon: 'assets/images/favicon.svg',
    logoText: 'Event Planner',
    logoIconText: 'EP',
    logoIconImage: null,
    heroHeadline: null,
    // Default map center: Miami (eplanner base)
    defaultMapCenter: [25.7617, -80.1918],
    // showCtas: true keeps the hero CTA group visible; null URLs leave button hrefs as-is in the HTML
    hero: { showCtas: true, findGroupUrl: null, learnMoreUrl: null, learnMoreText: null },
  };
  const l = {
    titleBrand: 'LGBTQ+ Activity Planner',
    favicon: 'assets/images/to-logbtqicon.png',
    logoText: 'LGBTQ+ Activity Planner',
    logoIconText: null,
    logoIconImage: 'assets/images/to-logbtqicon.png',
    heroHeadline: 'Start your own revolution. Meet new friends & adventure accomplices',
    // Default map center: Toronto (lgbtq-hub base)
    defaultMapCenter: [43.6532, -79.3832],
    // Primary CTA goes to calendar; secondary to community page
    hero: { showCtas: true, findGroupUrl: 'calendar.html', learnMoreUrl: 'community.html', learnMoreText: 'Explore Our Community' },
  };
  return product === 'lgbtq-hub' ? l : e;
}

function mergeConfig(defaults, overrides) {
  if (!overrides || typeof overrides !== 'object') return { ...defaults };
  const hero = { ...defaults.hero, ...(overrides.hero || {}) };
  const heroSections = { ...(defaults.heroSections || {}), ...(overrides.heroSections || {}) };
  return { ...defaults, ...overrides, hero, heroSections };
}

/**
 * Default From address for tenants that have no sender_email override.
 * to.lgbtq-hub.com / to-lgbtq.kervinapps.com (lgbtq-hub:to) -> info@lgbtq-hub.com.
 */
function getDefaultSenderEmail(tenantKey) {
  if (tenantKey === 'lgbtq-hub:to') return 'info@lgbtq-hub.com';
  return null;
}

/**
 * From address for weekly newsletter emails by app/tenant.
 * eplanner -> info@kervinapps.com; to-lgbtq, toronto.lgbtq, etc. (lgbtq-hub) -> info@lgbtq-hub.com.
 */
function getNewsletterSenderEmail(appName, tenantKey) {
  if (appName === 'eplanner') return 'info@kervinapps.com';
  if (appName === 'to-lgbtq' || (tenantKey && String(tenantKey).startsWith('lgbtq-hub:'))) return 'info@lgbtq-hub.com';
  return getDefaultSenderEmail(tenantKey || null) || null;
}

module.exports = { normalizeHostname, getTenantFromHost, getProductDefaults, mergeConfig, getDefaultSenderEmail, getNewsletterSenderEmail };
