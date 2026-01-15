/**
 * Analytics Tracking System for EventPlan
 * Tracks page views, events, user interactions, and device metadata
 * DRY: Reuses DeviceMetadataCollector and SessionManager from device-collector.js
 */

// Constants - single source of truth
const SESSION_KEY = 'eplanner_session_id';
const API_ENDPOINT = '/api/analytics/event';

// Page category mapping - central configuration
const PAGE_CATEGORY_MAP = {
  'index.html': 'home',
  'coordinate.html': 'event_create',
  'signup.html': 'event_signup',
  'event.html': 'event_view',
  'manage.html': 'event_manage',
  'admin.html': 'admin',
};

// Get or create session ID
function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    // Reuse SessionManager if available, otherwise generate simple ID
    if (window.SessionManager) {
      const sessionManager = new window.SessionManager();
      sessionId = sessionManager.sessionId;
    } else {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Get page category from current URL
function getPageCategory() {
  const pathname = window.location.pathname;
  const filename = pathname.split('/').pop() || 'index.html';
  
  // Check direct mapping
  if (PAGE_CATEGORY_MAP[filename]) {
    return PAGE_CATEGORY_MAP[filename];
  }
  
  // Fallback to filename without extension
  return filename.replace('.html', '') || 'unknown';
}

// Get API base URL (detect current origin)
function getApiBaseUrl() {
  return window.location.origin;
}

// Reuse existing device collection
function getDeviceInfo() {
  if (window.DeviceMetadataCollector && typeof window.DeviceMetadataCollector.collectDeviceData === 'function') {
    try {
      return window.DeviceMetadataCollector.collectDeviceData();
    } catch (error) {
      console.warn('[Analytics] Failed to collect device info:', error);
    }
  }
  return {};
}

// Send event to analytics API
async function sendEvent(eventData) {
  try {
    const payload = {
      eventType: eventData.eventType,
      sessionId: getSessionId(),
      pageCategory: eventData.pageCategory || getPageCategory(),
      pageUrl: eventData.pageUrl || window.location.href,
      referrer: eventData.referrer || document.referrer || null,
      deviceInfo: eventData.deviceInfo || getDeviceInfo(),
      timestamp: new Date().toISOString(),
      // Article context (for events)
      articleId: eventData.articleId || null,
      articleSlug: eventData.articleSlug || null,
      articleContext: eventData.articleContext || null,
      // CTA tracking
      ctaType: eventData.ctaType || null,
      // Scroll depth
      depthPercent: eventData.depthPercent || null,
    };

    const url = getApiBaseUrl() + API_ENDPOINT;
    
    // Use sendBeacon for critical events (form submissions), fetch for others
    const useBeacon = eventData.useBeacon !== false; // Default true for page views and CTAs
    
    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true, // Ensure request completes even if page unloads
      });
    }
  } catch (error) {
    // Non-blocking - never throw errors
    console.warn('[Analytics] Failed to send event:', error);
  }
}

// Analytics API object
window.Analytics = {
  /**
   * Safe tracking helper - DRY pattern to avoid repeating existence checks
   */
  safeTrack(method, ...args) {
    if (this[method] && typeof this[method] === 'function') {
      try {
        this[method](...args);
      } catch (error) {
        console.warn('[Analytics] Tracking error:', error);
      }
    }
  },

  /**
   * Track page view
   */
  trackPageView(context = {}) {
    sendEvent({
      eventType: 'page_view',
      ...context,
    });
  },

  /**
   * Track event view (when viewing a specific event)
   */
  trackEventView(eventId, eventSlug, context = {}) {
    sendEvent({
      eventType: 'event_view',
      articleId: eventId,
      articleSlug: eventSlug || eventId,
      articleContext: {
        eventId: eventId,
        slug: eventSlug || eventId,
        ...context,
      },
    });
  },

  /**
   * Track event impression (when event appears in list)
   */
  trackEventImpression(eventId, eventSlug, context = {}) {
    sendEvent({
      eventType: 'event_impression',
      articleId: eventId,
      articleSlug: eventSlug || eventId,
      articleContext: {
        eventId: eventId,
        slug: eventSlug || eventId,
        ...context,
      },
    });
  },

  /**
   * Track event open (user clicks to view event details)
   */
  trackEventOpen(eventId, eventSlug, context = {}) {
    sendEvent({
      eventType: 'event_open',
      articleId: eventId,
      articleSlug: eventSlug || eventId,
      articleContext: {
        eventId: eventId,
        slug: eventSlug || eventId,
        ...context,
      },
    });
  },

  /**
   * Track event read (user scrolls through event page)
   */
  trackEventRead(eventId, eventSlug, depthPercent, context = {}) {
    sendEvent({
      eventType: 'event_read',
      articleId: eventId,
      articleSlug: eventSlug || eventId,
      depthPercent: depthPercent,
      articleContext: {
        eventId: eventId,
        slug: eventSlug || eventId,
        depthPercent: depthPercent,
        ...context,
      },
    });
  },

  /**
   * Track CTA click
   */
  trackCTAClick(ctaType, context = {}) {
    sendEvent({
      eventType: 'cta_click',
      ctaType: ctaType,
      useBeacon: true, // Use beacon for CTA clicks
      ...context,
    });
  },

  /**
   * Set up scroll tracking for event read events
   */
  setupScrollTracking(eventId, eventSlug) {
    let maxDepth = 0;
    let lastReportedDepth = 0;
    const depthThresholds = [25, 50, 75, 90, 100]; // Report at these percentages
    let debounceTimer = null;

    const trackDepth = (depth) => {
      if (depth > maxDepth) {
        maxDepth = depth;
        
        // Check if we should report this depth
        for (const threshold of depthThresholds) {
          if (depth >= threshold && lastReportedDepth < threshold) {
            lastReportedDepth = threshold;
            
            // Debounce rapid scroll events
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            
            debounceTimer = setTimeout(() => {
              this.trackEventRead(eventId, eventSlug, threshold);
            }, 500); // 500ms debounce
            break;
          }
        }
      }
    };

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollBottom = scrollTop + windowHeight;
      
      const depthPercent = Math.round((scrollBottom / documentHeight) * 100);
      trackDepth(Math.min(depthPercent, 100));
    };

    // Throttle scroll events
    let scrollTimer = null;
    window.addEventListener('scroll', () => {
      if (scrollTimer) {
        return;
      }
      scrollTimer = setTimeout(() => {
        handleScroll();
        scrollTimer = null;
      }, 100); // Check every 100ms
    }, { passive: true });

    // Track initial view
    handleScroll();
  },
};

// Auto-initialize page view tracking
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.Analytics.trackPageView();
  });
} else {
  // DOM already loaded
  window.Analytics.trackPageView();
}

// Auto-initialize CTA tracking with event delegation (DRY - one listener for all CTAs)
document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-track-cta]');
  if (target) {
    const ctaType = target.getAttribute('data-track-cta');
    if (ctaType && window.Analytics.trackCTAClick) {
      window.Analytics.trackCTAClick(ctaType, {
        pageCategory: getPageCategory(),
        pageUrl: window.location.href,
      });
    }
  }
}, true); // Use capture phase to catch events early
