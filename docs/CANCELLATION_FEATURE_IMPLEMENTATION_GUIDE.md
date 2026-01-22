# Cancellation Feature Implementation Guide

## Overview

This document provides detailed instructions for implementing a modern cancellation feature for events that includes:
- In-page modal overlays instead of browser alerts/confirms
- Email verification for coordinators
- Optional cancellation message
- Database storage of cancellation timestamp and message
- Email notifications with cancellation details

## Original Requirements

### User Request
1. **Modern UI/UX**: Replace browser notifications and confirmations with in-page overlays or button changes
2. **Cancellation Message**: Give users the option to add a cancellation message
3. **Coordinator Email**: Include event coordinator's email on the cancellation message
4. **Tone**: Make cancellation messages "millennial and nice"
5. **Confirmation Screen**: Display a specific "Event Cancelled" screen: "Event Cancelled, This event has been cancelled. Return Home"
6. **Save Changes Overlay**: Replace the "save changes" confirmation for editing events from browser alert to overlay
7. **Database Storage**: Store cancellation message and cancellation timestamp in the database
8. **Email Verification**: Use coordinator's email address as confirmation that the right person is canceling the event

## Implementation History

### What Was Implemented
1. ✅ Modal overlay system (`showModal`, `hideModal`, `showSuccessModal`, `showErrorModal`)
2. ✅ Email verification step for cancellation
3. ✅ Optional cancellation message input
4. ✅ "Event Cancelled" screen UI
5. ✅ Database schema migration for cancellation fields
6. ✅ Backend API updates to handle cancellation data
7. ✅ Email templates with cancellation message
8. ✅ Save changes overlay for event editing

### What Went Wrong

#### Issue 1: Database Query Failures
**Problem**: Added `cancellation_message` and `cancelled_at` to `EVENT_SELECT_FIELDS` constant, but the database columns didn't exist yet. This caused all queries (including event creation) to fail with "Unknown column" errors.

**Root Cause**: Attempting to SELECT non-existent columns before running the migration.

**Solution**: Implement fallback queries that don't include cancellation columns when they don't exist, OR ensure migration is run first before adding columns to SELECT statements.

#### Issue 2: ES Module Compatibility
**Problem**: `lib/ipGeolocation.js` was using `require('node-fetch')`, but node-fetch v3 is an ES module and cannot be required in CommonJS.

**Root Cause**: node-fetch v3 requires ESM import, which doesn't work with `require()`.

**Solution**: Remove `node-fetch` and use native `fetch` (Node 18+).

#### Issue 3: Syntax Error (Regex)
**Problem**: "Invalid regular expression: missing /" error during event creation.

**Root Cause**: Likely related to complex regex patterns in fallback query generation or improper template string handling.

**Solution**: Simplify fallback query generation or use separate constant for fallback fields instead of regex replacement.

## Lessons Learned

### Critical Lessons

1. **Migration Order Matters**
   - Always run database migrations BEFORE updating code to use new columns
   - OR implement graceful fallback queries that work with or without columns
   - Test with both migrated and non-migrated database states

2. **Module System Compatibility**
   - Check if dependencies are CommonJS or ES modules before using `require()`
   - Use native `fetch` when available (Node 18+)
   - Avoid `node-fetch` to prevent ESM/CJS issues

3. **Backward Compatibility**
   - Don't break existing functionality while adding new features
   - Event creation should work regardless of migration status
   - Implement feature flags or fallbacks for optional features

4. **Incremental Development**
   - Test each component independently before integration
   - Don't change multiple systems simultaneously
   - Keep database schema and code in sync at each step

5. **Error Handling**
   - Provide clear error messages for missing dependencies
   - Log migration status and column availability
   - Fail gracefully when optional features aren't available

## Detailed Implementation Instructions

### Phase 1: Database Migration (MUST BE FIRST)

#### Step 1.1: Create Migration File
Create `lib/migration-add-cancellation-fields.sql`:

```sql
-- Migration: Add cancellation_message and cancelled_at columns to ep_events table
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration adds:
-- - cancellation_message: Stores the optional message provided by coordinator when cancelling
-- - cancelled_at: Timestamp of when the event was cancelled

-- Add cancellation_message column (TEXT, nullable)
ALTER TABLE ep_events 
ADD COLUMN cancellation_message TEXT NULL;

-- Add cancelled_at column (DATETIME, nullable)
ALTER TABLE ep_events 
ADD COLUMN cancelled_at DATETIME NULL;

-- Add index for efficient querying of cancelled events
CREATE INDEX idx_cancelled_at ON ep_events(cancelled_at);
```

