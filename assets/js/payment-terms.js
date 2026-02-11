/**
 * Payment Terms - shared display and calculation logic (DRY)
 * Used by signup, event, manage, admin, calendar pages
 */

function escapeHtml(text) {
  if (text == null || text === '') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Calculate amount per person for payment display.
 * Fixed: total_event_cost is amount per person.
 * Split: total / signupCount, round UP to 2 decimals. Use divisor=1 when count=0.
 * @param {Object} event - Event with paymentMode, totalEventCost, signupCount/signups
 * @returns {number|null} Amount per person or null if not calculable
 */
function calculateAmountPerPerson(event) {
  if (!event.paymentInfoEnabled || !event.totalEventCost) return null;
  const total = parseFloat(event.totalEventCost);
  if (total <= 0 || isNaN(total)) return null;

  if (event.paymentMode === 'fixed_amount') {
    return Math.round(total * 100) / 100;
  }

  if (event.paymentMode === 'split_cost') {
    const signupCount = event.signupCount ?? event.signups?.length ?? 0;
    const divisor = Math.max(1, signupCount);
    const perPerson = total / divisor;
    return Math.ceil(perPerson * 100) / 100;
  }

  return null;
}

/**
 * Render Payment Summary Box HTML.
 * @param {Object} event - Event with payment fields, signupCount/signups
 * @param {Object} options - { showCoordinatorDisclaimer: boolean }
 * @returns {string} HTML string
 */
function renderPaymentSummaryBox(event, options) {
  const opts = options || {};
  const showCoordinatorDisclaimer = opts.showCoordinatorDisclaimer === true;

  if (!event.paymentInfoEnabled) return '';

  const amount = calculateAmountPerPerson(event);
  const isSplit = event.paymentMode === 'split_cost';
  const isLocked = !!event.collectionLocked;
  const signupCount = event.signupCount ?? event.signups?.length ?? 0;

  let amountLine = '';
  if (amount != null) {
    const formatted = '$' + amount.toFixed(2);
    if (isSplit) {
      amountLine = `<p><strong>Amount per Person:</strong> ${escapeHtml(formatted)}${isLocked ? ' (Final - locked)' : ' (As of now - check in later to see your final amount)'}</p>`;
    } else {
      amountLine = `<p><strong>Amount per Person:</strong> ${escapeHtml(formatted)}</p>`;
    }
  } else if (isSplit && signupCount === 0) {
    amountLine = `<p><strong>Amount per Person:</strong> Will be calculated once participants sign up.</p>`;
  }

  let timelineLine = '';
  if (event.paymentDueDate) {
    const dateStr = String(event.paymentDueDate).split('T')[0];
    const formatted = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    timelineLine = `<p><strong>Payment Timeline:</strong> Please be prepared to pay the coordinator by ${escapeHtml(formatted)}.</p>`;
  }

  const methodNote = '<p><strong>Method Note:</strong> Contact the event coordinator directly for their preferred payment method (e.g., e-transfer, Cash, Venmo, Bank Transfer).</p>';

  const participantDisclaimer = '<p style="margin-top: 12px; font-weight: 600;"><strong>Kervinapps is not involved in any financial transactions.</strong> We do not handle payments, provide refunds, or guarantee services. Any money exchanged is strictly between you and the event coordinator.</p>';
  const coordinatorDisclaimer = '<p style="margin-top: 12px; font-weight: 600;"><strong>Kervinapps does not facilitate or process payments.</strong> You are responsible for communicating your payment methods and collecting funds from participants directly.</p>';

  const disclaimer = showCoordinatorDisclaimer ? coordinatorDisclaimer : participantDisclaimer;

  const html = `
    <div class="payment-summary-box" style="margin-bottom: 24px; padding: 16px; background: var(--light-gray-1); border-radius: 8px; border: 1px solid var(--border-gray);">
      <h3 style="margin-bottom: 12px; font-size: 18px;">Payment Information</h3>
      ${amountLine}
      ${timelineLine}
      ${methodNote}
      <div class="payment-disclaimer" style="margin-top: 12px; padding: 12px; background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 6px; font-size: 14px;">
        ${disclaimer}
      </div>
    </div>
  `;

  return html;
}
