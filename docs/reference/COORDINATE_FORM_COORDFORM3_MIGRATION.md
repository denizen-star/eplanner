# Coordinate Form Migration: Apply CoordForm3 Design

Instructions for an agent to migrate the CoordForm3 wireframe design to the production event coordination form (`coordinate.html`). Apply changes using DRY techniques, modular code, without breaking functionality, carrying over all fields, and keeping the code simple.

---

## 1. Overview

**Source:** `docs/coordinate-forms/CoordForm3.html`  
**Target:** `coordinate.html` and `assets/css/main.css`  
**JavaScript:** `assets/js/coordinate.js` (minimal changes; preserve existing logic)

**Principle:** Add new CSS in a modular, scoped manner. Restructure HTML only where needed for layout. Keep all form field `id` and `name` attributes unchanged so `coordinate.js` continues to work.

---

## 2. Critical: Preserved Elements (Do Not Break)

These IDs and names must remain for `coordinate.js` and form submission to work:

| Element | ID/Name | Purpose |
|---------|---------|---------|
| Form | `coordinateForm` | Form submit handler |
| Planner | `pacerName` | Required field |
| Email | `coordinatorEmail` | Required field |
| Event Title | `runTitle` | Optional |
| Start Time | `dateTime` | Required, `step="1800"` |
| End Time | `endTime` | `step="1800"` |
| Max Participants | `maxParticipants` | Required, `min="1"`, default `10` |
| Description | `eventDescription` | Optional |
| Event Website | `eventWebsite` | Optional |
| External Signup | `externalSignupEnabled` | Checkbox |
| Instagram | `eventInstagram` | Optional |
| Picture | `eventPicture`, `picturePreview`, `previewImage`, `removePicture` | File upload and preview |
| Location | `location`, `locationMap`, `locationValidation`, `validatedAddress` | Map and validation |
| Payment Hidden | `paymentTypeHidden` | value="free" or "paid" |
| Payment Toggle | `paymentTypeToggle` | Free/Paid checkbox |
| Cost Options | `paymentCostTypeOptions` | Fixed/Split radios |
| Fixed Amount | `fixedAmountWrap`, `amountPerPerson` | When Fixed selected |
| Split Cost | `splitCostWrap`, `totalEventCostInput`, `paymentDueDate` | When Split selected; Total and Collection on same row |
| Visibility | `eventVisibility` (name), Public/Private radios | Required |
| Submit | `submitButton` | Submit button |
| Result/Error | `result`, `error` | Post-submit display |

**Note:** CoordForm3 merges Total and Collection into `splitCostWrap`; `collectionDateWrap` is removed. `coordinate.js` already guards with `if (collectionDateWrap)`, so no JS change is required there.

---

## 3. Modular CSS Approach (DRY)

Create a new stylesheet `assets/css/coordinate-form.css` and link it after `main.css` only on the coordinate page. This keeps coordinate-specific layout separate and avoids polluting global styles.

**File:** `assets/css/coordinate-form.css`

Add the following rules, using existing `main.css` variables where possible:

```css
/* Coordinate Form - CoordForm3 Layout (modular, scoped to .coordinate-form-card) */
.coordinate-form-card .form-section {
  margin-bottom: 16px;
  padding: 14px;
  background: rgba(247, 243, 237, 0.5);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
}

.coordinate-form-card .form-section-head {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.coordinate-form-card .form-section .form-group {
  margin-bottom: 10px;
}

.coordinate-form-card .form-section .form-group:last-child {
  margin-bottom: 0;
}

.coordinate-form-card .inline-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.coordinate-form-card .inline-row .form-group {
  flex: 1;
  min-width: 100px;
  margin-bottom: 0;
}

.coordinate-form-card .block-row {
  margin-bottom: 10px;
}

.coordinate-form-card .block-row .form-group {
  margin-bottom: 0;
}

.coordinate-form-card .when-field {
  flex: 1;
  min-width: 100px;
}

.coordinate-form-card .when-field-max {
  flex: 0 0 140px;
}

.coordinate-form-card .time-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.coordinate-form-card .event-website-wrap {
  flex: 1.5;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.coordinate-form-card .event-website-wrap .form-group {
  width: 100%;
}

.coordinate-form-card .checkbox-inline {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 6px;
  margin-bottom: 0;
}

.coordinate-form-card .checkbox-inline input {
  width: auto;
  flex-shrink: 0;
}

.coordinate-form-card .vis-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.coordinate-form-card .vis-desc {
  flex: 1;
  min-width: 180px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.coordinate-form-card .vis-pill {
  padding: 6px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.coordinate-form-card .vis-pill:hover {
  border-color: var(--accent-pink);
}

.coordinate-form-card .vis-pill.selected,
.coordinate-form-card .vis-pill:has(input:checked) {
  background: #E3F2FD;
  border-color: #2196F3;
  color: #1976D2;
}

.coordinate-form-card .vis-pill input {
  display: none;
}

/* Payment - simplified layout */
.coordinate-form-card .payment-section-compact {
  padding: 10px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
}

.coordinate-form-card .payment-row-1 {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.coordinate-form-card .payment-type {
  display: flex;
  align-items: center;
  gap: 6px;
}

.coordinate-form-card .payment-cost-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.coordinate-form-card .payment-cost-inline label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  cursor: pointer;
}
```

