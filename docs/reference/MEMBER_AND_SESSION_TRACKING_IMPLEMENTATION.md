# Member and Session Tracking: Technical Implementation

This document describes how **session** and **member** tracking are implemented in EventPlan so an agent or developer can apply the same patterns to other Kervinapps applications. It is technical and assumes familiarity with HTTP, JSON, SQL, and serverless/Node backends.

---

## 1. Overview

The app tracks:

1. **Sessions** – Anonymous browser sessions identified by a stable `session_id`, used for analytics and linking pre-signup behavior to a future signup or member record.
2. **Device/session metadata** – Technical data (device type, browser, screen, connection, page URL, referrer) attached to signups, waivers, and analytics events.
3. **Members** – Cross-app identity records in `app_members`: **NA (Not Applicable)** for “signup intent” (passive, no email required) and **Weekly** for explicit newsletter opt-in. Members can be linked to signups via `app_member_id`.

**Data flow (simplified):**

- **Client:** Generates or loads `session_id` (persisted in `localStorage`), collects `deviceInfo` and `sessionInfo`, and sends them with signup POST and with analytics POST.
- **Signup API:** Stores `session_id`, `metadata` (device + session + IP + referrer), and optionally links signup to an `app_member` when user opts in to newsletter.
- **Analytics API:** Writes to `app_events` (session_id, device_info, etc.) and, for “signup-intent” CTAs, upserts a passive **NA** row in `app_members` (by session or email).

---

## 2. Session: Client-Side

### 2.1 Session identifier

- **Format:** `sess_` + timestamp + `_` + random string (e.g. `sess_1738512345678_abc12def3`).
- **Persistence:** One session per browser profile. The same ID should be reused across page loads and across pages of the same app.
- **Where it is set:** 
  - **Analytics** (`assets/js/analytics.js`): `getSessionId()` reads `localStorage.getItem(SESSION_KEY)`. If missing, it creates a new ID (via `SessionManager` if available, else inline), then `localStorage.setItem(SESSION_KEY, sessionId)`. `SESSION_KEY = 'eplanner_session_id'`.
  - **Signup/coordinate** pages: They instantiate `SessionManager` (see below). The in-memory `sessionManager.sessionId` is used; signup also falls back to `localStorage.getItem('eplanner_session_id')` so that if the user arrived from another page where analytics already set the key, the same session is used.

**Rule for other apps:** Decide a single `localStorage` key per app (e.g. `myapp_session_id`). Ensure one code path (e.g. analytics or a shared “app init”) creates and persists the ID on first load; all other features (signup, forms, analytics) read from that key or from the same in-memory session object.

### 2.2 SessionManager class (`assets/js/device-collector.js`)

- **Role:** Holds the session ID and “session info” (fields sent as `sessionInfo` in APIs).
- **Constructor:** Generates `sessionId` via `generateSessionId()`, sets `startTime`, `pageViews`, and `trackingData`:
  - `sessionId`, `startTime`, `userAgent`, `language`, `timezone`, `screenResolution`, `viewportSize`, `colorDepth`, `pixelRatio`.
- **Methods:**
  - `getSessionData()` – returns `trackingData` plus `duration` (now − startTime) and `pageViews`.
- **Exposure:** `window.SessionManager`, `window.DeviceMetadataCollector`. Signup and coordinate pages do `new SessionManager()` and pass `sessionManager.getSessionData()` as `sessionInfo` when submitting.

**Important:** SessionManager does not write to `localStorage` in this app. Persistence is done in analytics.js `getSessionId()`. For a new app, either have SessionManager write the ID to localStorage on first use or have a single “session init” script that does it.

---

## 3. Device and session metadata: Client-side

### 3.1 DeviceMetadataCollector (`assets/js/device-collector.js`)

- **Role:** Collects technical device/browser data to send as `deviceInfo`.
- **Method:** `DeviceMetadataCollector.collectDeviceData()` returns a plain object:
  - `deviceType`: 'mobile' | 'tablet' | 'desktop' (from userAgent).
  - `os`, `browser`: From userAgent.
  - `cpuCores`, `memory`, `connection` (effectiveType, downlink, rtt), `screen` (width, height, colorDepth, pixelDepth), `performance` (pageLoadTime, domContentLoaded, connectionTime) if available.
- **When used:** Signup and coordinate forms call it only in production (`hostname !== 'localhost' && hostname !== '127.0.0.1'`). Analytics uses the same collector for event payloads.

### 3.2 What is sent with signup POST (`assets/js/signup.js`)

The signup form POST body includes:

