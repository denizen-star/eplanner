# Email Functionality Migration Guide - Runs Application (gayrunclub)

This guide provides step-by-step instructions for an AI agent to migrate email confirmation functionality from the EventPlan application to the Runs application (gayrunclub). The codebases are very similar but have some key differences in table names and field names.

## Key Differences Between Applications

| Aspect | EventPlan | Runs (gayrunclub) |
|--------|-----------|-------------------|
| Database Table | `ep_events` | `runs` |
| Signups Table | `ep_signups` | `signups` |
| Waivers Table | `ep_waivers` | `waivers` |
| Name Field | `planner_name` / `plannerName` | `pacer_name` / `pacerName` |
| Coordinator Field | `coordinator_email` | `coordinator_email` (same) |
| App Name | EventPlan | Gay Run Club |

## Migration Checklist

- [ ] 1. Database Migration
- [ ] 2. Install Dependencies
- [ ] 3. Copy Email Service Files
- [ ] 4. Update Database Client
- [ ] 5. Update Forms and Frontend
- [ ] 6. Update Netlify Functions
- [ ] 7. Update Server.js
- [ ] 8. Create Configuration Files
- [ ] 9. Update .gitignore
- [ ] 10. Test and Verify

---

## Step 1: Database Migration

### File to Create: `lib/migration-add-coordinator-email.sql`

**Content:**
```sql
-- Migration: Add coordinator_email column to runs table
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration adds a coordinator_email field to store the email address
-- of the run coordinator. This email will be used to send confirmation
-- emails when runs are created, when people sign up, and when runs are updated.

-- Add coordinator_email column (VARCHAR(255), NULL initially)
ALTER TABLE runs 
ADD COLUMN coordinator_email VARCHAR(255) NULL;

-- After updating existing records with valid emails, uncomment this to make it required:
-- ALTER TABLE runs 
-- MODIFY COLUMN coordinator_email VARCHAR(255) NOT NULL;

-- Optional: Add index for faster lookups if needed
-- CREATE INDEX idx_coordinator_email ON runs(coordinator_email);
```

**Action:** Create this file in `/Users/kervinleacock/Documents/Development/gayrunclub/lib/migration-add-coordinator-email.sql`

**Note:** The table name is `runs` (not `ep_events`)

---

## Step 2: Install Dependencies

### File to Update: `package.json`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/package.json`

**Current dependencies section:**
```json
"dependencies": {
  "@planetscale/database": "^1.11.0",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "express": "^4.18.2",
  "node-fetch": "^3.3.2",
  "serverless-http": "^3.2.0"
}
```

**Updated dependencies section:**
```json
"dependencies": {
  "@planetscale/database": "^1.11.0",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "express": "^4.18.2",
  "js-yaml": "^4.1.0",
  "node-fetch": "^3.3.2",
  "nodemailer": "^6.9.7",
  "serverless-http": "^3.2.0"
}
```

**Changes:**
- Add `"js-yaml": "^4.1.0"` after `"express"`
- Add `"nodemailer": "^6.9.7"` after `"js-yaml"`

**Action:** Update the dependencies section in `package.json`

---

## Step 3: Copy Email Service Files

### File 1: `lib/emailService.js`

**Source:** `/Users/kervinleacock/Documents/Development/EventPlan/lib/emailService.js`

**Destination:** `/Users/kervinleacock/Documents/Development/gayrunclub/lib/emailService.js`

**Action:** Copy the entire file as-is. No changes needed - it's generic and works for both applications.

### File 2: `lib/emailTemplates.js`

**Source:** `/Users/kervinleacock/Documents/Development/EventPlan/lib/emailTemplates.js`

**Destination:** `/Users/kervinleacock/Documents/Development/gayrunclub/lib/emailTemplates.js`

**Required Changes:**
1. Replace all instances of `plannerName` with `pacerName` (the Runs app uses `pacerName`)
2. Replace references to "Event" with "Run" where appropriate in email text
3. Replace references to "Event Planner" with "Gay Run Club" or appropriate app name

