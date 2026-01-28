# Timezone Tracking and Validation Migration Guide - Runs Application (gayrunclub)

This guide provides comprehensive step-by-step instructions for an AI agent to migrate timezone tracking, optional contact field validation, calendar invite fixes, and related improvements from the EventPlan application to the Runs application (gayrunclub). This migration was implemented in EventPlan v6.1.0.

## Key Differences Between Applications

| Aspect | EventPlan | Runs (gayrunclub) |
|--------|-----------|-------------------|
| Database Table | `ep_events` | `runs` |
| Signups Table | `ep_signups` | `signups` |
| Waivers Table | `ep_waivers` | `waivers` |
| Name Field | `planner_name` / `plannerName` | `pacer_name` / `pacerName` |
| Coordinator Field | `coordinator_email` | `coordinator_email` (same) |
| App Name | EventPlan | Gay Run Club |

## Migration Overview

This migration includes:
1. **Timezone Tracking**: Capture and store user's timezone when creating events
2. **Optional Contact Fields**: Make phone/email optional but require at least one
3. **Waiver Communication Consent**: Update waiver text to include communication consent
4. **Calendar Invite Timezone Fixes**: Fix calendar links in emails to use event timezone
5. **Datetime Parsing Fixes**: Correct MySQL DATETIME to ISO UTC conversion
6. **Redirect Improvements**: Fix redirect after signup to event confirmation page

## Migration Checklist

- [ ] 1. Database Migrations (Timezone and Phone Nullable)
- [ ] 2. Update Schema File
- [ ] 3. Update Database Client (Timezone and Nullable Fields)
- [ ] 4. Update Frontend: Coordinate Page (Timezone Capture)
- [ ] 5. Update Frontend: Signup Page (Optional Fields and Waiver)
- [ ] 6. Update Frontend: Event Display Pages (Timezone Display)
- [ ] 7. Update Frontend: Calendar Utilities (Timezone-Aware Links)
- [ ] 8. Update Email Templates (Timezone-Aware Calendar Links)
- [ ] 9. Update Netlify Functions (Timezone and Validation)
- [ ] 10. Update Server.js (Timezone and Validation)
- [ ] 11. Test and Verify

---

## Step 1: Database Migrations

### File 1: Create `lib/migration-add-timezone.sql`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/lib/migration-add-timezone.sql`

**Content:**
```sql
-- Migration: Add timezone column to runs table
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration adds a timezone field to store the IANA timezone identifier
-- (e.g., "America/New_York", "America/Los_Angeles") for the event.
-- This ensures that event times are displayed consistently across different
-- user timezones and in emails/calendar invites.

-- Add timezone column (VARCHAR(50), NULL initially to allow existing records)
ALTER TABLE runs
ADD COLUMN timezone VARCHAR(50) NULL AFTER date_time;

-- Note: Existing records will have NULL timezone. Consider backfilling if needed.
-- The application code handles NULL timezones by falling back to browser/system timezone.
```

**Action:** Create this file. Run in PlanetScale development branch, then promote to main.

**CRITICAL NOTES:**
- Table name is `runs` (NOT `ep_events`)
- Column is added AFTER `date_time` column
- Column is NULL to allow existing records

---

### File 2: Create `lib/migration-make-phone-nullable.sql`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/lib/migration-make-phone-nullable.sql`

**Content:**
```sql
-- Migration: Make phone fields nullable in signups and waivers tables
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration makes phone fields nullable to allow signups with email only.
-- The application will require at least one of phone or email to be provided,
-- but neither is strictly required by the database schema.

-- Make phone nullable in signups table
ALTER TABLE signups
MODIFY COLUMN phone VARCHAR(20) NULL;

-- Make participant_phone nullable in waivers table
ALTER TABLE waivers
MODIFY COLUMN participant_phone VARCHAR(20) NULL;

-- Note: Application-level validation ensures at least one of phone or email is provided.
```

**Action:** Create this file. Run in PlanetScale development branch, then promote to main.

**CRITICAL NOTES:**
- Table names are `signups` and `waivers` (NOT `ep_signups` and `ep_waivers`)
- Field name in waivers is `participant_phone` (NOT `phone`)

---

## Step 2: Update Schema File

### File: `lib/schema.sql`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/lib/schema.sql`

**Action 1: Add timezone column to CREATE TABLE runs**

Find the `CREATE TABLE runs` statement and update it to include the timezone column:

**Before:**
```sql
CREATE TABLE runs (
  id VARCHAR(7) PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  location TEXT NOT NULL,
  coordinates JSON,
  pacer_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  date_time DATETIME NOT NULL,
  max_participants INT NOT NULL,
  -- ... other columns ...
);
```

**After:**
```sql
CREATE TABLE runs (
  id VARCHAR(7) PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  location TEXT NOT NULL,
  coordinates JSON,
  pacer_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  date_time DATETIME NOT NULL,
  timezone VARCHAR(50),
  max_participants INT NOT NULL,
  -- ... other columns ...
);
```

