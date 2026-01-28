# Tenant Manager Setup: What You Need to Do

This guide explains the steps required to make the Tenant Manager (subdomain tenants, branding, per-tenant data isolation) work in your environment.

---

## 1. Run the Database Migration

The Tenant Manager uses a new `tenant_key` column on events and an `ep_tenants` table. You must run the migration in PlanetScale **before** using the feature.

1. Open your PlanetScale dashboard and select the **kervapps** database.
2. Use the **Branches** workflow: create or use a **development** branch.
3. In that branch, run the SQL from **`lib/migration-add-tenant-key.sql`**:
   - Adds `tenant_key` to `ep_events` and backfills existing rows.
   - Creates `ep_tenants` and indexes.
4. **Promote** the development branch to **main** (or merge as per your PlanetScale workflow).
5. Ensure your Netlify (and local) **DATABASE_URL** (or PlanetScale env vars) point at the **main** branch after promotion.

If you skip this step, event create/calendar and Tenant Manager APIs will fail when they touch `tenant_key` or `ep_tenants`.

---

## 2. Set Environment Variables

### Netlify

1. **Site settings → Environment variables**.
2. Add **`ADMIN_PASSWORD`**:
   - **Key:** `ADMIN_PASSWORD`
   - **Value:** A strong shared secret (used to protect Tenant Manager API and UI login).
   - **Scopes:** Production (and Deploy previews / Branch deploys if you use them).

3. Keep your existing **DATABASE_URL** (or PlanetScale vars) and **email-related** vars (`SENDER_EMAIL`, `SENDER_PASSWORD`, etc.) unchanged.  
   Tenant Manager only adds `ADMIN_PASSWORD`.

### Local Development

1. In your project root, ensure `.env` exists (or your chosen env mechanism).
2. Add **`ADMIN_PASSWORD`** with the same value you use in Netlify (or a dev-only secret).
3. Keep **DATABASE_URL** and email vars as they are.

Without `ADMIN_PASSWORD`, the Tenant Manager UI login and all **Admin Tenant** API calls (`GET/POST /api/admin/tenants`, `PUT/DELETE /api/admin/tenants/:tenantKey`) will return **401 Unauthorized**.

---

## 3. Redeploy

- **Netlify:** Trigger a new deploy (e.g. push to your connected branch or “Deploy site” from the Deploys tab) so `ADMIN_PASSWORD` and any DB changes are applied.
- **Local:** Restart your dev server (`npm run dev` or `node server.js`) after changing `.env`.

---

## 4. DNS and Netlify Domains (Per Subdomain)

The Tenant Manager UI generates **DNS & Netlify steps** for each tenant you create. You still need to perform these steps yourself (no automated DNS).

For each new subdomain (e.g. `mia.lgbtq-hub.com`, `mywedding.eplanner.kervinapps.com`):

1. **DNS**
   - Add a **CNAME** (or A/ALIAS if your DNS supports it) for the subdomain pointing at your Netlify site (e.g. `apex-loadbalancer.netlify.app` or your custom domain target).
   - For wildcard setups, you can use `*.lgbtq-hub.com` or `*.eplanner.kervinapps.com` so all subdomains resolve to the same Netlify site.

2. **Netlify**
   - **Site settings → Domain management → Add custom domain** (or **Add subdomain**).
   - Add the specific subdomain (e.g. `mia.lgbtq-hub.com`) or configure wildcard domains as allowed by Netlify.

3. **HTTPS**
   - Let Netlify provision the certificate for the new (sub)domain. No extra config is needed for the app.

Until DNS and Netlify domain are set up for a subdomain, users will not be able to reach that tenant via its URL.

---

## 5. Using the Tenant Manager UI

1. Open **Admin** → **Tenant Manager** (collapsible section).
2. Enter **Admin password** (same as `ADMIN_PASSWORD`) and log in.
3. Create tenants (product + subdomain), optionally set branding (favicon, logo, title, hero CTAs) and **sender email**.
4. Use the **DNS & Netlify steps** text block generated in the UI for each tenant; follow those steps in your DNS and Netlify dashboards.

For a step-by-step guide on **creating and editing tenants** in the UI, see the **Create Domain Tenant** guide in the User Guides menu (Admin page).

---

## 6. Optional: Sender Email Override

- **SMTP** (e.g. Zoho) stays configured via **SENDER_EMAIL** / **SENDER_PASSWORD** (or your existing env vars).
- In the Tenant Manager UI you can set an optional **sender email** per tenant.  
  That value overrides only the **From** address for emails sent for that tenant (signup, event created, cancellation, etc.); SMTP auth still uses your global Zoho config.

---

## Summary Checklist

| Step | Action |
|------|--------|
| 1 | Run **`lib/migration-add-tenant-key.sql`** in PlanetScale (dev branch, then promote to main). |
| 2 | Set **`ADMIN_PASSWORD`** in Netlify and, if applicable, in local `.env`. |
| 3 | Redeploy Netlify and restart local dev server. |
| 4 | For each new subdomain: add DNS CNAME (or wildcard) and add domain in Netlify. |
| 5 | Use **Admin → Tenant Manager** to create tenants and follow the generated DNS & Netlify steps. |

---

## Troubleshooting

- **401 on Tenant Manager / Admin tenant APIs**  
  → `ADMIN_PASSWORD` missing or incorrect; redeploy/restart after changing it.

- **Errors about `tenant_key` or `ep_tenants`**  
  → Migration not run or app still pointing at a DB branch without the migration.

- **Subdomain returns 404 or doesn’t load**  
  → DNS and/or Netlify domain not configured for that subdomain; use the UI-generated DNS & Netlify steps.

- **Emails not using tenant sender**  
  → Confirm the tenant has **Sender email** set in Tenant Manager and that you’re sending from that tenant’s host (so the correct tenant config is used).