**Specific Changes:**
- Line ~30: `const plannerName = run.plannerName || run.pacerName || 'Event Coordinator';`
  - Change to: `const plannerName = run.pacerName || 'Run Coordinator';`
- Line ~30: `const plannerName = run.plannerName || run.pacerName || 'Event Coordinator';`
  - Change to: `const plannerName = run.pacerName || 'Run Coordinator';`
- Throughout: Replace "Event" with "Run" in subject lines and content
- Throughout: Replace "Event Planner" with "Gay Run Club" in footer text

**Action:** Copy the file and make the above replacements.

---

## Step 4: Update Database Client

### File: `lib/databaseClient.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/lib/databaseClient.js`

### Change 1: Update `runs.create()` method

**Find the INSERT query (around line 100-106):**
```javascript
const query = `
  INSERT INTO runs (
    id, uuid, location, coordinates, pacer_name, title, date_time, max_participants, status, created_at,
    house_number, road, suburb, city, county, state, postcode, country, country_code,
    neighbourhood, city_district, village, town, municipality
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
```

**Change to:**
```javascript
const query = `
  INSERT INTO runs (
    id, uuid, location, coordinates, pacer_name, title, date_time, max_participants, status, created_at,
    house_number, road, suburb, city, county, state, postcode, country, country_code,
    neighbourhood, city_district, village, town, municipality, coordinator_email
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
```

**Find the executeQuery call (around line 114-139):**
```javascript
await executeQuery(query, [
  runData.id,
  runData.uuid,
  runData.location,
  coordinates,
  runData.pacerName,
  runData.title || null,
  dateTime,
  runData.maxParticipants,
  runData.status || 'active',
  createdAt,
  runData.house_number || null,
  runData.road || null,
  runData.suburb || null,
  runData.city || null,
  runData.county || null,
  runData.state || null,
  runData.postcode || null,
  runData.country || null,
  runData.country_code || null,
  runData.neighbourhood || null,
  runData.city_district || null,
  runData.village || null,
  runData.town || null,
  runData.municipality || null,
]);
```

**Change to:**
```javascript
await executeQuery(query, [
  runData.id,
  runData.uuid,
  runData.location,
  coordinates,
  runData.pacerName,
  runData.title || null,
  dateTime,
  runData.maxParticipants,
  runData.status || 'active',
  createdAt,
  runData.house_number || null,
  runData.road || null,
  runData.suburb || null,
  runData.city || null,
  runData.county || null,
  runData.state || null,
  runData.postcode || null,
  runData.country || null,
  runData.country_code || null,
  runData.neighbourhood || null,
  runData.city_district || null,
  runData.village || null,
  runData.town || null,
  runData.municipality || null,
  runData.coordinatorEmail || null,
]);
```

### Change 2: Update `runs.getById()` method

**Find the SELECT query (around line 144-175):**
```javascript
const query = `
  SELECT 
    id,
    uuid,
    location,
    coordinates,
    pacer_name as pacerName,
    title,
    date_time as dateTime,
    max_participants as maxParticipants,
    status,
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
    municipality
  FROM runs
  WHERE id = ? OR uuid = ?
  LIMIT 1
`;
```

**Change to:**
```javascript
const query = `
  SELECT 
    id,
    uuid,
    location,
    coordinates,
    pacer_name as pacerName,
    title,
    date_time as dateTime,
    max_participants as maxParticipants,
    status,
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
    coordinator_email as coordinatorEmail
  FROM runs
  WHERE id = ? OR uuid = ?
  LIMIT 1
`;
```

### Change 3: Update `runs.getAll()` method

**Find the SELECT query (should be similar to getById):**
```javascript
const query = `
  SELECT 
    id,
    uuid,
    location,
    coordinates,
    pacer_name as pacerName,
    title,
    date_time as dateTime,
    max_participants as maxParticipants,
    status,
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
    municipality
  FROM runs
  WHERE status != 'deleted'
  ORDER BY created_at DESC
`;
```

**Change to:** Add `coordinator_email as coordinatorEmail` to the SELECT list (same as getById)

### Change 4: Update `runs.update()` method

**Find the update method (around line 270-320):**
```javascript
async update(runId, updates) {
  const fields = [];
  const values = [];

  if (updates.location !== undefined) {
    fields.push('location = ?');
    values.push(updates.location);
  }
  if (updates.pacerName !== undefined) {
    fields.push('pacer_name = ?');
    values.push(updates.pacerName);
  }
  // ... other fields ...
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title ? updates.title.trim() : null);
  }

  if (fields.length === 0) {
    return await this.getById(runId);
  }
  // ...
}
```

**Add after the `title` check:**
```javascript
  if (updates.coordinatorEmail !== undefined) {
    fields.push('coordinator_email = ?');
    values.push(updates.coordinatorEmail ? updates.coordinatorEmail.trim() : null);
  }
```

**Action:** Make all four changes to `lib/databaseClient.js`

---

## Step 5: Update Forms and Frontend

### File 1: `coordinate.html`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/coordinate.html`

**Find the form section (around line 64-70):**
```html
<div class="form-group">
    <label for="pacerName">Planner Name *</label>
    <input type="text" id="pacerName" name="pacerName" required placeholder="e.g., John Smith">
</div>

<div class="form-group">
    <label for="runTitle">Run Title (Optional)</label>
    <input type="text" id="runTitle" name="runTitle" placeholder="e.g., Morning Beach Run">
    <small style="display: block; margin-top: 4px; color: var(--text-gray); font-size: 14px;">Give your run a name if you'd like</small>
</div>
```

**Add after the `pacerName` field (before `runTitle`):**
```html
<div class="form-group">
    <label for="coordinatorEmail">Coordinator Email *</label>
    <input type="email" id="coordinatorEmail" name="coordinatorEmail" required placeholder="e.g., coordinator@example.com">
    <small style="display: block; margin-top: 4px; color: var(--text-gray); font-size: 14px;">Email address for run confirmations and notifications</small>
</div>
```

**Action:** Add the coordinator email input field to the form

### File 2: `assets/js/coordinate.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/assets/js/coordinate.js`

**Find where `pacerName` is validated (around line 230-240):**
```javascript
const plannerName = document.getElementById('pacerName').value.trim();
if (!plannerName) {
  throw new Error('Please enter a planner name');
}
```

**Add after this validation:**
```javascript
const coordinatorEmail = document.getElementById('coordinatorEmail').value.trim();
if (!coordinatorEmail) {
  throw new Error('Please enter a coordinator email address');
}
// Basic email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(coordinatorEmail)) {
  throw new Error('Please enter a valid email address');
}
```

**Find the `formData` object (around line 284-290):**
```javascript
const formData = {
  location: locationToSave,
  coordinates: validatedCoordinates,
  plannerName: plannerName,
  title: runTitle || null,
  dateTime: dateTime,
  maxParticipants: maxParticipantsValue,
  // ...
};
```

**Add to formData:**
```javascript
const formData = {
  location: locationToSave,
  coordinates: validatedCoordinates,
  plannerName: plannerName,
  coordinatorEmail: coordinatorEmail,
  title: runTitle || null,
  dateTime: dateTime,
  maxParticipants: maxParticipantsValue,
  // ...
};
```

**Action:** Add email validation and include in formData

---

## Step 6: Update Netlify Functions

### File 1: `netlify/functions/runs-create.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/netlify/functions/runs-create.js`

**Change 1: Add imports at the top**
```javascript
const { runs, telemetry } = require('../../lib/databaseClient');
const { getGeolocationFromIP } = require('../../lib/ipGeolocation');
```

**Change to:**
```javascript
const { runs, telemetry } = require('../../lib/databaseClient');
const { getGeolocationFromIP } = require('../../lib/ipGeolocation');
const EmailService = require('../../lib/emailService');
const { eventCreatedEmail } = require('../../lib/emailTemplates');
```

**Change 2: Extract coordinatorEmail from body**
Find where body is destructured (around line 77-81):
```javascript
const { 
  location, coordinates, plannerName, pacerName, title, dateTime, maxParticipants, deviceInfo, sessionInfo,
  house_number, road, suburb, city, county, state, postcode, country, country_code,
  neighbourhood, city_district, village, town, municipality, pageUrl, referrer, picture, description
} = body;
```

**Change to:**
```javascript
const { 
  location, coordinates, plannerName, pacerName, title, dateTime, maxParticipants, deviceInfo, sessionInfo,
  house_number, road, suburb, city, county, state, postcode, country, country_code,
  neighbourhood, city_district, village, town, municipality, pageUrl, referrer, picture, description,
  coordinatorEmail
} = body;
```

**Change 3: Add email validation**
Find validation section (around line 92-99):
```javascript
// Validate and trim all required fields
const trimmedLocation = location ? location.trim() : '';
const trimmedPlannerName = nameToUse ? nameToUse.trim() : '';

if (!trimmedLocation || !trimmedPlannerName || !dateTime || !maxParticipants) {
  console.error('[RUNS CREATE] Validation failed: Missing required fields');
  return jsonResponse(400, { success: false, error: 'Missing required fields' });
}
```

**Change to:**
```javascript
// Validate and trim all required fields
const trimmedLocation = location ? location.trim() : '';
const trimmedPlannerName = nameToUse ? nameToUse.trim() : '';
const trimmedCoordinatorEmail = coordinatorEmail ? coordinatorEmail.trim() : '';

if (!trimmedLocation || !trimmedPlannerName || !dateTime || !maxParticipants || !trimmedCoordinatorEmail) {
  console.error('[RUNS CREATE] Validation failed: Missing required fields');
  return jsonResponse(400, { success: false, error: 'Missing required fields: location, plannerName, dateTime, maxParticipants, and coordinatorEmail are required' });
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(trimmedCoordinatorEmail)) {
  console.error('[RUNS CREATE] Validation failed: Invalid email format');
  return jsonResponse(400, { success: false, error: 'Invalid coordinator email address format' });
}
```

**Change 4: Add coordinatorEmail to database create**
Find the `runs.create()` call (around line 146-174):
```javascript
await runs.create({
  id: shortId,
  uuid: uuid,
  location: trimmedLocation,
  coordinates: coordinates || null,
  plannerName: trimmedPlannerName,
  title: title ? title.trim() : null,
  dateTime: dateTime,
  maxParticipants: parseInt(maxParticipants),
  status: 'active',
  createdAt: createdAt,
  // Address component fields
  house_number: house_number || null,
  // ... rest of fields
});
```

**Add to the object:**
```javascript
await runs.create({
  id: shortId,
  uuid: uuid,
  location: trimmedLocation,
  coordinates: coordinates || null,
  plannerName: trimmedPlannerName,
  coordinatorEmail: trimmedCoordinatorEmail,
  title: title ? title.trim() : null,
  dateTime: dateTime,
  maxParticipants: parseInt(maxParticipants),
  status: 'active',
  createdAt: createdAt,
  // ... rest of fields
});
```

**Change 5: Add email sending after successful creation**
Find the return statement (around line 231-238):
```javascript
console.log('[RUNS CREATE] Success! Run created:', { shortId, signupLink, manageLink });

return jsonResponse(200, {
  success: true,
  run: runData,
  signupLink: signupLink,
  manageLink: manageLink
});
```

**Change to:**
```javascript
console.log('[RUNS CREATE] Success! Run created:', { shortId, signupLink, manageLink });

// Send confirmation email to coordinator (non-blocking)
console.log('[RUNS CREATE] Sending confirmation email...');
try {
  const emailService = new EmailService();
  if (emailService.isEnabled()) {
    const runForEmail = {
      ...runData,
      pacerName: trimmedPlannerName,
      location: trimmedLocation,
    };
    const emailContent = eventCreatedEmail(runForEmail, trimmedCoordinatorEmail, signupLink, manageLink);
    
    await emailService.sendEmail({
      to: trimmedCoordinatorEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
    console.log('[RUNS CREATE] Confirmation email sent successfully');
  } else {
    console.log('[RUNS CREATE] Email service is disabled, skipping email');
  }
} catch (emailError) {
  console.error('[RUNS CREATE] Error sending confirmation email:', emailError.message);
  // Don't fail the event creation if email fails
}

return jsonResponse(200, {
  success: true,
  run: runData,
  signupLink: signupLink,
  manageLink: manageLink
});
```

**Action:** Make all 5 changes to `netlify/functions/runs-create.js`

### File 2: `netlify/functions/runs-signup.js`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/netlify/functions/runs-signup.js`

**Change 1: Add imports**
```javascript
const { runs, signups, waivers, telemetry } = require('../../lib/databaseClient');
const { getGeolocationFromIP } = require('../../lib/ipGeolocation');
```

**Change to:**
```javascript
const { runs, signups, waivers, telemetry } = require('../../lib/databaseClient');
const { getGeolocationFromIP } = require('../../lib/ipGeolocation');
const EmailService = require('../../lib/emailService');
const { signupConfirmationEmail, signupNotificationEmail } = require('../../lib/emailTemplates');
```

**Change 2: Add email sending after successful signup**
Find the return statement (around line 191-203):
```javascript
console.log('[RUNS SIGNUP] Success! Signup completed for:', name);
return jsonResponse(200, {
  success: true,
  signup: {
    id: createdSignup.id,
    name: createdSignup.name,
    phone: createdSignup.phone,
    email: createdSignup.email,
    instagram: createdSignup.instagram,
    waiverAccepted: true,
    signedAt: signedAt
  }
});
```

**Change to:**
```javascript
console.log('[RUNS SIGNUP] Success! Signup completed for:', name);

// Send confirmation emails (non-blocking)
console.log('[RUNS SIGNUP] Sending confirmation emails...');
try {
  const emailService = new EmailService();
  if (emailService.isEnabled()) {
    // Send confirmation to attendee if they provided an email
    if (createdSignup.email && createdSignup.email.trim()) {
      try {
        const attendeeEmailContent = signupConfirmationEmail(run, createdSignup);
        await emailService.sendEmail({
          to: createdSignup.email.trim(),
          subject: attendeeEmailContent.subject,
          html: attendeeEmailContent.html,
          text: attendeeEmailContent.text,
        });
        console.log('[RUNS SIGNUP] Confirmation email sent to attendee');
      } catch (attendeeEmailError) {
        console.error('[RUNS SIGNUP] Error sending email to attendee:', attendeeEmailError.message);
      }
    }

    // Send notification to coordinator if coordinator email exists
    if (run.coordinatorEmail && run.coordinatorEmail.trim()) {
      try {
        const coordinatorEmailContent = signupNotificationEmail(run, createdSignup, run.coordinatorEmail);
        await emailService.sendEmail({
          to: run.coordinatorEmail.trim(),
          subject: coordinatorEmailContent.subject,
          html: coordinatorEmailContent.html,
          text: coordinatorEmailContent.text,
        });
        console.log('[RUNS SIGNUP] Notification email sent to coordinator');
      } catch (coordinatorEmailError) {
        console.error('[RUNS SIGNUP] Error sending email to coordinator:', coordinatorEmailError.message);
      }
    }
  } else {
    console.log('[RUNS SIGNUP] Email service is disabled, skipping emails');
  }
} catch (emailError) {
  console.error('[RUNS SIGNUP] Error in email sending process:', emailError.message);
  // Don't fail the signup if email fails
}

return jsonResponse(200, {
  success: true,
  signup: {
    id: createdSignup.id,
    name: createdSignup.name,
    phone: createdSignup.phone,
    email: createdSignup.email,
    instagram: createdSignup.instagram,
    waiverAccepted: true,
    signedAt: signedAt
  }
});
```

**Action:** Make both changes to `netlify/functions/runs-signup.js`

---

## Step 7: Update Server.js

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/server.js`

### Change 1: Add imports

**Find the imports section (around line 1-10):**
```javascript
const express = require('express');
const cors = require('cors');
const { runs, signups, waivers } = require('./lib/databaseClient');
```

**Change to:**
```javascript
const express = require('express');
const cors = require('cors');
const { runs, signups, waivers } = require('./lib/databaseClient');
const EmailService = require('./lib/emailService');
const { 
  eventCreatedEmail,
  signupConfirmationEmail, 
  signupNotificationEmail,
  eventUpdatedEmail, 
  eventUpdatedToSignupsEmail 
} = require('./lib/emailTemplates');
```

### Change 2: Update POST `/api/runs/create` endpoint

**Find the endpoint (around line 85-230):**

**Add coordinatorEmail extraction:**
```javascript
const { location, coordinates, pacerName, plannerName, title, dateTime, maxParticipants, deviceInfo, sessionInfo, picture, description } = req.body;
```

**Change to:**
```javascript
const { location, coordinates, pacerName, plannerName, title, dateTime, maxParticipants, deviceInfo, sessionInfo, picture, description, coordinatorEmail } = req.body;
```

**Add email validation:**
```javascript
const trimmedLocation = location ? location.trim() : '';
const trimmedPlannerName = nameToUse ? nameToUse.trim() : '';
```

**Change to:**
```javascript
const trimmedLocation = location ? location.trim() : '';
const trimmedPlannerName = nameToUse ? nameToUse.trim() : '';
const trimmedCoordinatorEmail = coordinatorEmail ? coordinatorEmail.trim() : '';

// Validate email format
if (trimmedCoordinatorEmail) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedCoordinatorEmail)) {
    console.error('[RUN CREATE] Validation failed: Invalid email format');
    return res.status(400).json({ error: 'Invalid coordinator email address format' });
  }
}
```

**Update missing fields check:**
```javascript
if (!trimmedLocation) missingFields.push('location');
if (!trimmedPlannerName) missingFields.push('plannerName');
if (!dateTime) missingFields.push('dateTime');
if (!maxParticipants) missingFields.push('maxParticipants');
```

**Change to:**
```javascript
if (!trimmedLocation) missingFields.push('location');
if (!trimmedPlannerName) missingFields.push('plannerName');
if (!dateTime) missingFields.push('dateTime');
if (!maxParticipants) missingFields.push('maxParticipants');
if (!trimmedCoordinatorEmail) missingFields.push('coordinatorEmail');
```

**Add coordinatorEmail to database create:**
```javascript
const createData = {
  id: shortId,
  uuid: uuid,
  location: trimmedLocation,
  coordinates: coordinates || null,
  plannerName: trimmedPlannerName,
  title: title ? title.trim() : null,
  dateTime: dateTime,
  maxParticipants: parseInt(maxParticipants),
  status: 'active',
  createdAt: createdAt,
  picture: picture || null,
  description: description || null,
};
```

**Change to:**
```javascript
const createData = {
  id: shortId,
  uuid: uuid,
  location: trimmedLocation,
  coordinates: coordinates || null,
  plannerName: trimmedPlannerName,
  coordinatorEmail: trimmedCoordinatorEmail,
  title: title ? title.trim() : null,
  dateTime: dateTime,
  maxParticipants: parseInt(maxParticipants),
  status: 'active',
  createdAt: createdAt,
  picture: picture || null,
  description: description || null,
};
```

**Add email sending after creation:**
Find the return statement and add email sending code (same pattern as Netlify function)

### Change 3: Update POST `/api/runs/:runId/signup` endpoint

**Add email sending after successful signup** (same pattern as Netlify function)

### Change 4: Update PUT `/api/runs/:runId` endpoint

**Find the endpoint (around line 429-469):**

**Add imports usage:**
- Track changes (compare old vs new)
- Get all signups
- Send emails to coordinator and signups

**Add after the update:**
```javascript
// Track changes for email notifications
const changes = {};
if (updates.location !== undefined && updates.location !== existingRun.location) {
  changes['Location'] = `${existingRun.location} → ${updates.location}`;
}
if (updates.title !== undefined && updates.title !== existingRun.title) {
  changes['Title'] = `${existingRun.title || '(none)'} → ${updates.title || '(none)'}`;
}
if (updates.dateTime !== undefined && updates.dateTime !== existingRun.dateTime) {
  const oldDate = new Date(existingRun.dateTime).toLocaleString();
  const newDate = new Date(updates.dateTime).toLocaleString();
  changes['Date & Time'] = `${oldDate} → ${newDate}`;
}
if (updates.maxParticipants !== undefined && updates.maxParticipants !== existingRun.maxParticipants) {
  changes['Max Participants'] = `${existingRun.maxParticipants} → ${updates.maxParticipants}`;
}
if (updates.pacerName !== undefined && updates.pacerName !== existingRun.pacerName) {
  changes['Pacer Name'] = `${existingRun.pacerName} → ${updates.pacerName}`;
}
if (updates.description !== undefined && updates.description !== existingRun.description) {
  changes['Description'] = 'Updated';
}