**Action 2: Make phone fields nullable in CREATE TABLE statements**

Find the `CREATE TABLE signups` statement:

**Before:**
```sql
CREATE TABLE signups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_id VARCHAR(7) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  -- ... other columns ...
);
```

**After:**
```sql
CREATE TABLE signups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_id VARCHAR(7) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  -- ... other columns ...
);
```

Find the `CREATE TABLE waivers` statement:

**Before:**
```sql
CREATE TABLE waivers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_id VARCHAR(7) NOT NULL,
  signup_id BIGINT NOT NULL,
  participant_name VARCHAR(255) NOT NULL,
  participant_phone VARCHAR(20) NOT NULL,
  -- ... other columns ...
);
```

**After:**
```sql
CREATE TABLE waivers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_id VARCHAR(7) NOT NULL,
  signup_id BIGINT NOT NULL,
  participant_name VARCHAR(255) NOT NULL,
  participant_phone VARCHAR(20),
  -- ... other columns ...
);
```

**CRITICAL NOTES:**
- Remove `NOT NULL` constraint from `phone` in `signups`
- Remove `NOT NULL` constraint from `participant_phone` in `waivers`
- Field name in waivers is `participant_phone` (NOT `phone`)

---

## Step 3: Update Database Client

### File: `lib/databaseClient.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/lib/databaseClient.js`

**Action 1: Update `runs.create` to include timezone**

Find the `runs.create` function. Locate the INSERT query and VALUES array.

**Before:**
```javascript
const query = `
  INSERT INTO runs (
    id, uuid, location, coordinates, pacer_name, title, date_time, max_participants, status, ...
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ...)
`;
await executeQuery(query, [
  // ... existing values ...
  dateTime,
  maxParticipants,
  // ... other values ...
]);
```

**After:**
```javascript
const query = `
  INSERT INTO runs (
    id, uuid, location, coordinates, pacer_name, title, date_time, timezone, max_participants, status, ...
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ...)
`;
await executeQuery(query, [
  // ... existing values ...
  dateTime,
  runData.timezone || null, // Added timezone
  maxParticipants,
  // ... other values ...
]);
```

**Action 2: Update `runs.getById` and `runs.getAll` to include timezone in SELECT and handle DATETIME conversion**

Find the SELECT query in `runs.getById`:

**Before:**
```javascript
const query = `
  SELECT
    id, uuid, location, coordinates, pacer_name, title,
    date_time as dateTime,
    max_participants as maxParticipants,
    -- ... other columns ...
  FROM runs
  WHERE id = ?
`;
```

**After:**
```javascript
const query = `
  SELECT
    id, uuid, location, coordinates, pacer_name, title,
    date_time as dateTime,
    timezone,
    max_participants as maxParticipants,
    -- ... other columns ...
  FROM runs
  WHERE id = ?
`;
```

**CRITICAL: Add DATETIME to ISO UTC conversion after the query execution:**

After the query executes and returns a `run` object, add this conversion:

```javascript
// Convert MySQL DATETIME string to ISO string with UTC timezone
// MySQL returns DATETIME as "YYYY-MM-DD HH:MM:SS" without timezone info
// We stored it as UTC, so we need to append 'Z' to make JavaScript interpret it as UTC
if (run.dateTime && typeof run.dateTime === 'string' && !run.dateTime.includes('T')) {
  // MySQL DATETIME format: "YYYY-MM-DD HH:MM:SS"
  // Convert to ISO format: "YYYY-MM-DDTHH:MM:SSZ"
  run.dateTime = run.dateTime.replace(' ', 'T') + 'Z';
}
```

**Apply the same changes to `runs.getAll`** (include `timezone` in SELECT and add the DATETIME conversion in the map function).

**Action 3: Update `signups.create` to store NULL for empty phone/email**

Find the `signups.create` function:

**Before:**
```javascript
const result = await executeQuery(query, [
  signupData.runId,
  signupData.name,
  signupData.phone,
  signupData.email || null,
  // ... other values ...
]);
```

**After:**
```javascript
const result = await executeQuery(query, [
  signupData.runId,
  signupData.name,
  signupData.phone || null, // Store null if phone is empty
  signupData.email || null, // Store null if email is empty
  // ... other values ...
]);
```

**Action 4: Update `waivers.create` to store NULL for empty participantPhone**

Find the `waivers.create` function:

**Before:**
```javascript
const result = await executeQuery(query, [
  waiverData.runId,
  waiverData.signupId,
  waiverData.participantName,
  waiverData.participantPhone,
  // ... other values ...
]);
```

**After:**
```javascript
const result = await executeQuery(query, [
  waiverData.runId,
  waiverData.signupId,
  waiverData.participantName,
  waiverData.participantPhone || null, // Store null if participantPhone is empty
  // ... other values ...
]);
```