- `session_id` – from `sessionManager.sessionId` or `localStorage.getItem('eplanner_session_id')`.
- `deviceInfo` – result of `DeviceMetadataCollector.collectDeviceData()` (or null if not production).
- `sessionInfo` – result of `sessionManager.getSessionData()` (or null).
- `pageUrl` – `window.location.href`.
- `referrer` – `document.referrer || ''`.

Same pattern can be used for any “submit” or conversion endpoint: send `session_id`, `deviceInfo`, `sessionInfo`, `pageUrl`, `referrer` in the JSON body.

---

## 4. Backend: Signup API and storage

### 4.1 Request body (Netlify function `runs-signup.js` and Express `server.js`)

Parsed fields include:

- `name`, `phone`, `email`, `instagram`, `waiverAccepted`, `externalSignup`, `newsletterWeekly`, `waiverText`.
- **Tracking:** `session_id`, `deviceInfo`, `sessionInfo`, `pageUrl`, `referrer`.

Server also derives:

- **IP and User-Agent** from request headers (`x-forwarded-for`, `client-ip`, `x-nf-client-connection-ip`, etc.; `user-agent`).

### 4.2 Metadata object stored with signup and waiver

```js
const metadata = {
  deviceInfo: deviceInfo || null,
  sessionInfo: sessionInfo || null,
  ipAddress: ipAddress,
  userAgent: userAgent,
  pageUrl: pageUrl || null,
  referrer: referrer || null,
};
```

- **Signup:** `signups.create({ runId, name, phone, email, ..., metadata, sessionId, appMemberId })`. Table `ep_signups` has columns `metadata` (JSON), `session_id` (VARCHAR), `app_member_id` (BIGINT, nullable).
- **Waiver:** `waivers.create({ runId, signupId, participantName, participantPhone, waiverText, timestamp, metadata })`. Table `ep_waivers` has `metadata` (JSON).

So: every signup and its waiver store the same metadata blob and the signup row stores `session_id` and optional `app_member_id`.

### 4.3 Newsletter opt-in and app_member link

If the client sends `newsletterWeekly === true` and `email` is present:

1. Server resolves `appName` and `tenantKey` from the request (e.g. from Host header via `getTenant(event)`).
2. `appMembers.upsertWeeklyMember(appName, tenantKey, { email, name, phone, session_id })` is called. It inserts or updates a row with `type = 'Weekly'`, `status = 'active'`.
3. The returned member has `id`. Server then `signups.update(createdSignup.id, { appMemberId: member.id })` to link the signup to that member.

So: **Weekly** members are created/updated at signup time when the user opts in; the signup row’s `app_member_id` points to that member.

---

## 5. Database schema (relevant parts)

### 5.1 ep_signups (base + migrations)

- **Base:** `id`, `run_id`, `name`, `phone`, `email`, `instagram`, `waiver_accepted`, `external_signup`, `signed_at`, `metadata` (JSON).
- **Migration** (`migration-add-signup-app-member-id.sql`): added `app_member_id BIGINT NULL`, `session_id VARCHAR(255) NULL`, and index on `app_member_id`.

### 5.2 app_members table (`migration-add-app-members.sql`)

- **Purpose:** Cross-app member/contact list for newsletter and “signup intent” (passive) tracking.
- **Columns:**
  - `id`, `app_name`, `tenant_key`, `email`, `name`, `phone`, `session_id`
  - `type`: ENUM('NA','Weekly') – NA = passive/signup-intent, Weekly = newsletter opt-in.
  - `status`: ENUM('passive','active','opt-out','delete').
  - `consent_metadata` JSON, `created_at`, `updated_at`.
- **Uniqueness:** `UNIQUE(app_name, tenant_key, email, type)` so one row per (app, tenant, email, type). Multiple rows with NULL email are allowed (for NA by session).
- **Indexes:** e.g. `(app_name, tenant_key, email, type)`, `(app_name, tenant_key, session_id, type)`.

### 5.3 app_events table (`schema-app-events.sql`)

- **Purpose:** Analytics/telemetry events (page views, CTA clicks, etc.) with session and device context.
- **Columns:** `app_name`, `timestamp`, `session_id`, `event_type`, `page_category`, `page_url`, `article_id`, `article_slug`, `article_context`, `cta_type`, `depth_percent`, `referrer`, `device_info` (JSON), `ip_address`, `ip_geolocation` (JSON), `user_agent`.
- **Note:** This app uses `app_events`; an older `telemetry` table exists in `schema-telemetry.sql`. The implementation below refers to `app_events` and `appEvents` in code.

---

## 6. App members: API and behavior