// Update in database
const updatedRun = await runs.update(runId, updates);

// Send update emails if there were changes (non-blocking)
if (Object.keys(changes).length > 0) {
  console.log('[RUN UPDATE] Changes detected, sending update emails...');
  try {
    const emailService = new EmailService();
    if (emailService.isEnabled()) {
      // Send email to coordinator
      if (updatedRun.coordinatorEmail && updatedRun.coordinatorEmail.trim()) {
        try {
          const coordinatorEmailContent = eventUpdatedEmail(updatedRun, changes, updatedRun.coordinatorEmail);
          await emailService.sendEmail({
            to: updatedRun.coordinatorEmail.trim(),
            subject: coordinatorEmailContent.subject,
            html: coordinatorEmailContent.html,
            text: coordinatorEmailContent.text,
          });
          console.log('[RUN UPDATE] Update email sent to coordinator');
        } catch (coordinatorEmailError) {
          console.error('[RUN UPDATE] Error sending email to coordinator:', coordinatorEmailError.message);
        }
      }

      // Send email to all signups with email addresses
      try {
        const allSignups = await signups.getByRunId(runId);
        const signupsWithEmail = allSignups.filter(s => s.email && s.email.trim());
        
        if (signupsWithEmail.length > 0) {
          const emailPromises = signupsWithEmail.map(async (signup) => {
            try {
              const signupEmailContent = eventUpdatedToSignupsEmail(updatedRun, changes, signup);
              await emailService.sendEmail({
                to: signup.email.trim(),
                subject: signupEmailContent.subject,
                html: signupEmailContent.html,
                text: signupEmailContent.text,
              });
            } catch (signupEmailError) {
              console.error(`[RUN UPDATE] Error sending email to signup ${signup.id}:`, signupEmailError.message);
            }
          });
          
          await Promise.all(emailPromises);
          console.log(`[RUN UPDATE] Update emails sent to ${signupsWithEmail.length} signup(s)`);
        }
      } catch (signupsEmailError) {
        console.error('[RUN UPDATE] Error sending emails to signups:', signupsEmailError.message);
      }
    } else {
      console.log('[RUN UPDATE] Email service is disabled, skipping emails');
    }
  } catch (emailError) {
    console.error('[RUN UPDATE] Error in email sending process:', emailError.message);
    // Don't fail the update if email fails
  }
}
```

**Note:** Use `pacerName` instead of `plannerName` in the changes tracking

**Action:** Make all 4 changes to `server.js`

---

## Step 8: Create Configuration Files

### File 1: `config/email_config.yaml.example`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/config/email_config.yaml.example`

