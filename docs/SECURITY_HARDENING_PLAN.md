# Security Hardening Plan

**Overall Progress:** `0%`

## TLDR
Address the security and reliability issues identified in the March 2026 code review. Fixes are scoped to the existing codebase with no new dependencies or architectural changes — just targeted patches to the current Express/Netlify Functions/vanilla JS stack.

## Critical Decisions
- **No new auth framework:** Fix the existing `requireAdmin()` pattern (timing-safe compare + remove client-bypass headers) rather than introducing JWT/OAuth2.
- **No new npm packages:** Use Node built-ins (`crypto`) and existing helpers; avoid adding `express-rate-limit`, `DOMPurify`, etc. unless a step explicitly requires it.
- **Incremental scope:** Each step is self-contained and independently deployable. Do not bundle unrelated changes.
- **Frontend XSS fix:** Use `createElement`/`setAttribute` instead of `innerHTML` for user-adjacent data; no sanitization library needed for current usage.

---

## Tasks

### Phase 1 — Critical (Do First)

- [ ] 🟥 **Step 1: Fix TLS cert validation in email service**
  - [ ] 🟥 Remove `rejectUnauthorized: false` from both SMTP transporter configs in `lib/emailService.js` (lines 162, 168)
  - [ ] 🟥 Gate it behind a dev-only env var: `rejectUnauthorized: process.env.SMTP_ALLOW_SELF_SIGNED !== 'true'`

- [ ] 🟥 **Step 2: Timing-safe admin password comparison**
  - [ ] 🟥 Replace `pw === expected` in `netlify/functions/utils.js:83` with `crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(expected))`
  - [ ] 🟥 Guard against unequal-length buffers (throws otherwise) — wrap in try/catch returning `false`

- [ ] 🟥 **Step 3: Remove client-controlled admin bypass in runs-cancel**
  - [ ] 🟥 Delete `queryStringParameters?.isAdmin` and `x-is-admin` / `X-Is-Admin` header checks from `netlify/functions/runs-cancel.js:48`
  - [ ] 🟥 Ensure the only admin path is through the existing `requireAdmin(event)` call

---

### Phase 2 — High

- [ ] 🟥 **Step 4: Fix XSS in signup.js link rendering**
  - [ ] 🟥 Replace `innerHTML` template literal in `assets/js/signup.js:301–306` with `createElement`/`setAttribute` for `href`, `textContent` for label and icon
  - [ ] 🟥 Validate `link.url` via `new URL(link.url)` and reject `javascript:` scheme

- [ ] 🟥 **Step 5: Add rate limiting to mass email send**
  - [ ] 🟥 Add a 100ms delay between sends in `netlify/functions/admin-send-weekly-digest.js` using `await new Promise(r => setTimeout(r, 100))`
  - [ ] 🟥 Add a hard cap (e.g., `MAX_SEND = 500`) with early exit and logged warning if exceeded

- [ ] 🟥 **Step 6: Sanitize error messages in admin.js**
  - [ ] 🟥 Replace `error.message` in DOM injection with a generic string: `'An error occurred. Please try again.'`
  - [ ] 🟥 Log the real error to `console.error` only (not to DOM)

---

### Phase 3 — Medium

- [ ] 🟥 **Step 7: Input validation in runs-create**
  - [ ] 🟥 Validate `timezone` against `Intl.supportedValuesOf('timeZone')`
  - [ ] 🟥 Validate `coordinates` for valid lat/lon range and array length
  - [ ] 🟥 Cap `picture` base64 at ~2MB, `title` at 200 chars, `description` at 5000 chars

- [ ] 🟥 **Step 8: Prevent duplicate signups**
  - [ ] 🟥 In `netlify/functions/runs-signup.js`, query for existing signup by `run_id + email` before inserting
  - [ ] 🟥 Return `400 { error: 'Already registered for this event' }` if duplicate found

- [ ] 🟥 **Step 9: Startup env var validation**
  - [ ] 🟥 In `server.js`, check required vars (`DATABASE_URL` or `PLANETSCALE_HOST`, `ADMIN_PASSWORD`) at startup
  - [ ] 🟥 Log missing vars and `process.exit(1)` if any are absent

- [ ] 🟥 **Step 10: Move hardcoded WhatsApp link to tenant config**
  - [ ] 🟥 Remove `WHATSAPP_GROUP_LINK` constant from `lib/tenant.js:45`
  - [ ] 🟥 Read from `ep_tenants.config_json` field; fall back gracefully if absent

- [ ] 🟥 **Step 11: Fix silent error swallowing in domain-variant.js**
  - [ ] 🟥 In `assets/js/domain-variant.js:275`, update `.catch()` to log: `console.error('[DOMAIN-VARIANT] tenant config failed:', err)`

---

### Phase 4 — Low / Polish

- [ ] 🟥 **Step 12: Remove TODO comment from coordinate.js**
  - [ ] 🟥 Delete the TODO at `assets/js/coordinate.js:577`; open a GitHub issue for the `pacer_name` rename instead

- [ ] 🟥 **Step 13: Graceful shutdown for DB connection**
  - [ ] 🟥 In `server.js`, add `process.on('SIGTERM', ...)` to close the DB connection pool before exit

- [ ] 🟥 **Step 14: Restrict verbose debug logs**
  - [ ] 🟥 Wrap coordinate/email/request-detail logs in Netlify functions behind `process.env.LOG_LEVEL === 'debug'` guard
