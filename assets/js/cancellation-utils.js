// Shared cancellation utilities (DRY principle)
// Reusable cancellation flow for manage.html and admin.html

/**
 * Initialize cancellation flow - shows email verification modal
 * @param {string} runId - Event ID
 * @param {string} coordinatorEmail - Coordinator email to verify
 * @param {Object} options - Options object
 * @param {boolean} options.isAdmin - Whether this is an admin cancellation
 * @param {Function} options.onSuccess - Callback after successful cancellation
 */
function initCancellationFlow(runId, coordinatorEmail, options = {}) {
  const { isAdmin = false, onSuccess } = options;
  
  if (!coordinatorEmail) {
    showErrorModal('Unable to load event data');
    return;
  }
  
  showEmailVerificationModal(runId, coordinatorEmail, { isAdmin, onSuccess });
}

function showEmailVerificationModal(runId, coordinatorEmail, options = {}) {
  const { isAdmin, onSuccess } = options;
  
  // Escape coordinatorEmail for use in HTML
  const escapedEmail = escapeHtml(coordinatorEmail);
  
  const content = `
    <div class="modal-title">Verify Your Identity</div>
    <div class="modal-message">
      Please enter your coordinator email address to cancel this event.
    </div>
    <div style="margin-bottom: 16px;">
      <input 
        type="email" 
        id="emailVerificationInput" 
        placeholder="Enter coordinator email"
        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
        autocomplete="email"
      />
    </div>
    <div class="modal-actions">
      <button class="button" onclick="hideModal()">Cancel</button>
      <button class="button button-primary" onclick="window.verifyEmailAndProceed('${runId}', ${isAdmin}, '${escapedEmail}')">Continue</button>
    </div>
  `;
  showModal(content);
  
  setTimeout(() => {
    const input = document.getElementById('emailVerificationInput');
    if (input) {
      input.focus();
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          window.verifyEmailAndProceed(runId, isAdmin, coordinatorEmail);
        }
      });
    }
  }, 100);
}

// Make functions globally accessible for onclick handlers
window.verifyEmailAndProceed = async function(runId, isAdmin, expectedEmail) {
  const enteredEmail = document.getElementById('emailVerificationInput')?.value.trim() || '';
  
  if (enteredEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
    showErrorModal('Email does not match the coordinator email for this event.');
    return;
  }
  
  showCancellationConfirmationModal(runId, expectedEmail, { isAdmin });
};

function showCancellationConfirmationModal(runId, coordinatorEmail, options = {}) {
  const { isAdmin } = options;
  
  // Escape coordinatorEmail for use in HTML
  const escapedEmail = escapeHtml(coordinatorEmail);
  
  const content = `
    <div class="modal-title">Cancel Event</div>
    <div class="modal-message">
      Are you sure you want to cancel this event? This action cannot be undone.
    </div>
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500;">
        Cancellation Message (Optional):
      </label>
      <textarea 
        id="cancellationMessageInput" 
        placeholder="Add a message for participants..."
        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 100px; resize: vertical;"
      ></textarea>
    </div>
    <div class="modal-actions">
      <button class="button" onclick="hideModal()">No, Keep Event</button>
      <button class="button button-primary" onclick="window.confirmCancellation('${runId}', '${escapedEmail}', ${isAdmin})" style="background-color: #ef4444;">
        Yes, Cancel Event
      </button>
    </div>
  `;
  showModal(content);
}

window.confirmCancellation = async function(runId, coordinatorEmail, isAdmin) {
  const cancellationMessage = document.getElementById('cancellationMessageInput')?.value.trim() || null;
  
  const url = isAdmin 
    ? `/api/runs/${runId}/cancel?isAdmin=true`
    : `/api/runs/${runId}/cancel`;
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinatorEmail: coordinatorEmail,
        cancellationMessage: cancellationMessage
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel event');
    }

    hideModal();
    
    // Call success callback or show cancelled screen
    if (window.onCancellationSuccess) {
      window.onCancellationSuccess(runId, isAdmin);
    } else {
      showEventCancelledScreen();
    }
  } catch (error) {
    showErrorModal(error.message || 'Failed to cancel event');
  }
};

function showEventCancelledScreen() {
  const mainContent = document.querySelector('main');
  if (mainContent) mainContent.style.display = 'none';

  const notFound = document.getElementById('notFound');
  if (notFound) {
    notFound.style.display = 'block';
    notFound.innerHTML = `
      <h1>Event Cancelled</h1>
      <p>This event has been cancelled.</p>
      <a href="/" class="button button-primary">Return Home</a>
    `;
  }
}
