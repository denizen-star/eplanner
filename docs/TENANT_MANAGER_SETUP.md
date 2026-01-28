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

**Saved for later?** A detailed, step-by-step walkthrough is in **`docs/DNS_AND_NETLIFY_SUBDOMAIN_SETUP.md`**. Use that when you’re ready to configure subdomains.

The Tenant Manager UI generates **DNS & Netlify steps** for each tenant you create. You still need to perform these steps yourself (no automated DNS). Until both DNS and Netlify are set up for a subdomain, users cannot open that tenant’s URL (e.g. `mia.lgbtq-hub.com`).

**What we’re doing:**  
1. **DNS:** Tell the internet “when someone visits `mia.lgbtq-hub.com`, send them to my Netlify site.”  
2. **Netlify:** Tell Netlify “accept requests for `mia.lgbtq-hub.com` and serve my app.”  
3. **HTTPS:** Netlify automatically gets a certificate for that domain; you don’t configure anything extra.

You can either add **one subdomain at a time** (e.g. `mia`, then `ny`) or use a **wildcard** (e.g. `*.lgbtq-hub.com`) so every subdomain under that domain works without adding each one individually.

---

### Option A: Add One Subdomain at a Time (e.g. `mia.lgbtq-hub.com`)

Use this when you have a small number of subdomains or want to add them as you create tenants.

#### Step 1: Find your Netlify site URL

1. Go to [app.netlify.com](https://app.netlify.com) and open your Event Planner site.
2. On the site overview, look at the **Site name** (e.g. `eplanner` or `eventplan`). The site URL is **`<site-name>.netlify.app`** (e.g. `eplanner.netlify.app`).
3. If you use a custom domain (e.g. `lgbtq-hub.com`), you can still CNAME subdomains to **`<site-name>.netlify.app`**. That’s the target we’ll use below.

Write it down: **`_______________________.netlify.app`**

#### Step 2: Add a CNAME record in your DNS provider

Your DNS is wherever your domain is managed (e.g. Cloudflare, Namecheap, Google Domains, GoDaddy, or Netlify DNS if you use it).

1. Log in to that DNS provider and open the **DNS** or **DNS records** section for the domain (e.g. `lgbtq-hub.com` or `kervinapps.com`).
2. **Add a new record** (often a button like “Add record”, “Add”, “Create”).
3. Set:
   - **Type:** `CNAME`
   - **Name / Host / Subdomain:**  
     - For `mia.lgbtq-hub.com` → enter **`mia`** only (not `mia.lgbtq-hub.com`).  
     - Some providers show a full hostname; use **`mia.lgbtq-hub.com`** if that’s the format they expect.  
     - For `mywedding.eplanner.kervinapps.com` → enter **`mywedding.eplanner`** (or whatever matches “subdomain of `kervinapps.com`” in your provider).
   - **Target / Value / Points to:** your Netlify site URL, e.g. **`eplanner.netlify.app`** (or `apex-loadbalancer.netlify.app` if Netlify explicitly tells you to use that for your setup).  
     - Use the **exact** value Netlify shows for your site when you add a custom domain; no `https://`, no trailing slash.
   - **TTL:** default is fine (e.g. 3600 or “Automatic”).
4. **Save** the record.
5. DNS can take a few minutes to a few hours to update. You can check with `nslookup mia.lgbtq-hub.com` (or your subdomain) in a terminal; once it returns your Netlify target, DNS is ready.

#### Step 3: Add the subdomain in Netlify

1. In Netlify, open your site → **Site configuration** (or **Domain settings**).
2. Under **Domain management**, find **Domains** (or **Custom domains**).
3. Click **Add custom domain** / **Add domain** / **Add subdomain**.
4. Enter the **full subdomain** you’re setting up, e.g. **`mia.lgbtq-hub.com`** or **`mywedding.eplanner.kervinapps.com`**.
5. Click **Verify** / **Add**. Netlify will check that DNS points to them. If you get an error, wait for DNS to propagate (Step 2) and try again.
6. Once added, Netlify will provision an **HTTPS certificate** for that domain. You don’t need to do anything else; wait until the domain shows as “Verified” or “HTTPS ready.”

#### Step 4: Confirm it works

Open **`https://mia.lgbtq-hub.com`** (or your subdomain) in a browser. You should see your app. If you get a 404 or “site not found,” double‑check that both the DNS record and the Netlify domain entry match exactly (no typos, correct subdomain).

---

### Option B: Use a Wildcard (all subdomains at once)

Use this when you have many subdomains (e.g. many cities or event types) and don’t want to add each one manually.

#### Step 1: Find your Netlify site URL

Same as Option A, Step 1. You need **`<site-name>.netlify.app`**.

#### Step 2: Add a wildcard CNAME in DNS

1. In your DNS provider, **add a new record**.
2. Set:
   - **Type:** `CNAME`
   - **Name / Host:** **`*`** (asterisk).  
     - For `*.lgbtq-hub.com` that’s usually just **`*`**.  
     - For `*.eplanner.kervinapps.com` some providers want **`*.eplanner`** (asterisk + `.eplanner`). Check your provider’s docs for “wildcard subdomain.”
   - **Target / Value:** your Netlify site URL, e.g. **`eplanner.netlify.app`**.
   - **TTL:** default.
3. **Save.**  
   This single record makes **every** subdomain (e.g. `mia`, `ny`, `atx`) resolve to your Netlify site.

#### Step 3: Add the wildcard domain in Netlify

1. In Netlify → **Domain settings** → **Domains** → **Add custom domain**.
2. Enter **`*.lgbtq-hub.com`** or **`*.eplanner.kervinapps.com`** (depending on which domain you use).
3. **Verify** / **Add**. Netlify will check DNS for the wildcard. Again, if it fails, wait for DNS propagation and retry.
4. Netlify will provision HTTPS for the wildcard. No extra config needed.

#### Step 4: Confirm

Visit **`https://mia.lgbtq-hub.com`** (or any subdomain you use). It should load your app. You can create new tenants in the Tenant Manager (e.g. `ny`, `atx`) without adding DNS or Netlify entries for each one; the wildcard covers them.

---

### Quick reference

| Task | Option A (per subdomain) | Option B (wildcard) |
|------|--------------------------|---------------------|
| **DNS record type** | CNAME | CNAME |
| **DNS name** | `mia` (or `mywedding.eplanner`) | `*` (or `*.eplanner`) |
| **DNS target** | `yoursite.netlify.app` | `yoursite.netlify.app` |
| **Netlify domain** | `mia.lgbtq-hub.com` | `*.lgbtq-hub.com` |
| **Add new tenant?** | Add new CNAME + new Netlify domain each time | No extra DNS/Netlify; wildcard already covers it |

---

### HTTPS

Netlify provisions and renews HTTPS for domains you add (including wildcards). You don’t need to configure certificates yourself. Just add the domain in Netlify and wait until it shows as verified.

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