#### Step 1.2: Run Migration
1. Connect to PlanetScale database
2. Create development branch (if not exists)
3. Run migration SQL
4. Test queries to verify columns exist
5. Promote to main branch after verification

**CRITICAL**: Do not proceed to Phase 2 until this migration is complete and columns are available.

### Phase 2: Database Client Updates

#### Step 2.1: Add Fields to EVENT_SELECT_FIELDS
In `lib/databaseClient.js`, add cancellation fields to `EVENT_SELECT_FIELDS`:

```javascript
const EVENT_SELECT_FIELDS = `
  id,
  uuid,
  location,
  coordinates,
  planner_name as plannerName,
  title,
  date_time as dateTime,
  end_time as endTime,
  timezone,
  max_participants as maxParticipants,
  status,
  is_public as isPublic,
  app_name as appName,
  created_at as createdAt,
  updated_at as updatedAt,
  house_number as houseNumber,
  road,
  suburb,
  city,
  county,
  state,
  postcode,
  country,
  country_code as countryCode,
  neighbourhood,
  city_district as cityDistrict,
  village,
  town,
  municipality,
  coordinator_email as coordinatorEmail,
  place_name as placeName,
  picture,
  description,
  signup_link as signupLink,
  manage_link as manageLink,
  event_view_link as eventViewLink,
  cancellation_message as cancellationMessage,
  cancelled_at as cancelledAt
`;
```

#### Step 2.2: Update processRunData Function
In `lib/databaseClient.js`, add conversion for cancelledAt:

```javascript
// Convert cancelled_at if present
if (run.cancelledAt && typeof run.cancelledAt === 'string' && !run.cancelledAt.includes('T')) {
  run.cancelledAt = run.cancelledAt.replace(' ', 'T') + 'Z';
}
```

#### Step 2.3: Add Cancellation Fields to Update Method
In `lib/databaseClient.js`, in the `runs.update()` method, add handlers for cancellation fields:

```javascript
if (updates.cancellationMessage !== undefined) {
  fields.push('cancellation_message = ?');
  values.push(updates.cancellationMessage ? updates.cancellationMessage.trim() : null);
  console.log('[DATABASE] Adding cancellation_message to update:', updates.cancellationMessage ? 'has value' : 'null');
}

if (updates.cancelledAt !== undefined) {
  const mysqlDateTime = toMySQLDateTime(updates.cancelledAt);
  fields.push('cancelled_at = ?');
  values.push(mysqlDateTime);
  console.log('[DATABASE] Adding cancelled_at to update:', mysqlDateTime);
}
```

**Important**: Place these handlers BEFORE the final `if (fields.length === 0)` check.

### Phase 3: Backend API Updates

#### Step 3.1: Update Cancel Endpoint in server.js
In `server.js`, locate `app.patch('/api/runs/:runId/cancel', ...)` and update:

```javascript
// Extract cancellation data from request body
const { coordinatorEmail, cancellationMessage } = req.body;

// ... existing validation ...

// Verify coordinator email matches
if (!coordinatorEmail || coordinatorEmail.trim().toLowerCase() !== existingRun.coordinatorEmail.toLowerCase()) {
  return res.status(403).json({ error: 'Coordinator email does not match' });
}

// Update event status to 'cancelled' with cancellation message and timestamp
const cancelledAt = new Date().toISOString();
const updateData = { 
  status: 'cancelled',
  cancelledAt: cancelledAt  // Use camelCase for databaseClient
};

if (cancellationMessage && cancellationMessage.trim()) {
  updateData.cancellationMessage = cancellationMessage.trim();
}

await runs.update(runId, updateData);
```

#### Step 3.2: Update Netlify Function
In `netlify/functions/runs-cancel.js`, apply the same updates as server.js:

```javascript
const body = parseBody(event);
const { coordinatorEmail, cancellationMessage } = body;

// ... email verification ...

const cancelledAt = new Date().toISOString();
const updateData = { 
  status: 'cancelled',
  cancelledAt: cancelledAt
};

if (cancellationMessage && cancellationMessage.trim()) {
  updateData.cancellationMessage = cancellationMessage.trim();
}

await runs.update(runId, updateData);
```

### Phase 4: Frontend Modal System

#### Step 4.1: Add Modal HTML Structure
In `manage.html` and `admin.html`, add before closing `</body>`:

```html
<div id="modalOverlay" style="display: none;">
  <div id="modalContent">
    <div id="modalBody"></div>
  </div>
</div>

<style>
  #modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-in;
  }

  #modalContent {
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .modal-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .modal-message {
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .modal-success-icon {
    font-size: 48px;
    color: #10b981;
    text-align: center;
    margin-bottom: 16px;
  }
</style>
```

