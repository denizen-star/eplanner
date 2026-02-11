const waiverText = `
<h4>Electronic Waiver of Liability, Media Release, and Code of Conduct</h4>
<p><strong>Miami Beach Gay Runners (the "Club")</strong></p>
<p><strong>PLEASE READ THIS DOCUMENT CAREFULLY. BY CLICKING "I ACCEPT," YOU ARE WAIVING IMPORTANT LEGAL RIGHTS AND AGREEING TO ALL TERMS.</strong></p>

<h4>1. ACKNOWLEDGMENT, MEDICAL FITNESS, AND ASSUMPTION OF RISK</h4>
<p>I understand that participating in activities organized by the Club involves physical exertion and carries <strong>INHERENT RISKS</strong>, including but not limited to falls, traffic, weather, and equipment failure. I certify that I am <strong>MEDICALLY ABLE</strong> and properly trained. I understand and voluntarily assume the risk of exposure to <strong>COMMUNICABLE DISEASES, VIRUSES, AND BACTERIA</strong> (including COVID-19). I <strong>VOLUNTARILY ACKNOWLEDGE AND ASSUME ALL RISKS, KNOWN AND UNKNOWN</strong>, associated with my involvement.</p>

<h4>2. GENERAL WAIVER, RELEASE, AND DISCHARGE OF LIABILITY</h4>
<p>I permanently waive, release, and <strong>FOREVER DISCHARGE</strong> the Club, its officers, directors, employees, volunteers, <strong>PACEMAKERS (PACERS)</strong>, agents, sponsors, and representatives (the "<strong>Released Parties</strong>") from any and all claims, liabilities, demands, or damages that may arise from my participation, <strong>EVEN IF THE INJURY OR DAMAGE IS CAUSED BY THE ORDINARY NEGLIGENCE OR CARELESSNESS OF THE RELEASED PARTIES.</strong></p>

<h4>3. ENHANCED INDEMNIFICATION, LEGAL COSTS, AND MEDICAL AUTHORIZATION</h4>
<p><strong>INDEMNIFICATION AND LEGAL COSTS:</strong> I agree to protect, defend, and <strong>HOLD HARMLESS</strong> the Released Parties from any and all financial loss or cost they may incur. This includes my agreement to <strong>REIMBURSE AND PAY FOR ALL LEGAL AND OTHER COSTS</strong> (including reasonable attorneys' fees) incurred by the Released Parties in connection with any legal action that arises from or relates to my participation or alleged actions/omissions.</p>
<p><strong>MEDICAL AUTHORIZATION:</strong> I consent to and authorize the Club's staff, volunteers, or emergency personnel to arrange for medical assistance in the event of my injury, and I hereby <strong>RELEASE THEM FROM ANY LIABILITY</strong> arising from such actions. I understand I am <strong>FINANCIALLY RESPONSIBLE</strong> for any resulting medical costs.</p>

<h4>4. DISCLAIMER REGARDING PACERS AND GUIDANCE</h4>
<p>I acknowledge that any Pacemakers (Pacers) are <strong>VOLUNTEERS</strong> offering non-professional guidance. The guidance is <strong>NOT</strong> professional coaching or medical advice. I remain <strong>SOLELY RESPONSIBLE</strong> for monitoring my own pace, health, safety, and adherence to all laws and rules.</p>

<h4>5. MEDIA RELEASE AND CONSENT</h4>
<p>I grant the Club the <strong>IRREVOCABLE, PERPETUAL, WORLDWIDE, AND ROYALTY-FREE RIGHT</strong> to use my name, voice, likeness, and image (collectively, "Media") captured during Club activities for <strong>MARKETING, ADVERTISING, PROMOTIONAL, AND COMMERCIAL USE</strong>. I waive any right to compensation or approval for the use of this Media.</p>

<h4>6. CODE OF CONDUCT</h4>
<p>I agree to abide by the Code of Conduct: I will treat all individuals with respect; harassment will not be tolerated. I will follow all traffic laws and safety instructions. Failure to comply may result in immediate dismissal from the Club.</p>

<h4>7. GOVERNING LAW AND JURISDICTION</h4>
<p>This agreement shall be governed by and interpreted under the laws of the <strong>State of Florida</strong>, and any legal action shall be brought exclusively in the courts of <strong>Miami-Dade County, Florida</strong>.</p>

<h4>8. COMMUNICATION AND DISTRIBUTION CONSENT</h4>
<p>I agree to receive operational and promotional communication via text message (SMS) and/or WhatsApp from the Club at the phone number provided during registration. I acknowledge that I am responsible for any costs or fees associated with receiving these messages (e.g., carrier data or SMS rates). I also consent to be added to the official Miami Beach Gay Runners distribution list for email and/or messaging updates.</p>

<h4>9. DATA COLLECTION AND USE</h4>
<p>I understand and consent that the Club and its technology providers collect certain technical and usage data in connection with my registration and use of the signup system. This may include: device type, browser and operating system information, screen and connection details, a session identifier, the page URL and referrer, and similar technical data. This data is used for security, fraud prevention, improving the service, and analytics, and may be stored with my registration and waiver records. By accepting this waiver, I consent to this collection and use as described.</p>

<h4>10. ELECTRONIC CONSENT</h4>
<p>I acknowledge that I have carefully read, fully understand, and agree to all terms of this Electronic Waiver. I am at least 18 years of age (or a parent/guardian signing on behalf of a minor). My electronic acceptance has the same legal force and effect as if I had signed a physical document.</p>
`;

