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

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/Fea7OmKCL338wVUsWEajzr';

function getProductDefaults(product) {
  const e = {
    titleBrand: 'Event Planner',
    favicon: 'assets/images/favicon.svg',
    logoText: 'Event Planner',
    logoIconText: 'EP',
    logoIconImage: null,
    heroHeadline: null,
    hero: { showCtas: false, findGroupUrl: null, learnMoreUrl: null, learnMoreText: null },
  };
  const l = {
    titleBrand: 'LGBTQ+ Activity Planner',
    favicon: 'assets/images/to-logbtqicon.png',
    logoText: 'LGBTQ+ Activity Planner',
    logoIconText: null,
    logoIconImage: 'assets/images/to-logbtqicon.png',
    heroHeadline: 'Start your own revolution. Meet new friends & adventure accomplices',
    hero: { showCtas: true, findGroupUrl: WHATSAPP_GROUP_LINK, learnMoreUrl: 'whatsapp-community.html', learnMoreText: 'Explore Our Community' },
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

module.exports = { normalizeHostname, getTenantFromHost, getProductDefaults, mergeConfig, getDefaultSenderEmail, WHATSAPP_GROUP_LINK };