#### Step 4.2: Add Modal Utility Functions
In `assets/js/manage.js` and `assets/js/admin.js`, add:

```javascript
function showModal(content) {
  const modalBody = document.getElementById('modalBody');
  const modalOverlay = document.getElementById('modalOverlay');
  modalBody.innerHTML = content;
  modalOverlay.style.display = 'flex';
}

function hideModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay.style.display = 'none';
}

function showSuccessModal(message, onClose) {
  // Generate unique ID for this modal instance to avoid conflicts
  const modalId = 'successModal_' + Date.now();
  
  // Store the callback in a global object keyed by modal ID
  if (onClose && typeof onClose === 'function') {
    window[modalId] = () => {
      hideModal();
      onClose();
      delete window[modalId]; // Clean up after execution
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
    <div class="modal-message" style="text-align: center;">${message}</div>
    <div class="modal-actions">
      <button class="button button-primary" onclick="window['${modalId}']()">OK</button>
    </div>
  `;
  showModal(content);
}

function showErrorModal(message) {
  const content = `
    <div class="modal-title" style="color: #ef4444;">Error</div>
    <div class="modal-message">${message}</div>
    <div class="modal-actions">
      <button class="button button-primary" onclick="hideModal()">OK</button>
    </div>
  `;
  showModal(content);
}
```

### Phase 5: Cancellation Flow Implementation

#### Step 5.1: Update cancelEvent Function
In `assets/js/manage.js`, replace `cancelEvent()` with:

```javascript
async function cancelEvent(runId) {
  const run = currentRuns.find(r => r.id === runId || r.uuid === runId);
  if (!run) {
    showErrorModal('Event not found');
    return;
  }

  // Show email verification modal first
  showEmailVerificationModal(runId, run.coordinatorEmail);
}

function showEmailVerificationModal(runId, coordinatorEmail) {
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
      <button class="button button-primary" onclick="verifyEmailAndProceed('${runId}')">Continue</button>
    </div>
  `;
  showModal(content);
  
  // Focus input and allow Enter key
  setTimeout(() => {
    const input = document.getElementById('emailVerificationInput');
    input.focus();
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyEmailAndProceed(runId);
      }
    });
  }, 100);
}

async function verifyEmailAndProceed(runId) {
  const run = currentRuns.find(r => r.id === runId || r.uuid === runId);
  if (!run) {
    showErrorModal('Event not found');
    return;
  }

  const enteredEmail = document.getElementById('emailVerificationInput').value.trim();
  
  if (enteredEmail.toLowerCase() !== run.coordinatorEmail.toLowerCase()) {
    showErrorModal('Email does not match the coordinator email for this event.');
    return;
  }

  // Show cancellation confirmation modal with message option
  showCancellationConfirmationModal(runId, run.coordinatorEmail);
}

function showCancellationConfirmationModal(runId, coordinatorEmail) {
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
      <button class="button button-primary" onclick="confirmCancellation('${runId}')" style="background-color: #ef4444;">
        Yes, Cancel Event
      </button>
    </div>
  `;
  showModal(content);
}