**CRITICAL NOTES:**
- Table names are `runs`, `signups`, `waivers` (NOT `ep_events`, `ep_signups`, `ep_waivers`)
- Field names use `pacer_name` (NOT `planner_name`) in SQL queries
- The DATETIME conversion is CRITICAL - MySQL DATETIME strings must be converted to ISO format with 'Z' suffix
- Use `|| null` to ensure empty strings become NULL in database

---

## Step 4: Update Frontend - Coordinate Page

### File: `assets/js/coordinate.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/assets/js/coordinate.js`

**Action 1: Capture timezone and convert datetime-local to ISO string**

Find the form submission handler where `formData` is created:

**Before:**
```javascript
const formData = {
  location: locationInput.value.trim(),
  dateTime: dateTimeInput.value, // datetime-local input value
  maxParticipants: maxParticipantsValue,
  // ... other fields ...
};
```

**After:**
```javascript
// Capture user's timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const formData = {
  location: locationInput.value.trim(),
  dateTime: new Date(dateTimeInput.value).toISOString(), // Convert datetime-local to ISO string
  timezone: userTimezone, // Added timezone
  maxParticipants: maxParticipantsValue,
  // ... other fields ...
};
```

**Action 2: Update `formatDateForWhatsApp` to accept timezone parameter**

Find the `formatDateForWhatsApp` function:

**Before:**
```javascript
function formatDateForWhatsApp(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const formatted = date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return formatted.replace(', ', ' at ') + ' EST';
}
```

**After:**
```javascript
function formatDateForWhatsApp(dateString, timezone = null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };
  if (timezone) {
    options.timeZone = timezone;
  }
  const formatted = date.toLocaleString('en-US', options);
  return formatted.replace(', ', ' at ');
}
```

**Action 3: Update `generateWhatsAppMessage` to pass timezone**

Find the `generateWhatsAppMessage` function:

**Before:**
```javascript
function generateWhatsAppMessage(run, signupLink) {
  // ...
  const dateFormatted = formatDateForWhatsApp(run.dateTime);
  // ...
}
```

**After:**
```javascript
function generateWhatsAppMessage(run, signupLink, timezone = null) {
  // ...
  const dateFormatted = formatDateForWhatsApp(run.dateTime, timezone);
  // ...
}
```

**CRITICAL NOTES:**
- `datetime-local` input values MUST be converted to ISO strings using `new Date(dateTimeLocal).toISOString()`
- Timezone is captured using `Intl.DateTimeFormat().resolvedOptions().timeZone`
- WhatsApp date formatting now uses event timezone and includes timezone abbreviation dynamically

---

## Step 5: Update Frontend - Signup Page

### File 1: `signup.html`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/signup.html`

**Action 1: Update phone field label and help text**

Find the phone input field and its label:

**Before:**
```html
<label for="phone">Phone Number</label>
<input type="tel" id="phone" name="phone" required placeholder="Enter your phone number">
```

**After:**
```html
<label for="phone">
    Phone Number
    <span class="info-icon" title="We will use your phone number for confirmations and event updates via text or WhatsApp">
        <!-- SVG info icon if available -->
    </span>
</label>
<input type="tel" id="phone" name="phone" placeholder="Enter your phone number">
<small style="display: block; margin-top: 4px; color: var(--text-gray); font-size: 14px;">At least one of phone or email is required. We will use this for confirmations and event updates.</small>
```

**Action 2: Update email field label and help text**

Find the email input field and its label:

**Before:**
```html
<label for="email">Email Address</label>
<input type="email" id="email" name="email" placeholder="Enter your email address">
```

**After:**
```html
<label for="email">Email Address</label>
<input type="email" id="email" name="email" placeholder="Enter your email address">
<small style="display: block; margin-top: 4px; color: var(--text-gray); font-size: 14px;">At least one of phone or email is required. We will use this for confirmations and event updates.</small>
```

**Action 3: Update quick guide instructions**

Find any quick guide sections that mention phone/email requirements and update them to say "at least one of phone or email is required".

**CRITICAL NOTES:**
- Remove `required` attribute from phone input
- Add help text explaining "at least one of phone or email is required"
- Keep email field as-is (no required attribute)

---

### File 2: `assets/js/signup.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/assets/js/signup.js`

**Action 1: Update `validateForm` to require at least one of phone/email**

Find the `validateForm` function:

**Before:**
```javascript
function validateForm() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const waiver = document.getElementById('waiverAccepted').checked;
  const submitButton = document.getElementById('submitButton');

  if (name && phone && waiver) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
}
```

**After:**
```javascript
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
```

**Action 2: Add email input listener**

Find where event listeners are added:

**Before:**
```javascript
document.getElementById('name').addEventListener('input', validateForm);
document.getElementById('phone').addEventListener('input', validateForm);
document.getElementById('waiverAccepted').addEventListener('change', validateForm);
```