**Action:** Copy from EventPlan: `/Users/kervinleacock/Documents/Development/EventPlan/config/email_config.yaml.example`

**No changes needed** - the configuration is generic

### File 2: Update `.gitignore`

**Location:** `/Users/kervinleacock/Documents/Development/gayrunclub/.gitignore`

**Check if file exists, if not create it. Add:**
```
# Dependencies
node_modules/
package-lock.json

# Environment variables and secrets
.env
.env.local
config/email_config.yaml

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Build outputs
dist/
build/
```

**Action:** Create or update `.gitignore` to include `config/email_config.yaml`

---

## Step 9: Verification Checklist

After completing all steps, verify:

- [ ] Database migration file created: `lib/migration-add-coordinator-email.sql`
- [ ] `package.json` includes `nodemailer` and `js-yaml`
- [ ] `lib/emailService.js` exists (copied from EventPlan)
- [ ] `lib/emailTemplates.js` exists (copied and updated with `pacerName` instead of `plannerName`)
- [ ] `lib/databaseClient.js` updated:
  - [ ] `runs.create()` includes `coordinator_email`
  - [ ] `runs.getById()` returns `coordinatorEmail`
  - [ ] `runs.getAll()` returns `coordinatorEmail`
  - [ ] `runs.update()` supports `coordinatorEmail`