### 6.1 Resolving app and tenant

- **Server:** `appName` and `tenantKey` come from the request. In Netlify/Express, use the request Host header and a small helper (e.g. `getTenantFromHost(host)` in `lib/tenant.js`) that returns `{ appName, tenantKey }`. Same pattern as tenant branding so that `app_name` and `tenant_key` are always server-derived, not client-supplied.

### 6.2 findByIdentity(appName, tenantKey, { email, sessionId })

- **Purpose:** Find all `app_members` rows for a given identity (email and/or session).
- **Query:** `WHERE app_name = ? AND (tenant_key <=> ?) AND (email <=> ? OR session_id <=> ?)`.
- **Use case:** Deduplication, or checking for an existing NA/Weekly row before upsert.

### 6.3 upsertPassiveNaMember(appName, tenantKey, { sessionId, email, name, phone })

- **Purpose:** Record “signup intent” (e.g. user clicked “Sign Up” or “Event signup” but has not yet completed a form). No email required; session is enough.
- **Logic:**
  1. If `email` is present, try to find an existing row with that `(app_name, tenant_key, email, type = 'NA')`.
  2. Else if `sessionId` is present, try to find by `(app_name, tenant_key, session_id, type = 'NA')`.
  3. If found: update that row (email, name, phone, session_id as provided; do not change `type` or `status`).
  4. If not found: insert a new row with `type = 'NA'`, `status = 'passive'`.
- **Idempotency:** Same session or email returns the same logical “member”; later updates can add email/name/phone when available.

### 6.4 upsertWeeklyMember(appName, tenantKey, payload)

- **Purpose:** Explicit newsletter opt-in (e.g. checkbox on signup form). Requires email.
- **Payload:** `{ email, name, phone, session_id }`.
- **Logic:**
  1. Normalize email (trim, lowercase). Select existing row `WHERE app_name = ? AND (tenant_key <=> ?) AND email = ? AND type = 'Weekly'`.
  2. If exists: update `name`, `phone`, `session_id`, and set `status = 'active'` (re-opt-in).
  3. If not: insert with `type = 'Weekly'`, `status = 'active'`.
- **Returns:** Member row including `id`. Caller can then set `signups.update(signupId, { appMemberId: member.id })`.

### 6.5 getActiveWeeklyMembers(appName, tenantKey)

- Returns distinct active Weekly members (by email) for sending digest.

### 6.6 setWeeklyStatusByEmail(appName, tenantKey, email, status)

- Updates all Weekly rows for that email to `status` (e.g. `'opt-out'` for unsubscribe).

---

## 7. Analytics event API and passive NA member

### 7.1 Endpoint and payload

- **Endpoint:** POST `/api/analytics/event` (Netlify function `analytics-event.js`).
- **Body (typical):** `eventType`, `sessionId`, `pageCategory`, `pageUrl`, `referrer`, `deviceInfo`, `timestamp`, optional `articleId`, `articleSlug`, `articleContext`, `ctaType`, `depthPercent`, and optionally `memberEmail`, `memberName`, `memberPhone` for enrichment.

### 7.2 Server flow

1. **Resolve app/tenant** from request (e.g. Host header).
2. **Build telemetry payload:** Map body to DB columns; add server-side `ipAddress`, `userAgent`, and optionally `ipGeolocation` (from IP lookup). Insert into `app_events` (table used by `appEvents.create` in databaseClient).
3. **Passive NA upsert:** If `eventType === 'cta_click'` and `ctaType` is in a fixed list of “signup-intent” CTAs (e.g. `signup_submit_click`, `event_signup_click`, `calendar_event_click`, `desktop_calendar_signup_click`, `home_signup_button_click`), call `appMembers.upsertPassiveNaMember(appName, tenantKey, { sessionId, email: memberEmail, name: memberName, phone: memberPhone })`. If no `sessionId` and no `memberEmail`, skip. This is non-blocking (log errors but do not fail the 200 response).

So: a single analytics POST both writes an event and may create/update a passive NA member when the event is a signup-intent CTA.

### 7.3 Client: when to send member fields

For CTAs that lead to signup (e.g. “Sign Up” button on event page), the client can send `memberEmail`, `memberName`, `memberPhone` if the user has already entered them (e.g. in a pre-fill or same page). That enriches the NA member when the analytics event is processed. In EventPlan, these are optional and often null until the user actually submits the signup form.

---

## 8. Signup → member link (summary)