**After:**
```javascript
document.getElementById('name').addEventListener('input', validateForm);
document.getElementById('phone').addEventListener('input', validateForm);
document.getElementById('email').addEventListener('input', validateForm); // Added
document.getElementById('waiverAccepted').addEventListener('change', validateForm);
```

**Action 3: Update form submission validation**

Find the form submission handler:

**Before:**
```javascript
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  // ... validation ...
  if (!phone) {
    // error handling
    return;
  }
  // ... rest of submission ...
});
```

**After:**
```javascript
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  // ... other field reads ...
  
  if (!phone && !email) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = 'Please provide at least one of phone number or email address';
    errorDiv.style.display = 'block';
    return;
  }
  // ... rest of submission ...
});
```

**Action 4: Update waiver text to include communication consent**

Find where the waiver text is defined (may be in HTML or JavaScript):

**Before:**
```javascript
// Waiver text without communication consent section
```

**After:**
```javascript
const waiverText = `
  // ... existing waiver sections ...
  
  <h4>8. COMMUNICATION AND DISTRIBUTION CONSENT</h4>
  <p>By signing this waiver, I <strong>CONSENT TO RECEIVE COMMUNICATIONS</strong> related to my participation in events organized by the Club via <strong>TEXT MESSAGE (SMS), WHATSAPP, AND/OR EMAIL</strong> at the contact information I provide during registration. I understand that these communications may include, but are not limited to, event confirmations, updates, changes, reminders, and other event-related information. I acknowledge that <strong>STANDARD MESSAGING AND DATA RATES MAY APPLY</strong> for text messages and WhatsApp communications, and I am <strong>RESPONSIBLE FOR ANY SUCH CHARGES</strong> from my mobile carrier. I understand that I may receive communications via text message, WhatsApp, and/or email, and I consent to being added to the official Event Planner distribution list for communications. My consent to receive these communications is <strong>VOLUNTARY</strong>, and I understand that I can withdraw my consent at any time by contacting the Club.</p>
  
  // ... rest of waiver ...
`;
```

**Action 5: Update date display to use event timezone**

Find where `runDateTime` is displayed:

**Before:**
```javascript
const runDate = new Date(run.dateTime);
document.getElementById('runDateTime').textContent = runDate.toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
```

**After:**
```javascript
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
```

**Action 6: Add redirect after successful signup**

Find the success handling in the form submission:

**Before:**
```javascript
// After successful signup
// May just clear form or show success message
```

**After:**
```javascript
// Redirect to event page with success parameter
// Use replace() to prevent back button from going to signup page
const redirectUrl = `/event.html?id=${runId}&success=true`;
console.log('[SIGNUP] Redirecting to:', redirectUrl);
window.location.replace(redirectUrl);
```

**CRITICAL NOTES:**
- Validation must check `phone || email` (at least one required)
- Use `window.location.replace()` not `window.location.href` for redirect (prevents back button issues)
- Waiver communication consent section is required by law in many jurisdictions

---

## Step 6: Update Frontend - Event Display Pages

### File 1: `assets/js/event.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/assets/js/event.js`

**Action: Update date display to use event timezone**

Find where the event date/time is displayed:

**Before:**
```javascript
const eventDate = new Date(event.dateTime);
document.getElementById('eventDateTime').textContent = eventDate.toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
```

**After:**
```javascript
const eventDate = new Date(event.dateTime);
const timezone = event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
document.getElementById('eventDateTime').textContent = eventDate.toLocaleString('en-US', {
  timeZone: timezone,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
```

---

### File 2: `assets/js/manage.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/assets/js/manage.js`

**Action 1: Update date display to use event timezone**

Find where `runDateTime` is displayed:

**Before:**
```javascript
const runDate = new Date(run.dateTime);
document.getElementById('runDateTime').textContent = runDate.toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
```

**After:**
```javascript
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
```

**Action 2: Update `formatPhoneNumber` to handle null values**

Find the `formatPhoneNumber` function:

**Before:**
```javascript
function formatPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, '');
  // ... formatting logic ...
}
```

**After:**
```javascript
function formatPhoneNumber(phone) {
  if (!phone) return '-'; // Handle null/undefined phone
  const digits = phone.replace(/\D/g, '');
  // ... formatting logic ...
}
```

**Action 3: Update WhatsApp message functions to use timezone**

Update `formatDateForWhatsApp` and `generateWhatsAppMessage` similar to Step 4, Action 2 and 3.

---

### File 3: `assets/js/admin.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/assets/js/admin.js`

**Action 1: Update date display to use event timezone**

Find where dates are formatted in the runs list:

**Before:**
```javascript
const date = new Date(run.dateTime);
const formattedDate = date.toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
```

**After:**
```javascript
const date = new Date(run.dateTime);
const timezone = run.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
const formattedDate = date.toLocaleString('en-US', {
  timeZone: timezone,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});
```

**Action 2: Update `formatPhoneNumber` to handle null values**

Same as Step 6, File 2, Action 2.

**Action 3: Update WhatsApp message functions to use timezone**