const EXTERNAL_SIGNUP_DISCLAIMER = 'This event uses an external signup page. You will leave this website to complete signup. The event is not tracked on this site. You must still accept the waiver and provide at least email or phone. You will receive a confirmation email that you are signing up for a non-tracked event.';

/**
 * Extract domain name from hostname (part before ".kervinapps.com")
 * @returns {string} Domain name (e.g., "to-lgbtq" or "eplanner")
 */
function getDomainName() {
  const hostname = window.location.hostname.toLowerCase();
  // Support alias domain that should behave like to-lgbtq
  if (hostname === 'to.lgbtq-hub.com' || hostname === 'www.to.lgbtq-hub.com') {
    return 'to-lgbtq';
  }
  // Extract part before ".kervinapps.com"
  const match = hostname.match(/^([^.]+)\.kervinapps\.com$/);
  return match ? match[1] : 'eplanner'; // Default to 'eplanner'
}

/**
 * Get domain-aware waiver text
 * @param {string} domainName - Domain name (e.g., "to-lgbtq" or "eplanner")
 * @returns {string} Waiver text with domain-specific replacements
 */
function getWaiverText(domainName) {
  let text = waiverText;
  
  if (domainName === 'to-lgbtq') {
    // Replace all instances for to-lgbtq domain
    text = text.replace(/Miami Beach Gay Runners \(the "Club"\)/g, 'to-lgbtq hub and any of their affiliates');
    text = text.replace(/the Club/g, 'to-lgbtq hub and any of their affiliates');
    text = text.replace(/Club's/g, "to-lgbtq hub's");
    text = text.replace(/Club activities/g, 'to-lgbtq hub activities');
    text = text.replace(/the Club's staff/g, "to-lgbtq hub's staff");
    text = text.replace(/Club's staff/g, "to-lgbtq hub's staff");
    text = text.replace(/dismissal from the Club/g, 'dismissal from to-lgbtq hub');
    text = text.replace(/Miami Beach Gay Runners distribution list/g, 'to-lgbtq hub distribution list');
  }
  
  return text;
}

/**
 * Show waiver modal with full waiver text
 * @param {string} waiverText - The full waiver text to display
 */
function showWaiverModal(waiverText) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.getElementById('modalContent');
  const modalBody = document.getElementById('modalBody');
  
  if (!modalOverlay || !modalContent || !modalBody) {
    console.error('Modal elements not found');
    return;
  }
  
  // Create modal content with close button
  modalBody.innerHTML = `
    <div style="position: relative;">
      <button onclick="hideWaiverModal()" style="position: absolute; top: -10px; right: -10px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center;">×</button>
      <div style="max-height: 80vh; overflow-y: auto; padding-right: 10px;">
        ${waiverText}
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <button onclick="hideWaiverModal()" class="button button-primary">Close</button>
      </div>
    </div>
  `;
  
  modalOverlay.style.display = 'flex';
  
  // Close on overlay click
  modalOverlay.onclick = function(e) {
    if (e.target === modalOverlay) {
      hideWaiverModal();
    }
  };
  
  // Close on Escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      hideWaiverModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}

/**
 * Hide waiver modal
 */
function hideWaiverModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
    modalOverlay.onclick = null;
  }
}

// Initialize session manager and device collector
let sessionManager = null;
if (window.SessionManager) {
  sessionManager = new window.SessionManager();
}

const urlParams = new URLSearchParams(window.location.search);
const runId = urlParams.get('id');

let currentRun = null;

if (!runId) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('notFound').style.display = 'block';
} else {
  loadRun();
}