- [ ] `coordinate.html` has coordinator email input field
- [ ] `assets/js/coordinate.js` validates and includes email in formData
- [ ] `netlify/functions/runs-create.js`:
  - [ ] Imports EmailService and templates
  - [ ] Validates coordinatorEmail
  - [ ] Saves coordinatorEmail to database
  - [ ] Sends confirmation email
- [ ] `netlify/functions/runs-signup.js`:
  - [ ] Imports EmailService and templates
  - [ ] Sends emails to attendee and coordinator
- [ ] `server.js`:
  - [ ] Imports EmailService and templates
  - [ ] POST `/api/runs/create` handles email
  - [ ] POST `/api/runs/:runId/signup` sends emails
  - [ ] PUT `/api/runs/:runId` sends update emails
- [ ] `config/email_config.yaml.example` exists
- [ ] `.gitignore` excludes `config/email_config.yaml`

---

## Step 10: Testing

1. **Run database migration** in PlanetScale
2. **Install dependencies**: `npm install`
3. **Test locally** or **deploy to Netlify**
4. **Create a test run** with coordinator email
5. **Verify emails are sent**:
   - Coordinator receives creation confirmation
   - Attendee receives signup confirmation (if email provided)
   - Coordinator receives signup notification
   - Both receive update notifications when run is changed