Same as Step 6, File 2, Action 3.

---

## Step 7: Update Frontend - Calendar Utilities

### File: `assets/js/calendar-utils.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/assets/js/calendar-utils.js`

**Action 1: Update `formatDateForCalendarDescription` to accept timezone**

Find the function:

**Before:**
```javascript
function formatDateForCalendarDescription(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const formatted = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return formatted.replace(', ', ' at ');
}
```

**After:**
```javascript
function formatDateForCalendarDescription(dateString, timezone = null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short' // Include timezone abbreviation
  };
  if (timezone) {
    options.timeZone = timezone;
  }
  const formatted = date.toLocaleString('en-US', options);
  return formatted.replace(', ', ' at ');
}
```

**Action 2: Update `formatDateForGoogleCalendar` to accept timezone and use Intl.DateTimeFormat**

Find the function:

**Before:**
```javascript
function formatDateForGoogleCalendar(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}
```

**After:**
```javascript
function formatDateForGoogleCalendar(date, timezone = null) {
  if (!date) return '';
  const d = new Date(date);
  
  // Use Intl.DateTimeFormat to get date components in the specified timezone
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone || undefined
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(d);
  
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hours = parts.find(p => p.type === 'hour').value;
  const minutes = parts.find(p => p.type === 'minute').value;
  const seconds = parts.find(p => p.type === 'second').value;
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}
```

**Action 3: Update `formatCalendarDescription` to use timezone**

Find the function and update the call to `formatDateForCalendarDescription`:

**Before:**
```javascript
function formatCalendarDescription(event) {
  // ...
  const dateFormatted = formatDateForCalendarDescription(event.dateTime);
  // ...
}
```

**After:**
```javascript
function formatCalendarDescription(event) {
  // ...
  const eventTimezone = event.timezone || null;
  const dateFormatted = formatDateForCalendarDescription(event.dateTime, eventTimezone);
  // ...
}
```

**Action 4: Update `generateGoogleCalendarLink` to pass timezone**

Find the function:

**Before:**
```javascript
function generateGoogleCalendarLink(event) {
  // ...
  const startTime = formatDateForGoogleCalendar(startDate);
  const endTime = formatDateForGoogleCalendar(endDate);
  // ...
}
```

**After:**
```javascript
function generateGoogleCalendarLink(event) {
  // ...
  const eventTimezone = event.timezone || null;
  const startTime = formatDateForGoogleCalendar(startDate, eventTimezone);
  const endTime = formatDateForGoogleCalendar(endDate, eventTimezone);
  // ...
}
```

**CRITICAL NOTES:**
- `formatDateForGoogleCalendar` MUST use `Intl.DateTimeFormat` with `formatToParts` to correctly extract date components in the specified timezone
- Using `getFullYear()`, `getMonth()`, etc. will use browser timezone, which is WRONG
- iCal format uses UTC (which is correct), so `formatDateForICal` does NOT need timezone parameter

---

## Step 8: Update Email Templates

### File: `lib/emailTemplates.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/lib/emailTemplates.js`

**Action 1: Update `formatDateForGoogleCalendar` to accept timezone**

Find the function (same pattern as Step 7, Action 2):

**Before:**
```javascript
function formatDateForGoogleCalendar(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  // ... rest using getFullYear, getMonth, etc.
}
```

**After:**
```javascript
function formatDateForGoogleCalendar(date, timezone = null) {
  if (!date) return '';
  const d = new Date(date);
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone || undefined
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(d);
  
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hours = parts.find(p => p.type === 'hour').value;
  const minutes = parts.find(p => p.type === 'minute').value;
  const seconds = parts.find(p => p.type === 'second').value;
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}
```

**Action 2: Update `generateGoogleCalendarLink` to pass timezone**

Find the function:

**Before:**
```javascript
function generateGoogleCalendarLink(run, signupLink) {
  // ...
  const startTime = formatDateForGoogleCalendar(startDate);
  const endTime = formatDateForGoogleCalendar(endDate);
  // ...
}
```

**After:**
```javascript
function generateGoogleCalendarLink(run, signupLink) {
  // ...
  const eventTimezone = run.timezone || null;
  const startTime = formatDateForGoogleCalendar(startDate, eventTimezone);
  const endTime = formatDateForGoogleCalendar(endDate, eventTimezone);
  // ...
}
```

**Action 3: Update `formatDateForWhatsApp` to accept timezone**

Find the function:

**Before:**
```javascript
function formatDateForWhatsApp(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const formatted = date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return formatted.replace(', ', ' at ') + ' EST';
}
```

**After:**
```javascript
function formatDateForWhatsApp(dateString, timezone = null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };
  if (timezone) {
    options.timeZone = timezone;
  }
  const formatted = date.toLocaleString('en-US', options);
  return formatted.replace(', ', ' at ');
}
```

**Action 4: Update `formatCalendarDescription` to use timezone**

Find the function:

