# DNS and Netlify Subdomain Setup (Saved for Later)

**Use this when you’re ready to configure subdomains** (e.g. `mia.lgbtq-hub.com`, `mywedding.eplanner.kervinapps.com`) for the Tenant Manager. You can skip this until you need to add or use a new tenant URL.

This is the detailed step-by-step walkthrough. It’s also summarized in **TENANT_MANAGER_SETUP.md** (section 4).

---

## What we’re doing

1. **DNS:** Tell the internet “when someone visits `mia.lgbtq-hub.com`, send them to my Netlify site.”
2. **Netlify:** Tell Netlify “accept requests for `mia.lgbtq-hub.com` and serve my app.”
3. **HTTPS:** Netlify automatically gets a certificate for that domain; you don’t configure anything extra.

You can either add **one subdomain at a time** (e.g. `mia`, then `ny`) or use a **wildcard** (e.g. `*.lgbtq-hub.com`) so every subdomain under that domain works without adding each one individually.

---

## Option A: Add One Subdomain at a Time (e.g. `mia.lgbtq-hub.com`)

Use this when you have a small number of subdomains or want to add them as you create tenants.

### Step 1: Find your Netlify site URL

1. Go to [app.netlify.com](https://app.netlify.com) and open your Event Planner site.
2. On the site overview, look at the **Site name** (e.g. `eplanner` or `eventplan`). The site URL is **`<site-name>.netlify.app`** (e.g. `eplanner.netlify.app`).
3. If you use a custom domain (e.g. `lgbtq-hub.com`), you can still CNAME subdomains to **`<site-name>.netlify.app`**. That’s the target we’ll use below.

Write it down: **`_______________________.netlify.app`**

### Step 2: Add a CNAME record in your DNS provider

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

### Step 3: Add the subdomain in Netlify

1. In Netlify, open your site → **Site configuration** (or **Domain settings**).
2. Under **Domain management**, find **Domains** (or **Custom domains**).
3. Click **Add custom domain** / **Add domain** / **Add subdomain**.
4. Enter the **full subdomain** you’re setting up, e.g. **`mia.lgbtq-hub.com`** or **`mywedding.eplanner.kervinapps.com`**.
5. Click **Verify** / **Add**. Netlify will check that DNS points to them. If you get an error, wait for DNS to propagate (Step 2) and try again.
6. Once added, Netlify will provision an **HTTPS certificate** for that domain. You don’t need to do anything else; wait until the domain shows as “Verified” or “HTTPS ready.”

### Step 4: Confirm it works

Open **`https://mia.lgbtq-hub.com`** (or your subdomain) in a browser. You should see your app. If you get a 404 or “site not found,” double-check that both the DNS record and the Netlify domain entry match exactly (no typos, correct subdomain).

---

## Option B: Use a Wildcard (all subdomains at once)

Use this when you have many subdomains (e.g. many cities or event types) and don’t want to add each one manually.

### Step 1: Find your Netlify site URL

Same as Option A, Step 1. You need **`<site-name>.netlify.app`**.

### Step 2: Add a wildcard CNAME in DNS

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

### Step 3: Add the wildcard domain in Netlify

1. In Netlify → **Domain settings** → **Domains** → **Add custom domain**.
2. Enter **`*.lgbtq-hub.com`** or **`*.eplanner.kervinapps.com`** (depending on which domain you use).
3. **Verify** / **Add**. Netlify will check DNS for the wildcard. Again, if it fails, wait for DNS propagation and retry.
4. Netlify will provision HTTPS for the wildcard. No extra config needed.

### Step 4: Confirm

Visit **`https://mia.lgbtq-hub.com`** (or any subdomain you use). It should load your app. You can create new tenants in the Tenant Manager (e.g. `ny`, `atx`) without adding DNS or Netlify entries for each one; the wildcard covers them.

---

## Quick reference

| Task | Option A (per subdomain) | Option B (wildcard) |
|------|--------------------------|---------------------|
| **DNS record type** | CNAME | CNAME |
| **DNS name** | `mia` (or `mywedding.eplanner`) | `*` (or `*.eplanner`) |
| **DNS target** | `yoursite.netlify.app` | `yoursite.netlify.app` |
| **Netlify domain** | `mia.lgbtq-hub.com` | `*.lgbtq-hub.com` |
| **Add new tenant?** | Add new CNAME + new Netlify domain each time | No extra DNS/Netlify; wildcard already covers it |

---

## HTTPS

Netlify provisions and renews HTTPS for domains you add (including wildcards). You don’t need to configure certificates yourself. Just add the domain in Netlify and wait until it shows as verified.

---

## Troubleshooting

- **Netlify says “DNS not configured” or “Domain not verified”**  
  Wait for DNS to propagate (often 5–30 minutes, sometimes longer). Double-check the CNAME **name** and **target** match exactly (no typos). Use `nslookup your-subdomain.lgbtq-hub.com` to confirm it points to your Netlify URL.

- **Subdomain loads but shows 404**  
  DNS is fine. Check that you added the domain in Netlify (Domain settings → Domains) and that it shows as verified. The app serves the same site for all domains; 404 usually means Netlify isn’t routing that host to your site yet.

- **Wildcard doesn’t work for a new subdomain**  
  Confirm the wildcard CNAME (`*`) and Netlify domain (`*.lgbtq-hub.com` or `*.eplanner.kervinapps.com`) are set up. Create the tenant in Tenant Manager first; the subdomain must match the tenant’s product + subdomain (e.g. `mia` for `lgbtq-hub` → `mia.lgbtq-hub.com`).