async function confirmCancellation(runId) {
  const run = currentRuns.find(r => r.id === runId || r.uuid === runId);
  if (!run) {
    showErrorModal('Event not found');
    return;
  }

  const cancellationMessage = document.getElementById('cancellationMessageInput').value.trim() || null;

  try {
    const response = await fetch(`/api/runs/${runId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinatorEmail: run.coordinatorEmail,
        cancellationMessage: cancellationMessage
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel event');
    }

    hideModal();
    // Show "Event Cancelled" screen
    showEventCancelledScreen();
  } catch (error) {
    showErrorModal(error.message || 'Failed to cancel event');
  }
}

function showEventCancelledScreen() {
  // Hide main content
  const mainContent = document.querySelector('main');
  if (mainContent) mainContent.style.display = 'none';

  // Show cancelled screen
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
```

#### Step 5.2: Update Admin Cancel Function
Apply the same pattern to `assets/js/admin.js`, using `showEmailVerificationModalAdmin`, `verifyEmailAndProceedAdmin`, etc.

### Phase 6: Email Template Updates

#### Step 6.1: Update eventCancelledEmail Function
In `lib/emailTemplates.js`, update `eventCancelledEmail`:

```javascript
function eventCancelledEmail(run, signup, cancellationMessage = null) {
  const coordinatorEmail = run.coordinatorEmail || 'the event coordinator';
  
  // Escape HTML entities in cancellation message to prevent XSS
  const safeCancellationMessage = cancellationMessage 
    ? cancellationMessage
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
    : null;

  const subject = `Event Cancelled: ${run.title || run.location}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .cancellation-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
        .cancellation-message { font-style: italic; color: #7f1d1d; margin-top: 12px; }
        .coordinator-contact { background-color: #f0f9ff; padding: 16px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #0ea5e9; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Event Cancelled</h1>
        <p>We're sorry to inform you that the following event has been cancelled:</p>
        
        <h2>${run.title || run.location}</h2>
        <p><strong>Date:</strong> ${formatDateTime(run.dateTime)}</p>
        <p><strong>Location:</strong> ${run.location}</p>
        
        ${safeCancellationMessage ? `
          <div class="cancellation-box">
            <strong>Message from coordinator:</strong>
            <div class="cancellation-message">${safeCancellationMessage}</div>
          </div>
        ` : ''}
        
        <div class="coordinator-contact">
          <p><strong>Questions?</strong> Feel free to reach out to ${coordinatorEmail} if you have any questions about this cancellation. We appreciate your understanding! 💙</p>
        </div>
        
        <p>Thank you for your understanding.</p>
      </div>
    </body>
    </html>
  `.trim();

  const text = `
Event Cancelled: ${run.title || run.location}

We're sorry to inform you that this event has been cancelled.

Date: ${formatDateTime(run.dateTime)}
Location: ${run.location}

${cancellationMessage ? `Message from coordinator:\n${cancellationMessage}\n\n` : ''}

Questions? Feel free to reach out to ${coordinatorEmail} if you have any questions.

Thank you for your understanding.
  `.trim();

  return { subject, html, text, fromName: 'Event Planner' };
}
```

**CRITICAL**: Always escape HTML entities in user-provided content to prevent XSS attacks.

### Phase 7: Replace Save Changes Alert

#### Step 7.1: Update saveEventEdit Function
In `assets/js/manage.js`, replace the alert with:

```javascript
showSuccessModal('Event updated successfully!', () => {
  window.location.reload();
});
```

## Testing Checklist

### Phase 1: Database
- [ ] Migration runs successfully in development branch
- [ ] Columns exist and are nullable
- [ ] Index is created
- [ ] Migration promotes to main successfully

### Phase 2: Database Client
- [ ] `runs.getById()` returns cancellation fields when present
- [ ] `runs.getAll()` includes cancellation fields
- [ ] `runs.update()` correctly saves cancellationMessage and cancelledAt
- [ ] No SQL errors in console

### Phase 3: Backend
- [ ] Cancel endpoint verifies coordinator email
- [ ] Cancel endpoint saves cancellation data
- [ ] Cancellation emails are sent with message
- [ ] Both server.js and Netlify function work identically

### Phase 4: Frontend
- [ ] Modals display correctly
- [ ] Email verification works
- [ ] Cancellation message is optional
- [ ] "Event Cancelled" screen displays after cancellation
- [ ] Save changes uses modal instead of alert

### Phase 5: Integration
- [ ] Full cancellation flow works end-to-end
- [ ] Cancellation data persists in database
- [ ] Emails include cancellation message
- [ ] XSS protection works (test with `<script>` in message)
- [ ] Error handling works for invalid emails

## Common Pitfalls to Avoid

1. **Don't add cancellation columns to SELECT before migration runs**
   - This breaks all queries
   - Always test migration first

2. **Don't use `require()` for ES modules**
   - Check module type before importing
   - Use dynamic `import()` or native fetch

3. **Don't forget XSS protection**
   - Always escape HTML in user content
   - Especially in email templates

4. **Don't hardcode callback functions in template strings**
   - Use unique window properties with IDs
   - Clean up after execution

5. **Don't break existing functionality**
   - Test event creation after changes
   - Test event editing after changes
   - Ensure backward compatibility

## Rollback Plan

If issues occur, rollback in this order:

1. Revert database client changes (`lib/databaseClient.js`)
2. Revert backend API changes (`server.js`, `netlify/functions/runs-cancel.js`)
3. Revert email template changes (`lib/emailTemplates.js`)
4. Revert frontend changes (`assets/js/manage.js`, `assets/js/admin.js`, HTML files)
5. Database columns can remain (they're nullable and won't break queries if not selected)

**Note**: Do not delete database columns unless absolutely necessary - they can be safely ignored if not used.

## Future Enhancements

1. Add cancellation reason dropdown (weather, low attendance, etc.)
2. Allow rescheduling instead of just cancelling
3. Send cancellation notifications via WhatsApp/SMS
4. Track cancellation statistics
5. Allow coordinators to un-cancel events within a time window