**Before:**
```javascript
function formatCalendarDescription(run, signupLink) {
  // ...
  const dateFormatted = formatDateForWhatsApp(run.dateTime);
  // ...
}
```

**After:**
```javascript
function formatCalendarDescription(run, signupLink) {
  // ...
  const eventTimezone = run.timezone || null;
  const dateFormatted = formatDateForWhatsApp(run.dateTime, eventTimezone);
  // ...
}
```

**Action 5: Update `generateWhatsAppMessage` to use timezone**

Find the function:

**Before:**
```javascript
function generateWhatsAppMessage(run, signupLink) {
  // ...
  const dateFormatted = formatDateForWhatsApp(run.dateTime);
  // ...
}
```

**After:**
```javascript
function generateWhatsAppMessage(run, signupLink) {
  // ...
  const eventTimezone = run.timezone || null;
  const dateFormatted = formatDateForWhatsApp(run.dateTime, eventTimezone);
  // ...
}
```

**CRITICAL NOTES:**
- Email templates have their own calendar link generation functions (separate from frontend `calendar-utils.js`)
- Both must be updated to use timezone
- iCal format uses UTC (correct), so `formatDateForICal` does NOT need timezone parameter

---

## Step 9: Update Netlify Functions

### File 1: `netlify/functions/runs-create.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/netlify/functions/runs-create.js`

**Action 1: Extract timezone from request body**

Find where the request body is destructured:

**Before:**
```javascript
const {
  location, coordinates, pacerName, title, dateTime, maxParticipants,
  // ... other fields ...
} = body;
```

**After:**
```javascript
const {
  location, coordinates, pacerName, title, dateTime, timezone, maxParticipants,
  // ... other fields ...
} = body;
```

**Action 2: Pass timezone to runs.create**

Find where `runs.create` is called:

**Before:**
```javascript
await runs.create({
  // ... existing fields ...
  dateTime: dateTime,
  maxParticipants: parseInt(maxParticipants),
  // ... other fields ...
});
```

**After:**
```javascript
await runs.create({
  // ... existing fields ...
  dateTime: dateTime,
  timezone: timezone || null, // Added timezone
  maxParticipants: parseInt(maxParticipants),
  // ... other fields ...
});
```

**Action 3: Include timezone in runForEmail object**

Find where `runForEmail` or similar object is created for email templates:

**Before:**
```javascript
const runForEmail = {
  ...runData,
  pacerName: trimmedPacerName,
  location: trimmedLocation,
};
```

**After:**
```javascript
const runForEmail = {
  ...runData,
  pacerName: trimmedPacerName,
  location: trimmedLocation,
  timezone: timezone || null, // Added timezone
};
```

---

### File 2: `netlify/functions/runs-signup.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/netlify/functions/runs-signup.js`

**Action 1: Update validation to require at least one of phone/email**

Find the validation logic:

**Before:**
```javascript
if (!name || !phone || !waiverAccepted) {
  return jsonResponse(400, { success: false, error: 'Name, phone, and waiver acceptance are required' });
}
```

**After:**
```javascript
// At least one of phone or email must be provided
const hasContactInfo = phone || email;

if (!name || !hasContactInfo || !waiverAccepted) {
  return jsonResponse(400, { success: false, error: 'Name, at least one of phone or email, and waiver acceptance are required' });
}
```

**Action 2: Update signups.create to store NULL for empty phone/email**

Find where `signups.create` is called:

**Before:**
```javascript
createdSignup = await signups.create({
  runId: runId,
  name: name.trim(),
  phone: phone.trim(),
  email: email ? email.trim() : null,
  // ... other fields ...
});
```

**After:**
```javascript
createdSignup = await signups.create({
  runId: runId,
  name: name.trim(),
  phone: phone ? phone.trim() : null, // Store null if phone is empty
  email: email ? email.trim() : null, // Store null if email is empty
  // ... other fields ...
});
```

**Action 3: Update waivers.create to store NULL for empty participantPhone**

Find where `waivers.create` is called:

**Before:**
```javascript
await waivers.create({
  runId: runId,
  signupId: createdSignup.id,
  participantName: name.trim(),
  participantPhone: phone.trim(),
  // ... other fields ...
});
```

**After:**
```javascript
await waivers.create({
  runId: runId,
  signupId: createdSignup.id,
  participantName: name.trim(),
  participantPhone: phone ? phone.trim() : null, // Store null if phone is empty
  // ... other fields ...
});
```

**CRITICAL NOTES:**
- Table names are `runs`, `signups`, `waivers` (NOT `ep_events`, etc.)
- Field names use `pacerName` (NOT `plannerName`)
- Use `? ... : null` pattern to store NULL for empty strings

---

## Step 10: Update Server.js

### File: `server.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/server.js`

**Action 1: Extract timezone from request body (event creation)**

Find the event creation route:

**Before:**
```javascript
const { location, coordinates, pacerName, title, dateTime, maxParticipants, ... } = req.body;
```