Use `main.css` variables (`--border-primary`, `--text-secondary`, `--bg-primary`, `--accent-pink`, etc.) and avoid hardcoding colors except where CoordForm3 specifies them (e.g., blue `#2196F3` for selected state).

---

## 4. HTML Structure Migration

### 4.1 Add CSS Link in coordinate.html

In `<head>`, after `main.css`:

```html
<link rel="stylesheet" href="assets/css/main.css">
<link rel="stylesheet" href="assets/css/coordinate-form.css">
```

### 4.2 Add Wrapper Class and Preserve Surrounding Structure

Add class `coordinate-form-card` to the form card. Preserve the `form-intro` div above the form and the `result`/`error` divs below it (outside the form). Do not remove or restructure these elements:

```html
<div class="card form-card coordinate-form-card">
  <div class="form-intro">...</div>
  <form id="coordinateForm">...</form>
  <div id="result" style="display: none;">...</div>
  <div id="error" class="message message-error" style="display: none;"></div>
</div>
```

### 4.3 Replace Form Layout (Preserving All Fields)

Replace the contents of `<form id="coordinateForm">` with the structure below. Remove the two-column layout (`form-columns`, `form-column-left`, `form-column-right`); use a single-column sectioned layout per CoordForm3. Keep every `id`, `name`, `required`, `step`, `min`, `placeholder`, and `data-track-cta` exactly as in the original. Reference `docs/coordinate-forms/CoordForm3.html` for the target visual design.

**Section order and fields (same as CoordForm3):**

1. **Basics:** Planner Name, Coordinator Email, Event Title, Description
2. **When:** From (dateTime), To (endTime), Max Participants
3. **Social:** Event Website + external signup checkbox, Event Instagram, Event Picture
4. **Location:** Location input, validation div, map
5. **Payment:** Free/Paid toggle, Fixed/Split, Amount or Total+Collection
6. **Visibility:** Public/Private pills + dynamic description

**Structure template (field IDs/names must match exactly):**

