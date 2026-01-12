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

<h4>9. ELECTRONIC CONSENT</h4>
<p>I acknowledge that I have carefully read, fully understand, and agree to all terms of this Electronic Waiver. I am at least 18 years of age (or a parent/guardian signing on behalf of a minor). My electronic acceptance has the same legal force and effect as if I had signed a physical document.</p>
`;

// Initialize session manager and device collector
let sessionManager = null;
if (window.SessionManager) {
  sessionManager = new window.SessionManager();
}

const urlParams = new URLSearchParams(window.location.search);
const runId = urlParams.get('id');

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
  
  // Build title
  const pacerName = run.pacerName && typeof run.pacerName === 'string' && run.pacerName.trim() ? run.pacerName.trim() : '';
  let title = 'Sign Up for Run - Gay Run Club';
  if (runTitle) {
    title = `${runTitle} - Gay Run Club`;
  } else if (pacerName) {
    title = `Run with ${pacerName} - Gay Run Club`;
  }
  
  // Build description
  const date = new Date(run.dateTime);
  const formattedDate = date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  let description = `Join us for a run!`;
  if (run.location) {
    description += ` Location: ${run.location}`;
  }
  if (formattedDate) {
    description += ` | Date: ${formattedDate} EST`;
  }
  if (pacerName) {
    description += ` | Pacer: ${pacerName}`;
  }
  
  // Set image URL (absolute URL required for Open Graph)
  const imageUrl = `${baseUrl}/assets/images/og-signup-image.jpg`;
  
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
        document.title = `${runTitleDisplay} - ${pacerName} - Gay Run Club`;
      } else {
        runTitleElement.textContent = `Run with ${pacerName}`;
        document.title = `Run with ${pacerName} - Gay Run Club`;
      }
      if (pacerNameElement) pacerNameElement.textContent = pacerName;
    } else {
      if (runTitleDisplay) {
        runTitleElement.textContent = runTitleDisplay;
        document.title = `${runTitleDisplay} - Gay Run Club`;
      } else {
        runTitleElement.textContent = 'Sign Up for Run';
        document.title = 'Sign Up for Run - Gay Run Club';
      }
      if (pacerNameElement) pacerNameElement.textContent = '-';
    }
    
    document.getElementById('runDateTime').textContent = new Date(run.dateTime).toLocaleString();
    const spotsLeft = run.maxParticipants - run.signups.length;
    document.getElementById('runSpots').textContent = `${spotsLeft} of ${run.maxParticipants}`;

    if (run.location) {
      updateMapForLocation('locationMap', run.location, true);
    }
    
    // Update Open Graph meta tags for social sharing
    updateOpenGraphTags(run, runTitleDisplay);

    if (spotsLeft <= 0) {
      document.getElementById('runInfo').style.display = 'none';
      document.getElementById('loading').style.display = 'none';
      document.getElementById('notFound').innerHTML = '<h1>Run is Full</h1><p>This run has reached its maximum capacity.</p><a href="index.html" class="button button-primary">Return Home</a>';
      document.getElementById('notFound').style.display = 'block';
      return;
    }

    document.getElementById('waiverText').innerHTML = waiverText;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('runInfo').style.display = 'block';
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

  const formData = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: email || '',
    instagram: instagram || '',
    waiverAccepted: document.getElementById('waiverAccepted').checked,
    waiverText: waiverText,
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

    successDiv.textContent = 'Successfully signed up for the run!';
    successDiv.style.display = 'block';
    document.getElementById('signupForm').reset();
    document.getElementById('submitButton').disabled = true;
    loadRun();
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
