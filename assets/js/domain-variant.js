/**
 * Domain Variant Configuration
 * Updates button links and text based on the current domain
 */

(function() {
  'use strict';

  // Domain configuration
  const LGBTQ_DOMAIN = 'to-lgbtq.kervinapps.com';
  const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/Fea7OmKCL338wVUsWEajzr';
  const SIGNUP_BUTTON_NEW_TEXT = 'Create your Activity';

  /**
   * Check if current domain matches LGBTQ domain
   */
  function isLGBTQDomain() {
    const hostname = window.location.hostname.toLowerCase();
    return hostname === LGBTQ_DOMAIN || 
           hostname === 'www.' + LGBTQ_DOMAIN ||
           hostname.includes('to-lgbtq');
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
      const findGroupButton = document.getElementById('hero-find-group-btn');
      if (findGroupButton) {
        // Update href using setAttribute for reliability
        findGroupButton.setAttribute('href', WHATSAPP_GROUP_LINK);
        findGroupButton.href = WHATSAPP_GROUP_LINK; // Also set directly as fallback
        
        // Add target="_blank" and rel for external link
        findGroupButton.setAttribute('target', '_blank');
        findGroupButton.setAttribute('rel', 'noopener noreferrer');
        
        // Add WhatsApp icon before the text
        const whatsappIcon = document.createElement('img');
        whatsappIcon.src = 'assets/images/wAppII.png';
        whatsappIcon.alt = 'WhatsApp';
        whatsappIcon.style.width = '20px';
        whatsappIcon.style.height = '20px';
        whatsappIcon.style.verticalAlign = 'middle';
        whatsappIcon.style.marginRight = '6px';
        whatsappIcon.style.display = 'inline-block';
        
        // Clear existing content and add icon + text
        findGroupButton.innerHTML = '';
        findGroupButton.appendChild(whatsappIcon);
        findGroupButton.appendChild(document.createTextNode(' Find your group'));
        
        // Ensure href is set after innerHTML manipulation
        findGroupButton.href = WHATSAPP_GROUP_LINK;
        findGroupButton.setAttribute('href', WHATSAPP_GROUP_LINK);
      } else {
        console.warn('[Domain Variant] Could not find hero-find-group-btn element');
      }
    }
  }

  // Run when DOM is ready, with a small delay to ensure all scripts have run
  function init() {
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
