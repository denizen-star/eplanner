# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development server (nodemon watching server.js)
npm start        # Production server on $PORT (default 3000)
npm install      # Install dependencies
```

No test framework, linter, or build step is configured.

## Architecture

**EventPlan (eplanner)** is a multi-tenant community event management platform. It is a vanilla JS frontend served as static HTML, backed by Express.js locally and Netlify Functions in production, with a PlanetScale (MySQL) database.

### Stack

- **Frontend:** Static HTML pages + vanilla JS modules in `assets/js/` (no build step, no framework)
- **Backend:** `netlify/functions/` — 21 serverless functions for production; `server.js` wraps them via Express for local dev
- **Database:** PlanetScale MySQL (`lib/databaseClient.js`), single database `kervapps`
- **Email:** Nodemailer SMTP (`lib/emailService.js` + `lib/emailTemplates.js`)
- **Deployment:** Netlify — `netlify.toml` defines redirects, headers, geo-blocking, and function routing

### Multi-Tenancy

`lib/tenant.js` is the single source of truth for hostname→tenant resolution. Two products share the codebase:
- `*.lgbtq-hub.com` — LGBTQ+ Activity Planner (Toronto-centered)
- `*.eplanner.kervinapps.com` — Event Planner (Miami-centered)

Tenant config (branding, map center, hero CTAs) is stored in `ep_tenants.config_json` and fetched client-side via `GET /api/tenant-config`. The `assets/js/domain-variant.js` module applies branding to the DOM.

### Database Schema

Four tables, all prefixed `ep_`:
- `ep_events` — events with 7-char alphanumeric short ID + UUID, location, planner info, optional payment/picture
- `ep_signups` — participant signups (name, phone, email, Instagram, waiver status)
- `ep_waivers` — waiver text + consent metadata per signup
- `ep_tenants` — per-tenant branding and config

No foreign keys (PlanetScale limitation); referential integrity is handled in application code.

### Key File Locations

| Concern | Files |
|---|---|
| Event creation form | `coordinate.html`, `assets/js/coordinate.js` |
| Participant signup | `signup.html`, `assets/js/signup.js` |
| Event management | `manage.html`, `assets/js/manage.js` |
| Public calendar | `calendar.html`, `assets/js/calendar-view.js` |
| Tenant branding | `assets/js/domain-variant.js`, `lib/tenant.js` |
| DB operations | `lib/databaseClient.js` |
| Email | `lib/emailService.js`, `lib/emailTemplates.js` |
| API functions | `netlify/functions/runs-*.js`, `netlify/functions/run-get.js` |
| Schema | `lib/schema.sql`, `lib/migration-*.sql` |
| Routing | `netlify.toml` (redirects section) |

### API Endpoints (Netlify Functions)

```
POST /api/runs/create              → runs-create.js
POST /api/runs/:runId/signup       → runs-signup.js
GET  /api/runs/:runId/signups      → runs-signups.js
GET  /api/runs/:runId              → run-get.js
GET  /api/runs                     → runs-get.js
POST /api/runs/:runId/cancel       → runs-cancel.js
GET  /api/tenant-config            → tenant-config.js
GET  /api/event-image/:runId       → event-image.js
POST /api/analytics/event          → analytics-event.js
GET  /health                       → health.js
```

### Environment Variables

```bash
# Database (PlanetScale)
DATABASE_URL=mysql://user:pass@host/dbname
# OR:
PLANETSCALE_HOST=...
PLANETSCALE_USERNAME=...
PLANETSCALE_PASSWORD=...
PLANETSCALE_DATABASE=kervapps

# Email
EMAIL_ENABLED=true
SMTP_SERVER=smtp.zoho.com
SMTP_PORT=587
SENDER_EMAIL=noreply@example.com
SENDER_PASSWORD=...

# Admin
ADMIN_PASSWORD=...
```

### Conventions

- **Table/column naming:** `ep_*` table prefix; SQL columns use snake_case, aliased to camelCase in queries
- **Event IDs:** 7-char alphanumeric short ID (user-facing) + UUID (internal)
- **Images:** Stored as base64 in the database column
- **CSS:** Single file `assets/css/main.css` using CSS custom properties (`--bg-primary`, `--text-secondary`, etc.)
- **Logging:** `console.log('[COMPONENT] message')` pattern throughout server-side code
- **Legacy aliases:** `pacerName` → `plannerName`, snake_case → camelCase field aliases maintained for backward compatibility
- **Cache busting:** JS files include version strings (e.g., `v4.0.0`) in comments/identifiers