**After:**
```javascript
const { location, coordinates, pacerName, title, dateTime, timezone, maxParticipants, ... } = req.body;
```

**Action 2: Pass timezone to runs.create (event creation)**

Find where `runs.create` is called:

**Before:**
```javascript
const createData = {
  // ... existing fields ...
  dateTime: dateTime,
  maxParticipants: parseInt(maxParticipants),
  // ... other fields ...
};
await runs.create(createData);
```

**After:**
```javascript
const createData = {
  // ... existing fields ...
  dateTime: dateTime,
  timezone: timezone || null, // Added timezone
  maxParticipants: parseInt(maxParticipants),
  // ... other fields ...
};
await runs.create(createData);
```

**Action 3: Include timezone in runForEmail object (event creation)**

Same as Step 9, File 1, Action 3.

**Action 4: Update signup route validation and data storage**

Find the signup route (`/api/runs/:runId/signup`):

**Before:**
```javascript
// Validation
if (!name || !phone || !waiverAccepted) {
  return res.status(400).json({ error: 'Name, phone, and waiver acceptance are required' });
}

// Create signup
createdSignup = await signups.create({
  name: name.trim(),
  phone: phone.trim(),
  email: email ? email.trim() : null,
  // ...
});

// Create waiver
await waivers.create({
  participantName: name.trim(),
  participantPhone: phone.trim(),
  // ...
});
```

**After:**
```javascript
// Validation - at least one of phone or email required
const hasContactInfo = phone || email;
if (!name || !hasContactInfo || !waiverAccepted) {
  return res.status(400).json({ error: 'Name, at least one of phone or email, and waiver acceptance are required' });
}

// Create signup
createdSignup = await signups.create({
  name: name.trim(),
  phone: phone ? phone.trim() : null, // Store null if phone is empty
  email: email ? email.trim() : null, // Store null if email is empty
  // ...
});

// Create waiver
await waivers.create({
  participantName: name.trim(),
  participantPhone: phone ? phone.trim() : null, // Store null if phone is empty
  // ...
});
```

**CRITICAL NOTES:**
- Field names use `pacerName` (NOT `plannerName`)
- Use `? ... : null` pattern consistently

---

## Step 11: Test and Verify

### Testing Checklist

1. **Database Migrations**
   - [ ] Run timezone migration in PlanetScale development branch
   - [ ] Run phone nullable migration in PlanetScale development branch
   - [ ] Verify columns exist and have correct types
   - [ ] Promote migrations to main branch

2. **Timezone Tracking**
   - [ ] Create an event and verify timezone is captured and stored
   - [ ] Verify event date displays correctly in event's timezone on event page
   - [ ] Verify event date displays correctly in event's timezone on manage page
   - [ ] Verify event date displays correctly in event's timezone on admin page
   - [ ] Verify event date displays correctly in event's timezone on signup page

3. **Optional Contact Fields**
   - [ ] Sign up with phone only (no email) - should work
   - [ ] Sign up with email only (no phone) - should work
   - [ ] Sign up with both phone and email - should work
   - [ ] Try to sign up with neither phone nor email - should show error
   - [ ] Verify phone displays as "-" in admin/manage pages when NULL

4. **Waiver Communication Consent**
   - [ ] Verify waiver text includes communication consent section
   - [ ] Verify waiver text mentions text/WhatsApp/email communications

5. **Calendar Invites**
   - [ ] Verify Google Calendar link in coordinator confirmation email uses correct timezone
   - [ ] Verify Google Calendar link in signup confirmation email uses correct timezone
   - [ ] Verify Google Calendar link on event page uses correct timezone
   - [ ] Verify Google Calendar link on manage page uses correct timezone
   - [ ] Verify iCal download works correctly (uses UTC, which is correct)

6. **Email Templates**
   - [ ] Verify coordinator confirmation email shows date in event's timezone
   - [ ] Verify signup confirmation email shows date in event's timezone
   - [ ] Verify WhatsApp messages use event's timezone

7. **Redirect After Signup**
   - [ ] Sign up for an event and verify redirect to event page with success parameter
   - [ ] Verify back button doesn't return to signup page

---

## Lessons Learned

### Critical Issues to Avoid

1. **MySQL DATETIME to JavaScript Date Conversion**
   - **Problem**: MySQL DATETIME strings (e.g., "2026-01-13 20:30:00") are timezone-agnostic but represent UTC. JavaScript's `Date` constructor interprets them as local time if not explicitly marked as UTC.
   - **Solution**: Append 'Z' to the DATETIME string to force UTC interpretation: `run.dateTime.replace(' ', 'T') + 'Z'`
   - **Where**: Must be done in `databaseClient.js` in `runs.getById` and `runs.getAll` after query execution
   - **Impact**: Without this, calendar invites and date displays will be off by the server's timezone offset

