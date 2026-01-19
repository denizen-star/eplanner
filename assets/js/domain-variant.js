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
    return window.location.hostname === LGBTQ_DOMAIN;
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
        findGroupButton.href = WHATSAPP_GROUP_LINK;
        // Add target="_blank" and rel for external link
        findGroupButton.target = '_blank';
        findGroupButton.rel = 'noopener noreferrer';
        // Add WhatsApp icon before the text
        const whatsappIcon = document.createElement('img');
        whatsappIcon.src = 'assets/images/whatsapp-icon.svg';
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
      }
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateButtonsForDomain);
  } else {
    // DOM already loaded
    updateButtonsForDomain();
  }
})();