```html
<form id="coordinateForm">
  <input type="hidden" name="paymentType" id="paymentTypeHidden" value="free">

  <div class="form-section">
    <div class="form-section-head">Basics</div>
    <div class="form-group"><label for="pacerName">Planner Name *</label><input type="text" id="pacerName" name="pacerName" required placeholder="e.g., John Smith"></div>
    <div class="form-group"><label for="coordinatorEmail">Coordinator Email *</label><input type="email" id="coordinatorEmail" name="coordinatorEmail" required placeholder="e.g., coordinator@example.com"><small>Email address for event confirmations and notifications</small></div>
    <div class="form-group"><label for="runTitle">Event Title (Optional)</label><input type="text" id="runTitle" name="runTitle" placeholder="e.g., Morning Beach Event"></div>
    <div class="form-group"><label for="eventDescription">Event Description (Optional)</label><textarea id="eventDescription" name="eventDescription" rows="2" placeholder="Add details about your event..."></textarea></div>
  </div>

  <div class="form-section">
    <div class="form-section-head">When</div>
    <div class="inline-row">
      <div class="when-field form-group">
        <div class="time-label">From</div>
        <input type="datetime-local" id="dateTime" name="dateTime" step="1800" required>
      </div>
      <div class="when-field form-group">
        <div class="time-label">To</div>
        <input type="datetime-local" id="endTime" name="endTime" step="1800">
      </div>
      <div class="when-field when-field-max form-group">
        <div class="time-label">Max Participants</div>
        <input type="number" id="maxParticipants" name="maxParticipants" required min="1" value="10">
      </div>
    </div>
  </div>

  <div class="form-section">
    <div class="form-section-head">Social</div>
    <div class="inline-row">
      <div class="event-website-wrap">
        <div class="form-group">
          <label for="eventWebsite">Event Website (Optional)</label>
          <input type="url" id="eventWebsite" name="eventWebsite" placeholder="e.g., https://example.com">
          <div class="checkbox-inline">
            <input type="checkbox" id="externalSignupEnabled" name="externalSignupEnabled">
            <label for="externalSignupEnabled">Use website for external signups</label>
          </div>
          <small>If checked, attendees complete waiver here then open this link. URL is required.</small>
        </div>
      </div>
      <div class="form-group" style="flex:1;">
        <label for="eventInstagram">Event Instagram (Optional)</label>
        <input type="text" id="eventInstagram" name="eventInstagram" placeholder="e.g., @handle or URL">
      </div>
    </div>
    <div class="form-group">
      <label for="eventPicture">Event Picture (Optional)</label>
      <input type="file" id="eventPicture" name="eventPicture" accept="image/*">
      <div id="picturePreview" style="display: none;">
        <img id="previewImage" src="" alt="Preview">
        <button type="button" id="removePicture" class="button button-secondary">Remove Picture</button>
      </div>
    </div>
  </div>

  <div class="form-section">
    <div class="form-section-head">Location</div>
    <div class="form-group">
      <label for="location">Location *</label>
      <input type="text" id="location" name="location" required placeholder="e.g., 1664 Lincoln Rd, Miami Beach, FL 33139">
      <small>Map appears when location is found</small>
      <div id="locationValidation" style="display: none;"><strong>Validated address:</strong> <span id="validatedAddress"></span></div>
      <div id="locationMap" class="location-map"></div>
    </div>
  </div>

  <div class="form-section">
    <div class="form-section-head">Payment</div>
    <div class="payment-section-compact">
      <div class="payment-row-1">
        <div class="payment-type">
          <span>Free</span>
          <label class="payment-toggle">
            <input type="checkbox" id="paymentTypeToggle" name="paymentTypeToggle" value="paid">
            <span class="payment-toggle-slider"></span>
          </label>
          <span>Paid</span>
        </div>
        <div id="paymentCostTypeOptions" style="display: none;">
          <label class="cost-type-option"><input type="radio" name="paymentMode" value="fixed_amount">Fixed</label>
          <label class="cost-type-option"><input type="radio" name="paymentMode" value="split_cost">Split</label>
        </div>
      </div>
      <div id="paymentDetailsCard" style="display: none;">
        <div id="fixedAmountWrap" class="payment-inline-field" style="display: none;">
          <label><span>Amount</span> <input type="number" id="amountPerPerson" name="amountPerPerson" placeholder="Per person" step="0.01" min="0" class="form-input payment-input"></label>
        </div>
        <div id="splitCostWrap" class="payment-cost-inline" style="display: none;">
          <label><span>Total</span> <input type="number" id="totalEventCostInput" name="totalEventCost" placeholder="Total cost" step="0.01" min="0" class="form-input payment-input"></label>
          <label><span>Collection</span> <input type="date" id="paymentDueDate" name="paymentDueDate" class="payment-input"></label>
        </div>
      </div>
      <div class="payment-inline-helper">The app will display the estimated cost per person based on the current number of sign-ups.</div>
      <div class="payment-disclaimer payment-disclaimer-inline">Kervinapps does not facilitate or process payments. You are responsible for communicating your payment methods and collecting funds from participants directly.</div>
    </div>
  </div>

  <div class="form-section">
    <div class="form-section-head">Event Visibility</div>
    <div class="vis-row">
      <div class="vis-pills">
        <label class="vis-pill radio-card">
          <input type="radio" name="eventVisibility" value="public" checked required>
          Public
        </label>
        <label class="vis-pill radio-card">
          <input type="radio" name="eventVisibility" value="private" required>
          Private
        </label>
      </div>
      <div id="visDesc" class="vis-desc">Shown in calendar, searchable, newsletter emails</div>
    </div>
  </div>

  <button type="submit" class="button button-primary" id="submitButton" data-track-cta="create_event_button_click">Create Event</button>
</form>
```