2. **datetime-local Input to ISO String Conversion**
   - **Problem**: HTML5 `datetime-local` inputs return values like "2026-01-13T17:30" (no timezone). If sent as-is, the backend interprets it incorrectly.
   - **Solution**: Convert to ISO string on frontend: `new Date(dateTimeInput.value).toISOString()`
   - **Where**: In `coordinate.js` before sending to backend
   - **Impact**: Without this, events created at 5:30 PM local time might be stored as 5:30 PM UTC, causing 5+ hour offsets

3. **Google Calendar Date Formatting Must Use Intl.DateTimeFormat**
   - **Problem**: Using `getFullYear()`, `getMonth()`, etc. extracts date components in browser's local timezone, not the event's timezone.
   - **Solution**: Use `Intl.DateTimeFormat` with `formatToParts()` to extract components in the specified timezone
   - **Where**: In `formatDateForGoogleCalendar` functions (both frontend `calendar-utils.js` and backend `emailTemplates.js`)
   - **Impact**: Calendar invites will show wrong times (e.g., 8:30 PM instead of 3:30 PM)

4. **Email Templates Have Separate Calendar Functions**
   - **Problem**: Email templates (`lib/emailTemplates.js`) have their own `generateGoogleCalendarLink` and related functions, separate from frontend `calendar-utils.js`. Both must be updated.
   - **Solution**: Update both locations when fixing calendar timezone issues
   - **Where**: Both `lib/emailTemplates.js` and `assets/js/calendar-utils.js`
   - **Impact**: Calendar links in emails will have wrong times even if frontend links are correct

5. **Store NULL, Not Empty Strings**
   - **Problem**: Database columns are nullable, but application code might store empty strings ("") instead of NULL.
   - **Solution**: Use `phone ? phone.trim() : null` pattern (not `phone.trim() || null` which converts empty string to null after trim)
   - **Where**: In `signups.create` and `waivers.create` calls in backend
   - **Impact**: Database will have empty strings instead of NULL, causing issues with `IS NULL` checks and display logic

6. **Table and Field Name Differences**
   - **Problem**: Runs app uses `runs`, `signups`, `waivers` tables and `pacer_name`/`pacerName` fields, while EventPlan uses `ep_events`, `ep_signups`, `ep_waivers` and `planner_name`/`plannerName`.
   - **Solution**: Always verify table and field names match the target application's schema
   - **Where**: All SQL queries and database client code
   - **Impact**: Queries will fail if wrong table/field names are used

7. **Validation Must Match on Frontend and Backend**
   - **Problem**: Frontend validation might allow phone-only, but backend requires email, causing user confusion.
   - **Solution**: Ensure both frontend and backend validate "at least one of phone or email"
   - **Where**: `signup.js` (frontend) and `runs-signup.js` / `server.js` (backend)
   - **Impact**: Users see success on frontend but get backend errors, or vice versa

8. **Redirect After Form Submission**
   - **Problem**: Using `window.location.href` allows back button to return to form page with cleared fields.
   - **Solution**: Use `window.location.replace()` to replace history entry
   - **Where**: In `signup.js` after successful signup
   - **Impact**: Poor user experience with back button behavior

9. **Timezone Fallback Logic**
   - **Problem**: Events created before timezone migration will have NULL timezone. Display code must handle this.
   - **Solution**: Use `run.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone` as fallback
   - **Where**: All date display code
   - **Impact**: Legacy events will display in browser timezone (acceptable fallback)

10. **iCal Format Uses UTC (Correct)**
    - **Important**: iCal files use UTC time format (YYYYMMDDTHHmmssZ), which is correct. Do NOT add timezone parameter to `formatDateForICal` functions. Calendar applications convert UTC to user's timezone automatically.
    - **Where**: `formatDateForICal` functions should NOT be modified
    - **Impact**: Adding timezone to iCal would break calendar applications

### Best Practices

1. **Always test calendar invites in both Google Calendar and other calendar apps** to ensure timezone handling is correct
2. **Test with events in different timezones** (e.g., America/New_York, America/Los_Angeles, Europe/London)
3. **Verify database migrations in development branch before promoting to main**
4. **Check both frontend calendar links AND email calendar links** - they use different code paths
5. **Test optional contact fields thoroughly** - ensure NULL values are stored, not empty strings
6. **Verify waiver text includes all required legal language** for communication consent
7. **Use consistent patterns** - if one file uses `timezone || null`, use the same pattern everywhere

---

## Summary

This migration adds timezone tracking, optional contact field validation, calendar invite fixes, and related improvements to the Runs application. The changes are extensive but follow consistent patterns. Pay special attention to:

1. Database migrations (run in development branch first)
2. MySQL DATETIME to ISO UTC conversion (critical for correct timezone handling)
3. Google Calendar date formatting (must use Intl.DateTimeFormat)
4. Email template calendar functions (separate from frontend)
5. NULL vs empty string storage
6. Table and field name differences between applications

Follow the steps in order and test thoroughly after each major section.