---

## Important Notes

1. **Table Names**: Always use `runs`, `signups`, `waivers` (not `ep_events`, `ep_signups`, `ep_waivers`)

2. **Field Names**: Always use `pacerName` / `pacer_name` (not `plannerName` / `planner_name`)

3. **Email Templates**: The templates use `pacerName` - make sure the emailTemplates.js file has been updated to use `pacerName` instead of `plannerName`

4. **Error Handling**: All email sending should be wrapped in try-catch and should not fail the main operation

5. **Environment Variables**: Use the same Netlify environment variables as EventPlan:
   - `EMAIL_ENABLED`
   - `SMTP_SERVER`
   - `SMTP_PORT`
   - `SENDER_EMAIL`
   - `SENDER_PASSWORD`
   - `EMAIL_DEFAULT_RECIPIENT` (optional)

---

## Reference Files

When making changes, refer to these EventPlan files as templates:
- `/Users/kervinleacock/Documents/Development/EventPlan/lib/emailService.js`
- `/Users/kervinleacock/Documents/Development/EventPlan/lib/emailTemplates.js` (but update for `pacerName`)
- `/Users/kervinleacock/Documents/Development/EventPlan/netlify/functions/runs-create.js`
- `/Users/kervinleacock/Documents/Development/EventPlan/netlify/functions/runs-signup.js`
- `/Users/kervinleacock/Documents/Development/EventPlan/server.js`

---

**Last Updated**: 2025-01-09