- **At signup submit:** Client sends `session_id`, `deviceInfo`, `sessionInfo`, `pageUrl`, `referrer`, and optionally `newsletterWeekly`.
- **Server:** Creates signup with `metadata` and `session_id`; creates waiver with same `metadata`. If `newsletterWeekly` and email present, calls `upsertWeeklyMember` and then `signups.update(signupId, { appMemberId })`.
- **Passive NA:** Created/updated only from analytics when a signup-intent CTA is tracked; not from the signup POST itself. So the “member” for a given session can exist before signup (NA row), and after signup the same person may have a Weekly row and an `ep_signups.app_member_id` pointing to it.

---

## 9. Checklist for applying to another Kervinapps app

1. **Session ID**
   - Choose a `localStorage` key (e.g. `myapp_session_id`).
   - Ensure one place creates and persists the ID (e.g. analytics or app init). Use same format (`sess_` + timestamp + `_` + random) or your own.
   - On any form or conversion request, send `session_id` in the body (and optionally `sessionInfo` from a SessionManager-like object).

2. **Device/session metadata**
   - Reuse or clone `DeviceMetadataCollector` and `SessionManager` (or equivalent). On production only, collect `deviceInfo` and `sessionInfo` and send with signup/conversion and with analytics.
   - Backend: accept `deviceInfo`, `sessionInfo`, `pageUrl`, `referrer`; add `ipAddress` and `userAgent` from headers; store as a `metadata` JSON on signup/waiver/conversion and in analytics table.

3. **Tables**
   - **Signups/conversions:** Add `metadata` (JSON), `session_id` (VARCHAR), `app_member_id` (BIGINT NULL) if you want to link to members.
   - **app_members:** Add table with `app_name`, `tenant_key`, `email`, `name`, `phone`, `session_id`, `type` (e.g. NA, Weekly), `status`, unique on (app_name, tenant_key, email, type), indexes for session and email lookups.
   - **app_events (or equivalent):** Store `session_id`, `device_info` (JSON), `page_url`, `referrer`, plus event fields; add IP and optional geolocation server-side.

4. **App/tenant**
   - Derive `appName` and `tenantKey` from request (e.g. Host). Never trust client for app_name/tenant_key.

5. **Members**
   - Implement `upsertPassiveNaMember` for signup-intent CTAs (session or email); call it from the analytics handler when event is a signup-intent CTA.
   - Implement `upsertWeeklyMember` for newsletter opt-in; call it from signup/conversion handler when user opts in, then link the conversion row to the member via `app_member_id`.
   - Implement `getActiveWeeklyMembers` and `setWeeklyStatusByEmail` for digest and unsubscribe.

6. **Analytics**
   - POST body: `eventType`, `sessionId`, `pageCategory`, `pageUrl`, `referrer`, `deviceInfo`, and optional `ctaType`, `memberEmail`, `memberName`, `memberPhone`.
   - Server: write to app_events; then if event is signup-intent CTA, call `upsertPassiveNaMember` with sessionId and optional member fields.

7. **Waiver/consent**
   - Store the same `metadata` (device, session, IP, referrer) with waiver or consent records so you have an audit trail of context at acceptance time.

---

## 10. File reference (EventPlan)

| Layer | File | Purpose |
|-------|------|--------|
| Client session/device | `assets/js/device-collector.js` | SessionManager, DeviceMetadataCollector |
| Client session persistence | `assets/js/analytics.js` | getSessionId(), localStorage key, sendEvent payload |
| Client signup payload | `assets/js/signup.js` | session_id, deviceInfo, sessionInfo, pageUrl, referrer in form POST |
| Signup API | `netlify/functions/runs-signup.js` | metadata, sessionId, appMemberId; newsletter opt-in → upsertWeeklyMember |
| Analytics API | `netlify/functions/analytics-event.js` | app_events insert; signup-intent CTA → upsertPassiveNaMember |
| Tenant/app resolution | `netlify/functions/utils.js` | getTenant(event), getAppName(event) |
| DB signups | `lib/databaseClient.js` | signups.create/update (metadata, session_id, app_member_id) |
| DB members | `lib/databaseClient.js` | appMembers.findByIdentity, upsertPassiveNaMember, upsertWeeklyMember, getActiveWeeklyMembers, setWeeklyStatusByEmail |
| DB analytics | `lib/databaseClient.js` | appEvents.create |
| Schema | `lib/schema.sql` | ep_signups (metadata); ep_waivers (metadata) |
| Migrations | `lib/migration-add-signup-app-member-id.sql`, `lib/migration-add-app-members.sql` | app_member_id, session_id on signups; app_members table |
| Schema | `lib/schema-app-events.sql` | app_events columns |

This should be enough for an agent to replicate session and member tracking in another Kervinapps application.
