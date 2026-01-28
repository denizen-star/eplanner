# Why EventPlan Works (Architecture Decisions & Pitfalls)

This document summarizes **why the EventPlan system works the way it does**, based on the implementation notes and historical guides in `docs/` (including archived docs).

## High-level architecture (what runs where)

- **Frontend**: static HTML/CSS/JS pages (e.g. `index.html`, `event.html`, `signup.html`, `admin.html`) served by Netlify.
- **API layer**: Netlify Functions under `netlify/functions/` (serverless HTTP endpoints).
- **Local dev**: `server.js` mirrors the Netlify API routes for local testing.
- **Single data store**: PlanetScale (MySQL-compatible) is the source of truth.

Why this works:
- Static pages keep the UX fast and cheap to host.
- Serverless functions scale on-demand and keep secrets (DB creds, SMTP creds) off the client.
- A single database avoids state divergence and simplifies debugging.

## Data model & “single source of truth”

EventPlan is DB-first and DB-only:

- **`ep_events`**: the event record (time, location, capacity, status, links, metadata).
- **`ep_signups`**: signups for a given event (plus metadata like device info).
- **`ep_waivers`**: stored waiver acceptance text + signature timestamp.
- **`ep_tenants`**: tenant configuration for subdomain-based isolation + branding (and optional sender email override).
- **`app_events`** (telemetry): app-level analytics events (if enabled/used).

Why this works:
- Tables map cleanly to the product concepts (events, signups, waivers, tenants).
- Indexing on the common access paths (date, tenant, status) keeps reads fast enough without a cache.

## Migrations: “migration first” is non-negotiable

**Core rule**: run DB migrations **before** deploying code that SELECTs/INSERTs/UPDATEs new columns.

Why this matters:
- The app relies on shared SELECT field lists (e.g. `EVENT_SELECT_FIELDS`). If code starts selecting a column that doesn’t exist yet, **every endpoint that uses that field list can fail**, which cascades into:
  - 500/502 errors in Netlify functions
  - broken event creation/viewing/admin pages

Safe workflow (PlanetScale):
- Use a **development branch** for schema changes, verify, then **promote to main**.
- Deploy the app after the main branch has the schema change (or ensure your deploy points at a DB branch that has it).

Pitfall to avoid:
- Don’t “just add a column to `EVENT_SELECT_FIELDS`” without verifying the production schema first.

## Multi-tenancy (v11): `tenant_key` + `ep_tenants`

EventPlan supports subdomain-based tenants:

- **`tenant_key`** on `ep_events` provides per-tenant data isolation.
- **`ep_tenants`** stores per-tenant config (branding JSON) and optional **sender email override**.
- Admin endpoints are protected by **`ADMIN_PASSWORD`** (header-based auth for admin/tenant management).

Why this works:
- Hostname → tenant resolution is deterministic, enabling one deploy to serve multiple tenant “skins”.
- Filtering by `tenant_key` prevents cross-tenant data leakage.

Pitfalls to avoid:
- Missing `ADMIN_PASSWORD` will cause admin tenant APIs/UI to return 401.
- If the DB migration for `tenant_key` / `ep_tenants` isn’t applied, tenant-aware queries will fail.

## Domain/app filtering: `app_name` and “specific before generic”

Domain-based filtering exists alongside tenancy:

- **`app_name`** supports domain-level separation (e.g. different branded domains).
- For hostname detection, checks must be ordered **most specific first**, then generic.

Why this works:
- Avoids collisions where a generic substring matches a more specific domain.

Pitfall to avoid:
- Incorrect detection order will silently categorize events into the wrong `app_name`, leading to “missing events” on one domain and “extra events” on another.

## Email subsystem: config-driven, tenant-aware, non-blocking

Email is built around:
- **Environment variables** (Netlify) / `.env` (local) for SMTP credentials and feature flags.
- **Non-blocking behavior**: email failures should not fail the main action (create/signup/update).
- **Tenant sender overrides**: optional per-tenant sender address (while SMTP auth remains global).

Why this works:
- Keeps secrets out of git and out of the browser.
- Keeps core flows reliable even when SMTP misbehaves.

Pitfalls to avoid:
- **Never log secrets** (SMTP passwords, admin passwords).
- Node runtime compatibility matters: Netlify functions are CommonJS; prefer Node 18+ features (native `fetch`) and avoid mixing ESM-only libs with `require()`.
- Email size constraints: large images can push emails over provider limits; using optimized images/data URIs and compression can be necessary.

## Cancellation: auditability + UX safety

Cancellation is designed around:
- Explicit DB fields (`cancelled_at`, `cancellation_message`) and status updates.
- Coordinator verification (email check) to reduce accidental/malicious cancellation.
- In-page modals/overlays instead of browser `alert()`/`confirm()` for a modern UX.

Why this works:
- Cancellation is durable (stored in DB), explainable (message), and easier to support.

Pitfall to avoid:
- Introducing cancellation fields in code before DB has the columns can break unrelated endpoints.

## Netlify routing: specific redirects before pattern redirects

Netlify redirect rules can conflict when pattern routes exist (e.g. `/api/runs/:runId`).

Why this matters:
- A specific endpoint like `/api/runs/public-calendar` can be swallowed by a pattern route unless the redirect order is correct.

Rule:
- Put **specific redirects first**, then pattern-based ones.

## Frontend dependencies: maps and “wait until ready”

Some pages rely on third-party scripts (e.g. map libraries). These can load unpredictably.

Why this works:
- “Dependency checking + retry” prevents race-condition failures (especially on slower devices or CDN hiccups).

Pitfall to avoid:
- Initializing maps immediately on DOMContentLoaded without checking dependencies can cause intermittent failures.

## Operational debugging (what to check first)

When something breaks:

1. **Netlify function logs** (errors, DB connection, query errors).
2. **Environment variables** (DATABASE_URL, ADMIN_PASSWORD, email vars).
3. **Schema alignment** (`lib/schema.sql` vs production schema).
4. **Recent changes touching shared query code** (e.g. SELECT field lists).

---

## Where this was derived from

- Setup docs in `docs/setup/`
- Troubleshooting docs in `docs/troubleshooting/`
- Feature docs in `docs/features/`
- Historical implementation notes archived in `docs/_archive/`