**Notes:**

- `paymentCostTypeDivider` and `paymentCostTypeLabel` are omitted in the new layout. `coordinate.js` already guards references with `if (el)` so no change is needed.
- Visibility pills must include class `radio-card` so existing `coordinate.js` `updateRadioCardVisualState` can target them.
- `locationValidation` keeps `style="display: none"` and is shown by `coordinate.js` via `style.display`.
- `picturePreview` keeps `style="display: none"`; `coordinate.js` sets `style.display` when a file is selected.

---

## 5. coordinate.js Changes

### 5.1 collectionDateWrap

`coordinate.js` references `collectionDateWrap`. In the new layout it no longer exists (Collection is inside `splitCostWrap`). All uses are guarded with `if (collectionDateWrap)`, so no change is required.

### 5.2 paymentCostTypeDivider and paymentCostTypeLabel

If these elements are removed, ensure every reference is guarded with `if (paymentCostTypeDivider)` and `if (paymentCostTypeLabel)` so null does not cause errors.

### 5.3 Visibility Description (visDesc)

Add logic to update `#visDesc` when visibility changes:

- Public: `"Shown in calendar, searchable, newsletter emails"`
- Private: `"Via signup link only"`

Hook into the same handler that updates radio-card visual state, or add a small listener:

```javascript
const visDesc = document.getElementById('visDesc');
const visRadios = document.querySelectorAll('input[name="eventVisibility"]');
if (visDesc && visRadios.length) {
  function updateVisDesc() {
    const c = document.querySelector('input[name="eventVisibility"]:checked');
    visDesc.textContent = c?.value === 'public' ? 'Shown in calendar, searchable, newsletter emails' : 'Via signup link only';
  }
  visRadios.forEach(r => r.addEventListener('change', updateVisDesc));
  updateVisDesc();
}
```

### 5.4 Radio Card / Pill Compatibility

If `updateRadioCardVisualState` uses `querySelectorAll('.radio-card')`, ensure the visibility pills have class `radio-card` (as in the template above). Then no further JS changes are needed for the pills.

---

## 6. main.css Adjustments

Avoid editing global form rules. Use the new `coordinate-form.css` for coordinate-specific layout.

If any shared utilities (e.g. `.payment-toggle`, `.payment-disclaimer`) are needed, keep them in `main.css` and scope overrides in `coordinate-form.css` with `.coordinate-form-card`.

---

## 7. Verification Checklist

Before considering the migration complete:

- [ ] All fields in the table in Section 2 are present and IDs/names unchanged
- [ ] Form submits and payload matches previous behavior (check network tab)
- [ ] Map initializes and updates on location input
- [ ] Picture preview shows and "Remove Picture" works
- [ ] Payment toggle: Free/Paid, Fixed/Split, Amount, Total, Collection behave correctly
- [ ] Visibility description updates when switching Public/Private
- [ ] Mobile layout remains usable (flex-wrap, min-width)
- [ ] User Guides collapsible section still works
- [ ] Header, hero, and navigation unchanged

---

## 8. Rollback

If issues occur:

1. Remove the `coordinate-form.css` link from `coordinate.html`
2. Remove the `coordinate-form-card` class
3. Restore the original form HTML from version control
4. Revert any `coordinate.js` edits

---

## 9. Summary

| Area | Action |
|------|--------|
| CSS | New `assets/css/coordinate-form.css`, scoped under `.coordinate-form-card` |
| HTML | Restructure form into sections (Basics, When, Social, Location, Payment, Visibility), preserve all IDs/names |
| JS | Add visibility description update; ensure null-safe handling for removed elements |
| DRY | Reuse `main.css` variables and utilities; coordinate-specific rules only in `coordinate-form.css` |
| Modularity | Coordinate form logic and styles isolated from other pages |