// Update Open Graph meta tags for social sharing previews
function updateOpenGraphTags(run, runTitle) {
  const baseUrl = window.location.origin;
  const currentUrl = window.location.href;
  
  // Build title (event name, no " - Gay Run Club")
  const pacerName = run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim() ? run.pacerName.trim() : '';
  let title = 'Sign Up for Run';
  if (runTitle) {
    title = runTitle;
  } else if (pacerName) {
    title = `Run with ${pacerName}`;
  }
  
  // Build description: Join us!. Date: <date>. Location: <location>. Organized by: <organizer>
  const date = new Date(run.dateTime);
  const timezone = run.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formattedDate = date.toLocaleString('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const parts = ['Join us!.'];
  if (formattedDate) parts.push(`Date: ${formattedDate}.`);
  if (run.location) parts.push(`Location: ${run.location}.`);
  if (pacerName) parts.push(`Organized by: ${pacerName}.`);
  const statusLabel = run.status && typeof run.status === 'string'
    ? run.status.charAt(0).toUpperCase() + run.status.slice(1).toLowerCase()
    : 'Active';
  parts.push(`Event Status: ${statusLabel}.`);
  const description = parts.join(' ');
  
  // Set image URL: event image if present, otherwise standard default thumbnail
  const imageUrl = run.picture && typeof run.picture === 'string' && run.picture.trim()
    ? `${baseUrl}/api/event-image/${runId}`
    : `${baseUrl}/assets/images/og-default.jpeg`;
  
  // Update meta tags
  document.getElementById('og-url').setAttribute('content', currentUrl);
  document.getElementById('og-title').setAttribute('content', title);
  document.getElementById('og-description').setAttribute('content', description);
  document.getElementById('og-image').setAttribute('content', imageUrl);
  
  document.getElementById('twitter-title').setAttribute('content', title);
  document.getElementById('twitter-description').setAttribute('content', description);
  document.getElementById('twitter-image').setAttribute('content', imageUrl);
}

async function loadRun() {
  try {
    const response = await fetch(`/api/runs/${runId}`);
    if (!response.ok) {
      throw new Error('Run not found');
    }
    const run = await response.json();

    document.getElementById('runLocation').textContent = run.location;
    
    const runTitleElement = document.getElementById('runTitle');
    const pacerNameElement = document.getElementById('runPacerName');
    const runTitleDisplay = run.title && typeof run.title === 'string' && run.title.trim() ? run.title.trim() : '';
    
    if (run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim()) {
      const pacerName = run.pacerName.trim();
      if (runTitleDisplay) {
        runTitleElement.textContent = `${runTitleDisplay} - ${pacerName}`;
        document.title = `${runTitleDisplay} - ${pacerName}`;
      } else {
        runTitleElement.textContent = `Run with ${pacerName}`;
        document.title = `Run with ${pacerName}`;
      }
      if (pacerNameElement) pacerNameElement.textContent = pacerName;
    } else {
      if (runTitleDisplay) {
        runTitleElement.textContent = runTitleDisplay;
        document.title = runTitleDisplay;
      } else {
        runTitleElement.textContent = 'Sign Up for Run';
        document.title = 'Sign Up for Run';
      }
      if (pacerNameElement) pacerNameElement.textContent = '-';
    }
    
    // Format date using stored timezone if available, otherwise use browser timezone
    const runDate = new Date(run.dateTime);
    const timezone = run.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.getElementById('runDateTime').textContent = runDate.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const spotsLeft = run.maxParticipants - run.signups.length;
    document.getElementById('runSpots').textContent = `${spotsLeft} of ${run.maxParticipants}`;

    // Display event picture if available
    const pictureContainer = document.getElementById('eventPictureContainer');
    const pictureElement = document.getElementById('eventPicture');
    if (pictureContainer && pictureElement) {
      if (run.picture && typeof run.picture === 'string' && run.picture.trim()) {
        pictureElement.src = `data:image/jpeg;base64,${run.picture}`;
        pictureContainer.style.display = 'block';
      } else {
        pictureContainer.style.display = 'none';
      }
    }

    // Display event description if available
    const descriptionContainer = document.getElementById('eventDescriptionContainer');
    const descriptionElement = document.getElementById('eventDescription');
    if (descriptionContainer && descriptionElement) {
      if (run.description && typeof run.description === 'string' && run.description.trim()) {
        descriptionElement.textContent = run.description.trim();
        descriptionContainer.style.display = 'block';
      } else {
        descriptionContainer.style.display = 'none';
      }
    }
    
    // Display event website and Instagram links if available
    const linksContainer = document.getElementById('eventLinksContainer');
    const linksElement = document.getElementById('eventLinks');
    if (linksContainer && linksElement) {
      const links = [];
      if (run.eventWebsite && typeof run.eventWebsite === 'string' && run.eventWebsite.trim()) {
        links.push({
          label: 'Website',
          url: run.eventWebsite.trim(),
          icon: '🌐'
        });
      }
      if (run.eventInstagram && typeof run.eventInstagram === 'string' && run.eventInstagram.trim()) {
        links.push({
          label: 'Instagram',
          url: run.eventInstagram.trim(),
          icon: '📷'
        });
      }
      
      if (links.length > 0) {
        linksElement.innerHTML = links.map(link => `
          <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; color: var(--primary-rainbow); text-decoration: none; font-weight: var(--font-medium); padding: 8px 0;">
            <span>${link.icon}</span>
            <span>${link.label}</span>
          </a>
        `).join('');
        linksContainer.style.display = 'block';
      } else {
        linksContainer.style.display = 'none';
      }
    }

    if (run.location) {
      updateMapForLocation('locationMap', run.location, true);
    }

    const paymentContainer = document.getElementById('paymentSummaryContainer');
    if (paymentContainer && typeof renderPaymentSummaryBox === 'function' && run.paymentInfoEnabled) {
      paymentContainer.innerHTML = renderPaymentSummaryBox(run, { showCoordinatorDisclaimer: false });
      paymentContainer.style.display = 'block';
    } else if (paymentContainer) {
      paymentContainer.innerHTML = '';
      paymentContainer.style.display = 'none';
    }
    
    // Update Open Graph meta tags for social sharing
    updateOpenGraphTags(run, runTitleDisplay);
    
    // Track event view
    if (window.Analytics?.safeTrack) {
      window.Analytics.safeTrack('trackEventView', runId, runTitleDisplay || run.id);
    }

    // Update hero section
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroTitle && heroSubtitle) {
      if (runTitleDisplay) {
        heroTitle.textContent = runTitleDisplay;
      } else if (run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim()) {
        heroTitle.textContent = `Run with ${run.pacerName.trim()}`;
      } else {
        heroTitle.textContent = 'Join Us';
      }
      
      const runDate = new Date(run.dateTime);
      const timezone = run.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const formattedDate = runDate.toLocaleString('en-US', {
        timeZone: timezone,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      if (run.location) {
        heroSubtitle.textContent = `${formattedDate} • ${run.location}`;
      } else {
        heroSubtitle.textContent = formattedDate;
      }
    }

    // Check if event is cancelled
    if (run.status === 'cancelled') {
      document.getElementById('runInfo').style.display = 'none';
      document.getElementById('loading').style.display = 'none';
      document.getElementById('notFound').innerHTML = '<h1>Event Cancelled</h1><p>This event has been cancelled.</p><a href="index.html" class="button button-primary">Return Home</a>';
      document.getElementById('notFound').style.display = 'block';
      return;
    }

    // Check if event starts within 1 hour
    const eventStartTime = new Date(run.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < 1) {
      document.getElementById('runInfo').style.display = 'none';
      document.getElementById('loading').style.display = 'none';
      document.getElementById('notFound').innerHTML = '<h1>Signups Closed</h1><p>Signups are no longer available. This event starts within 1 hour.</p><a href="index.html" class="button button-primary">Return Home</a>';
      document.getElementById('notFound').style.display = 'block';
      return;
    }

    if (spotsLeft <= 0) {
      document.getElementById('runInfo').style.display = 'none';
      document.getElementById('loading').style.display = 'none';
      document.getElementById('notFound').innerHTML = '<h1>Run is Full</h1><p>This run has reached its maximum capacity.</p><a href="index.html" class="button button-primary">Return Home</a>';
      document.getElementById('notFound').style.display = 'block';
      return;
    }

    // Get domain-aware waiver text and display as clickable link
    const domainName = getDomainName();
    const domainWaiverText = getWaiverText(domainName);
    
    // Store waiver text for form submission
    window.currentWaiverText = domainWaiverText;
    
    // Display waiver as clickable link
    const waiverContainer = document.getElementById('waiverText');
    if (waiverContainer) {
      const waiverLink = document.createElement('a');
      waiverLink.href = '#';
      waiverLink.textContent = 'Electronic Waiver of Liability, Media Release, Code of Conduct, and Communication Consent.';
      waiverLink.style.cssText = 'color: #0066cc; text-decoration: underline; cursor: pointer; font-weight: 500;';
      waiverLink.onclick = function(e) {
        e.preventDefault();
        showWaiverModal(domainWaiverText);
      };
      waiverContainer.innerHTML = '';
      waiverContainer.appendChild(waiverLink);
    }
    
    currentRun = run;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('runInfo').style.display = 'block';

    const hasExternalSignup = !!(currentRun.externalSignupEnabled && currentRun.eventWebsite && typeof currentRun.eventWebsite === 'string' && currentRun.eventWebsite.trim());
    const externalContainer = document.getElementById('externalSignupContainer');
    const externalCheckbox = document.getElementById('externalSignup');
    if (hasExternalSignup && externalContainer && externalCheckbox) {
      externalContainer.style.display = 'block';
      const fromExternal = urlParams.get('external') === '1';
      if (fromExternal) {
        externalCheckbox.checked = true;
        if (typeof showConfirmModal === 'function') {
          showConfirmModal('External signup', EXTERNAL_SIGNUP_DISCLAIMER, () => {}, () => { externalCheckbox.checked = false; });
        }
      }
      externalCheckbox.addEventListener('change', function onExternalChange() {
        if (externalCheckbox.checked && typeof showConfirmModal === 'function') {
          showConfirmModal('External signup', EXTERNAL_SIGNUP_DISCLAIMER, () => {}, () => { externalCheckbox.checked = false; });
        }
      });
    }
  } catch (error) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('notFound').style.display = 'block';
  }
}

function validateForm() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const waiver = document.getElementById('waiverAccepted').checked;
  const submitButton = document.getElementById('submitButton');

  // At least one of phone or email must be provided
  const hasContactInfo = phone || email;
  
  if (name && hasContactInfo && waiver) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
}

