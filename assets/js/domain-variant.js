/**
 * Domain Variant Configuration
 * Updates button links, text, and favicon based on the current domain
 */

(function() {
  'use strict';

  // Domain configuration
  const LGBTQ_DOMAIN = 'to-lgbtq.kervinapps.com';
  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/Fea7OmKCL338wVUsWEajzr';
  const SIGNUP_BUTTON_NEW_TEXT = 'Create your Activity';
  const DEFAULT_FAVICON = 'assets/images/favicon.svg';
  const LGBTQ_FAVICON = 'assets/images/to-logbtqicon.png'; // LGBTQ-specific favicon
  const LGBTQ_LOGO_ICON = 'assets/images/to-logbtqicon.png'; // LGBTQ logo icon to replace EP

  /**
   * Check if current domain matches LGBTQ domain
   * Also checks for ?lgbtq=true URL parameter for testing
   */
  function isLGBTQDomain() {
    // Check URL parameter for testing (e.g., ?lgbtq=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('lgbtq') === 'true') {
      return true;
    }
    
    const hostname = window.location.hostname.toLowerCase();
    return hostname === LGBTQ_DOMAIN || 
           hostname === 'www.' + LGBTQ_DOMAIN ||
           hostname.includes('to-lgbtq');
  }

  /**
   * Update favicon based on domain
   * This runs immediately to change favicon as early as possible
   */
  function updateFavicon() {
    if (isLGBTQDomain()) {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => link.remove());
      
      // Add new favicon for LGBTQ domain with multiple sizes for better quality
      const faviconLink16 = document.createElement('link');
      faviconLink16.rel = 'icon';
      faviconLink16.type = 'image/png';
      faviconLink16.href = LGBTQ_FAVICON;
      faviconLink16.sizes = '16x16';
      document.head.appendChild(faviconLink16);
      
      const faviconLink32 = document.createElement('link');
      faviconLink32.rel = 'icon';
      faviconLink32.type = 'image/png';
      faviconLink32.href = LGBTQ_FAVICON;
      faviconLink32.sizes = '32x32';
      document.head.appendChild(faviconLink32);
      
      const faviconLink64 = document.createElement('link');
      faviconLink64.rel = 'icon';
      faviconLink64.type = 'image/png';
      faviconLink64.href = LGBTQ_FAVICON;
      faviconLink64.sizes = '64x64';
      document.head.appendChild(faviconLink64);
      
      // Also add apple-touch-icon for better mobile support (larger size)
      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = LGBTQ_FAVICON;
      appleIcon.sizes = '180x180';
      document.head.appendChild(appleIcon);
      
      // Add shortcut icon as well
      const shortcutIcon = document.createElement('link');
      shortcutIcon.rel = 'shortcut icon';
      shortcutIcon.type = 'image/png';
      shortcutIcon.href = LGBTQ_FAVICON;
      document.head.appendChild(shortcutIcon);
    }
  }

  /**
   * Update logo icon (EP) and text based on domain
   */
  function updateLogoIcon() {
    if (isLGBTQDomain()) {
      const logoIcons = document.querySelectorAll('.logo-icon');
      logoIcons.forEach(logoIcon => {
        // Make logo icon bigger
        logoIcon.style.width = '50px';
        logoIcon.style.height = '50px';
        // Make background 100% transparent
        logoIcon.style.background = 'transparent';
        logoIcon.style.backgroundColor = 'transparent';
        logoIcon.style.backgroundImage = 'none';
        // Replace EP text with LGBTQ icon image
        logoIcon.innerHTML = '';
        const iconImg = document.createElement('img');
        iconImg.src = LGBTQ_LOGO_ICON;
        iconImg.alt = 'Event Planner';
        iconImg.style.width = '100%';
        iconImg.style.height = '100%';
        iconImg.style.objectFit = 'contain';
        logoIcon.appendChild(iconImg);
      });
      
      // Update logo text from "Event Planner" to "LGBTQ+ Activity Planner"
      const logoLinks = document.querySelectorAll('a.logo');
      logoLinks.forEach(link => {
        // Find text nodes that contain "Event Planner"
        const textNodes = [];
        const walker = document.createTreeWalker(
          link,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent && node.textContent.trim() === 'Event Planner') {
            textNodes.push(node);
          }
        }
        textNodes.forEach(textNode => {
          textNode.textContent = 'LGBTQ+ Activity Planner';
        });
      });
    }
  }

  /**
   * Update hero headline text based on domain
   */
  function updateHeroHeadline() {
    if (isLGBTQDomain()) {
      const heroHeadline = document.querySelector('.hero-headline');
      if (heroHeadline) {
        heroHeadline.textContent = 'Start your own revolution. Make your activities turn strangers into new friends & adventure accomplices.';
      }
    }
  }

  /**
   * Update buttons based on domain
   */
  function updateButtonsForDomain() {
    // Update "Sign up now" button text for all domains
    const signupButton = document.getElementById('signup-now-btn');
    if (signupButton) {
      signupButton.textContent = SIGNUP_BUTTON_NEW_TEXT;
    }

    // Update "Find your Group" button href and text only for LGBTQ domain
    if (isLGBTQDomain()) {
      console.log('[Domain Variant] LGBTQ domain detected, showing hero buttons');
      
      // Show hero CTA group on all pages for LGBTQ domain
      // Remove inline display:none style and set to flex
      const heroCtaGroups = document.querySelectorAll('.hero-cta-group');
      console.log('[Domain Variant] Found', heroCtaGroups.length, 'hero CTA groups');
      heroCtaGroups.forEach((group, index) => {
        // Remove the inline style attribute that has display:none
        if (group.hasAttribute('style') && group.style.display === 'none') {
          group.removeAttribute('style');
        }
        group.style.display = 'flex';
        console.log('[Domain Variant] Showing hero CTA group', index);
      });
      
      // Also try by ID for backwards compatibility
      const heroCtaGroup = document.getElementById('hero-cta-group');
      if (heroCtaGroup) {
        if (heroCtaGroup.hasAttribute('style') && heroCtaGroup.style.display === 'none') {
          heroCtaGroup.removeAttribute('style');
        }
        heroCtaGroup.style.display = 'flex';
        console.log('[Domain Variant] Showing hero CTA group by ID');
      }
      
      const findGroupButton = document.getElementById('hero-find-group-btn');
      if (findGroupButton) {
        // Update href using setAttribute for reliability
        findGroupButton.setAttribute('href', WHATSAPP_GROUP_LINK);
        findGroupButton.href = WHATSAPP_GROUP_LINK; // Also set directly as fallback
        
        // Add target="_blank" and rel for external link
        findGroupButton.setAttribute('target', '_blank');
        findGroupButton.setAttribute('rel', 'noopener noreferrer');
        
        // Add tooltip
        findGroupButton.setAttribute('title', 'Find your group in WhatsApp');
        
        // Check if WhatsApp icon already exists to avoid duplicates
        const existingIcon = findGroupButton.querySelector('img');
        if (!existingIcon) {
          // Add WhatsApp icon before the text
          const whatsappIcon = document.createElement('img');
          whatsappIcon.src = 'assets/images/wAppII.png';
          whatsappIcon.alt = 'WhatsApp';
          whatsappIcon.style.width = '22px';
          whatsappIcon.style.height = '22px';
          whatsappIcon.style.verticalAlign = 'middle';
          whatsappIcon.style.marginRight = '8px';
          whatsappIcon.style.display = 'inline-block';
          
          // Clear existing content and add icon + separator + text
          findGroupButton.innerHTML = '';
          findGroupButton.appendChild(whatsappIcon);
          findGroupButton.appendChild(document.createTextNode(' - Find your group'));
        }
        
        // Ensure href is set after innerHTML manipulation
        findGroupButton.href = WHATSAPP_GROUP_LINK;
        findGroupButton.setAttribute('href', WHATSAPP_GROUP_LINK);
      } else {
        console.warn('[Domain Variant] Could not find hero-find-group-btn element');
      }
      
      // Update "Learn more" / "Explore Our Community" button to point to WhatsApp community page
      const learnMoreButton = document.querySelector('a[data-track-cta="hero_learn_more_click"]');
      if (learnMoreButton) {
        learnMoreButton.setAttribute('href', 'whatsapp-community.html');
        learnMoreButton.href = 'whatsapp-community.html';
        learnMoreButton.textContent = 'Explore Our Community';
        learnMoreButton.setAttribute('title', 'Discover our WhatsApp community groups and activities');
      }
    } else {
      // Hide hero CTA group on non-LGBTQ domains (only if it has the ID, meaning it was added for LGBTQ)
      const heroCtaGroup = document.getElementById('hero-cta-group');
      if (heroCtaGroup && heroCtaGroup.hasAttribute('style') && heroCtaGroup.style.display === 'none') {
        // Only hide if it was explicitly hidden (has display:none in style attribute)
        heroCtaGroup.style.display = 'none';
      }
    }
  }

  // Update favicon immediately (runs before DOM is ready)
  updateFavicon();

  // Run when DOM is ready, with a small delay to ensure all scripts have run
  function init() {
    // Update logo icon
    updateLogoIcon();
    // Update hero headline
    updateHeroHeadline();
    // Small delay to ensure DOM is fully ready and other scripts have run
    setTimeout(updateButtonsForDomain, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded
    init();
  }
})();