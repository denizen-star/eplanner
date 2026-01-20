// Shared modal utilities (DRY principle)
// Reusable modal functions for manage.html and admin.html

function showModal(content) {
  const modalBody = document.getElementById('modalBody');
  const modalOverlay = document.getElementById('modalOverlay');
  if (!modalBody || !modalOverlay) {
    console.error('Modal elements not found. Ensure modal HTML is included in page.');
    return;
  }
  modalBody.innerHTML = content;
  modalOverlay.style.display = 'flex';
}

function hideModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
  }
}

function showSuccessModal(message, onClose) {
  const modalId = 'successModal_' + Date.now();
  
  if (onClose && typeof onClose === 'function') {
    window[modalId] = () => {
      hideModal();
      onClose();
      delete window[modalId];
    };
  } else {
    window[modalId] = () => {
      hideModal();
      delete window[modalId];
    };
  }
  
  const content = `
    <div class="modal-success-icon">✓</div>
    <div class="modal-title" style="text-align: center;">Success</div>
    <div class="modal-message" style="text-align: center;">${escapeHtml(message)}</div>
    <div class="modal-actions">
      <button class="button button-primary" onclick="window['${modalId}']()">OK</button>
    </div>
  `;
  showModal(content);
}

function showErrorModal(message) {
  const content = `
    <div class="modal-title" style="color: #ef4444;">Error</div>
    <div class="modal-message">${escapeHtml(message)}</div>
    <div class="modal-actions">
      <button class="button button-primary" onclick="hideModal()">OK</button>
    </div>
  `;
  showModal(content);
}

// Helper to escape HTML (XSS protection)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