document.getElementById('name').addEventListener('input', validateForm);
document.getElementById('phone').addEventListener('input', validateForm);
document.getElementById('email').addEventListener('input', validateForm);
document.getElementById('waiverAccepted').addEventListener('change', validateForm);

function formatInstagramHandle(handle) {
  if (!handle) return '';
  return handle.trim().replace(/^@+/, '');
}

function validateEmail(email) {
  if (!email || email.trim() === '') return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const name = document.getElementById('name').value.trim();

  // Track signup submission CTA click; optional enrichment for passive member (memberEmail, memberName, memberPhone)
  if (window.Analytics?.safeTrack) {
    const ctaContext = { pageCategory: 'event_signup', articleId: runId };
    if (email) ctaContext.memberEmail = email;
    if (name) ctaContext.memberName = name;
    if (phone) ctaContext.memberPhone = phone;
    window.Analytics.safeTrack('trackCTAClick', 'signup_submit_click', ctaContext);
  }
  const instagram = formatInstagramHandle(document.getElementById('instagram').value);

  // Validate that at least one of phone or email is provided
  if (!phone && !email) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = 'Please provide at least one of phone number or email address';
    errorDiv.style.display = 'block';
    return;
  }

  if (email && !validateEmail(email)) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = 'Please enter a valid email address';
    errorDiv.style.display = 'block';
    return;
  }

  // Collect device information (only in production)
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  let deviceInfo = null;
  let sessionInfo = null;

  if (isProduction && window.DeviceMetadataCollector && sessionManager) {
    deviceInfo = window.DeviceMetadataCollector.collectDeviceData();
    sessionInfo = sessionManager.getSessionData();
  }

  const isExternal = !!(currentRun?.externalSignupEnabled && document.getElementById('externalSignup')?.checked && currentRun?.eventWebsite && typeof currentRun.eventWebsite === 'string' && currentRun.eventWebsite.trim());
  // Use domain-aware waiver text if available, otherwise fall back to default
  const waiverTextToSubmit = window.currentWaiverText || getWaiverText(getDomainName());
  
  const sessionId = (sessionManager && sessionManager.sessionId) || (typeof localStorage !== 'undefined' && localStorage.getItem('eplanner_session_id')) || null;
  const newsletterWeeklyOptIn = document.getElementById('newsletterWeeklyOptIn') && document.getElementById('newsletterWeeklyOptIn').checked;

  const formData = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: email || '',
    instagram: instagram || '',
    waiverAccepted: document.getElementById('waiverAccepted').checked,
    waiverText: waiverTextToSubmit,
    externalSignup: isExternal,
    newsletterWeekly: !!newsletterWeeklyOptIn,
    session_id: sessionId,
    deviceInfo: deviceInfo,
    sessionInfo: sessionInfo,
    pageUrl: window.location.href,
    referrer: document.referrer || ''
  };

  const errorDiv = document.getElementById('error');
  const successDiv = document.getElementById('success');
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  try {
    const response = await fetch(`/api/runs/${runId}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }

    if (!runId) {
      throw new Error('Invalid event ID');
    }

    if (isExternal && currentRun?.eventWebsite) {
      const extUrl = currentRun.eventWebsite.trim();
      window.open(extUrl, '_blank', 'noopener');
      successDiv.textContent = "You're signed up. We've opened the event coordinator's website in a new tab. Check your email for confirmation.";
      successDiv.style.display = 'block';
      document.getElementById('signupForm').style.display = 'none';
    } else {
      const redirectUrl = `/event.html?id=${runId}&success=true`;
      window.location.replace(redirectUrl);
    }
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = 'block';
  }
});

function toggleInstructions() {
  const content = document.getElementById('instructionsContent');
  const icon = document.getElementById('instructionsIcon');
  
  if (!content || !icon) return;
  
  const isHidden = content.style.display === 'none' || !content.style.display;
  content.style.display = isHidden ? 'block' : 'none';
  
  if (isHidden) {
    icon.textContent = '▼';
    icon.classList.remove('collapsed');
    icon.classList.add('expanded');
  } else {
    icon.textContent = '▶';
    icon.classList.remove('expanded');
    icon.classList.add('collapsed');
  }
}
