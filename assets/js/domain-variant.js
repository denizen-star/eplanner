/**
 * Domain Variant Configuration
 * Fetches tenant config from /api/tenant-config and applies branding (favicon, logo, title, hero CTAs).
 * Falls back to legacy isLGBTQDomain()-based behavior when the API is unavailable.
 */

(function () {
  'use strict';

  const SIGNUP_BUTTON_NEW_TEXT = 'Create your Activity';
  const LGBTQ_DOMAIN = 'to-lgbtq.kervinapps.com';
  const LGBTQ_ALIAS_DOMAIN = 'to.lgbtq-hub.com';
  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/Fea7OmKCL338wVUsWEajzr';
  const LGBTQ_FAVICON = 'assets/images/to-logbtqicon.png';
  const LGBTQ_LOGO_ICON = 'assets/images/to-logbtqicon.png';

  function isLGBTQDomain() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('lgbtq') === 'true') return true;
    const h = window.location.hostname.toLowerCase();
    return h === LGBTQ_DOMAIN || h === LGBTQ_ALIAS_DOMAIN ||
      h === 'www.' + LGBTQ_DOMAIN || h === 'www.' + LGBTQ_ALIAS_DOMAIN ||
      h.includes('to-lgbtq');
  }

  function applyFavicon(path) {
    if (!path) return;
    const existing = document.querySelectorAll('link[rel*="icon"]');
    existing.forEach(function (l) { l.remove(); });
    const sizes = [16, 32, 64];
    sizes.forEach(function (s) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = path.indexOf('.png') !== -1 ? 'image/png' : 'image/svg+xml';
      link.href = path;
      link.sizes = s + 'x' + s;
      document.head.appendChild(link);
    });
    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = path;
    apple.sizes = '180x180';
    document.head.appendChild(apple);
    const short = document.createElement('link');
    short.rel = 'shortcut icon';
    short.type = path.indexOf('.png') !== -1 ? 'image/png' : 'image/svg+xml';
    short.href = path;
    document.head.appendChild(short);
  }

  function applyLogo(config) {
    const logoIconImage = config.logoIconImage || null;
    const logoText = config.logoText || 'Event Planner';
    const logoIcons = document.querySelectorAll('.logo-icon');
    logoIcons.forEach(function (el) {
      el.style.width = '50px';
      el.style.height = '50px';
      el.style.background = 'transparent';
      el.style.backgroundColor = 'transparent';
      el.style.backgroundImage = 'none';
      el.innerHTML = '';
      if (logoIconImage) {
        const img = document.createElement('img');
        img.src = logoIconImage;
        img.alt = 'Logo';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        el.appendChild(img);
      } else {
        el.textContent = config.logoIconText || 'EP';
      }
    });
    const logoLinks = document.querySelectorAll('a.logo');
    logoLinks.forEach(function (link) {
      const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent && node.textContent.trim() === 'Event Planner') {
          node.textContent = logoText;
        }
      }
    });
  }

  function applyPageTitle(titleBrand) {
    if (!titleBrand || typeof document.title !== 'string') return;
    if (document.title.includes('Event Planner')) {
      document.title = document.title.replace(/Event Planner/g, titleBrand);
    }
  }

  function applyHeroHeadline(heroHeadline) {
    if (!heroHeadline) return;
    const el = document.querySelector('.calendar-page-hero .hero-headline');
    if (el) {
      el.textContent = heroHeadline;
      el.classList.add('hero-headline--tagline');
    }
  }

  function applyHeroButtons(config) {
    const hero = config.hero || {};
    const show = !!hero.showCtas;
    const findUrl = hero.findGroupUrl || null;
    const learnUrl = hero.learnMoreUrl || null;
    const learnText = hero.learnMoreText || null;
    const groups = document.querySelectorAll('.hero-cta-group');
    groups.forEach(function (g) {
      if (g.hasAttribute('style') && g.style.display === 'none') g.removeAttribute('style');
      g.style.display = show ? 'flex' : 'none';
    });
    const byId = document.getElementById('hero-cta-group');
    if (byId) {
      if (byId.hasAttribute('style') && byId.style.display === 'none') byId.removeAttribute('style');
      byId.style.display = show ? 'flex' : 'none';
    }
    const findBtn = document.getElementById('hero-find-group-btn');
    if (findBtn && show && findUrl) {
      findBtn.setAttribute('href', findUrl);
      findBtn.href = findUrl;
      findBtn.setAttribute('target', '_blank');
      findBtn.setAttribute('rel', 'noopener noreferrer');
      findBtn.setAttribute('title', 'Find your group in WhatsApp');
      if (!findBtn.querySelector('img')) {
        const img = document.createElement('img');
        img.src = 'assets/images/wAppII.png';
        img.alt = 'WhatsApp';
        img.style.width = '22px';
        img.style.height = '22px';
        img.style.verticalAlign = 'middle';
        img.style.marginRight = '8px';
        img.style.display = 'inline-block';
        findBtn.innerHTML = '';
        findBtn.appendChild(img);
        findBtn.appendChild(document.createTextNode(' - Find your group'));
      }
      findBtn.href = findUrl;
      findBtn.setAttribute('href', findUrl);
    }
    const learnBtn = document.querySelector('a[data-track-cta="hero_learn_more_click"]');
    if (learnBtn && show && learnUrl) {
      learnBtn.setAttribute('href', learnUrl);
      learnBtn.href = learnUrl;
      if (learnText) learnBtn.textContent = learnText;
      learnBtn.setAttribute('title', 'Discover our WhatsApp community groups and activities');
    }
  }

  function applyBranding(config) {
    if (!config) return;
    if (config.favicon) applyFavicon(config.favicon);
    applyLogo(config);
    applyPageTitle(config.titleBrand || null);
    applyHeroHeadline(config.heroHeadline || null);
    applyHeroButtons(config);
    const signup = document.getElementById('signup-now-btn');
    if (signup) signup.textContent = SIGNUP_BUTTON_NEW_TEXT;
  }

  function legacyFavicon() {
    if (!isLGBTQDomain()) return;
    applyFavicon(LGBTQ_FAVICON);
  }

  function legacyLogo() {
    if (!isLGBTQDomain()) return;
    applyLogo({
      logoIconImage: LGBTQ_LOGO_ICON,
      logoText: 'LGBTQ+ Activity Planner',
      logoIconText: null,
    });
  }

  function legacyPageTitle() {
    if (!isLGBTQDomain()) return;
    applyPageTitle('LGBTQ+ Activity Planner');
  }

  function legacyHeroHeadline() {
    if (!isLGBTQDomain()) return;
    applyHeroHeadline('Start your own revolution. Meet new friends & adventure accomplices');
  }

  function legacyButtons() {
    const signup = document.getElementById('signup-now-btn');
    if (signup) signup.textContent = SIGNUP_BUTTON_NEW_TEXT;
    if (isLGBTQDomain()) {
      applyHeroButtons({
        hero: {
          showCtas: true,
          findGroupUrl: WHATSAPP_GROUP_LINK,
          learnMoreUrl: 'whatsapp-community.html',
          learnMoreText: 'Explore Our Community',
        },
      });
    } else {
      const g = document.getElementById('hero-cta-group');
      if (g && g.style && g.style.display === 'none') g.style.display = 'none';
    }
  }

  function runLegacy() {
    legacyFavicon();
    legacyLogo();
    legacyPageTitle();
    legacyHeroHeadline();
    legacyButtons();
  }

  function init() {
    fetch('/api/tenant-config')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (config) {
        applyBranding(config);
      })
      .catch(function () {
        runLegacy();
      });
  }

  legacyFavicon();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
