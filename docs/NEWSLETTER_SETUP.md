# Newsletter Setup: Secret and Email Deliverability

Step-by-step instructions for the two remaining setup items.

---

## 1. Set NEWSLETTER_UNSUBSCRIBE_SECRET

This secret is used to sign unsubscribe links so they cannot be forged. The same value must be set anywhere the app runs (Netlify and, if you test locally, your machine).

### What value to use

- Use a long, random string (e.g. 32+ characters).
- Do not use a real password or anything you use elsewhere.
- You can generate one with:
  - **Node:** `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - **OpenSSL:** `openssl rand -base64 32`
  - Or any password generator (32+ random letters/numbers/symbols).

### Where to set it

**Netlify (production)**

1. Open your site in the Netlify dashboard.
2. Go to **Site configuration** (or **Site settings**) → **Environment variables**.
3. Click **Add a variable** or **Add environment variable**.
4. Set:
   - **Key:** `NEWSLETTER_UNSUBSCRIBE_SECRET`
   - **Value:** the long random string you generated.
   - **Scopes:** leave default (e.g. “All” or “Production”) so it’s available to the functions that send the digest and handle unsubscribe.
5. Save. Redeploy the site (or trigger a new deploy) so the new variable is picked up.

**Local development (optional)**

If you test “Send Weekly Events Email” or the unsubscribe link locally:

- Add the same value to a `.env` file in the project root:
  ```bash
  NEWSLETTER_UNSUBSCRIBE_SECRET=your_same_secret_here
  ```
- Or export it in your shell before starting the server:
  ```bash
  export NEWSLETTER_UNSUBSCRIBE_SECRET='your_same_secret_here'
  ```

**Important:** Use the **same** secret in Netlify and locally so links generated in one environment work when opened in the other (e.g. link from a locally sent email still works when the site is on Netlify).

### How the app uses it

- When the admin sends the weekly digest, the backend builds an unsubscribe URL that includes a signed token (HMAC of the payload using this secret). See `lib/newsletterUnsubscribe.js`.
- When a user clicks the link, `newsletter-unsubscribe` verifies the signature; if the secret is missing or wrong, verification fails and the link is rejected.

---

## 2. SPF, DKIM, and DMARC for Sending Domains

Newsletter “From” addresses are:

- **eplanner:** `info@kervinapps.com`
- **to-lgbtq / lgbtq-hub:** `info@lgbtq-hub.com`

To avoid landing in spam and to comply with best practice, configure DNS and your mail provider for each domain.

### Overview

| Record | Purpose |
|--------|--------|
| **SPF** | Tells receiving servers which hosts are allowed to send mail for the domain. |
| **DKIM** | Adds a cryptographic signature so receivers can verify the message wasn’t altered and came from an authorized sender. |
| **DMARC** | Tells receivers what to do when SPF/DKIM fail (e.g. quarantine or reject) and where to send reports. |

You do **not** configure these in the EventPlan codebase; they are DNS records for `kervinapps.com` and `lgbtq-hub.com`, plus settings in the SMTP provider you use (Zoho, Gmail, SendGrid, etc.).

### Step 1: Identify your SMTP provider

Your app sends mail via the credentials in Netlify env (e.g. `SMTP_SERVER`, `SENDER_EMAIL`, `SENDER_PASSWORD`). Common cases:

- **Zoho Mail** – SMTP e.g. `smtp.zoho.com` (or `smtp.zoho.eu` etc.), and the “From” address is a Zoho mailbox (e.g. `info@kervinapps.com`).
- **Google Workspace** – SMTP `smtp.gmail.com`, address like `info@kervinapps.com` on your domain.
- **SendGrid / Mailgun / Amazon SES** – You use their SMTP or API; the “From” is your domain and they give you DNS records to add.

The exact steps depend on that provider. Below is a generic outline; your provider’s docs will have the precise values.

### Step 2: SPF (TXT record)

- **What:** One TXT record for each domain at the **root** of the domain (e.g. `kervinapps.com`, `lgbtq-hub.com`), not for a subdomain unless you send from that subdomain.
- **Where:** Your DNS host (where you manage DNS for `kervinapps.com` and `lgbtq-hub.com`) – e.g. Cloudflare, Namecheap, GoDaddy, or the same place you bought the domain.
- **Example (one sending server):**
  - For **kervinapps.com** (if you send via Zoho):
    - **Host/Name:** `@` or `kervinapps.com` (leave blank or root depending on DNS UI).
    - **Type:** TXT
    - **Value:** `v=spf1 include:zoho.com ~all`
  - For **lgbtq-hub.com** (if same provider):
    - **Host/Name:** `@` or `lgbtq-hub.com`
    - **Type:** TXT
    - **Value:** `v=spf1 include:zoho.com ~all`
- **If you use Gmail/Google Workspace:** `v=spf1 include:_spf.google.com ~all`
- **If you use SendGrid:** they’ll give something like `v=spf1 include:sendgrid.net ~all`
- **Important:** You can only have **one** SPF TXT record per domain. If you already have one (e.g. `v=spf1 include:zoho.com ~all`), add the new provider with an extra `include:`, e.g. `v=spf1 include:zoho.com include:sendgrid.net ~all`. Do not create two separate SPF records.

### Step 3: DKIM

- **What:** Your **mail provider** (Zoho, Google, SendGrid, etc.) generates a DKIM “selector” and a public key. You add a TXT record they give you.
- **Where:** In the provider’s dashboard (e.g. Zoho Mail Admin → Domains → DKIM; or SendGrid → Settings → Sender Authentication). They show something like:
  - **Host:** `selector._domainkey.kervinapps.com` (selector name varies)
  - **Type:** TXT
  - **Value:** `v=DKIM1; k=rsa; p=...long key...`
- **Action:** In your DNS for `kervinapps.com` (and similarly for `lgbtq-hub.com`), create that exact TXT record. Wait for DNS to propagate (minutes to hours), then in the provider’s UI click “Verify” or “Enable DKIM”.

Repeat for the other domain if you use a different mailbox (e.g. `info@lgbtq-hub.com`) or the same provider for both.

### Step 4: DMARC (optional but recommended)

- **What:** A TXT record that tells receivers your policy (what to do if SPF/DKIM fail) and where to send aggregate/forensic reports.
- **Where:** DNS for each sending domain.
- **Example (start in monitoring mode):**
  - **Host/Name:** `_dmarc.kervinapps.com` (often you enter `_dmarc` and the host is auto-completed).
  - **Type:** TXT
  - **Value:** `v=DMARC1; p=none; rua=mailto:dmarc-reports@kervinapps.com`
  - Meaning: “Don’t reject or quarantine yet (`p=none`), send aggregate reports to this address.”
- After you’re confident SPF/DKIM are working, you can change to `p=quarantine` or `p=reject` and add `ruf=mailto:...` for forensic reports if your provider supports it.

Do the same for `_dmarc.lgbtq-hub.com` with a mailbox you control on that domain (or the same one if you prefer).

### Step 5: Verify

- **SPF/DKIM:** Many providers have a “Test” or “Verify” in the domain/DKIM settings. You can also send a test email to a Gmail/Outlook address and open “Show original” or “View message source” and look for “SPF: PASS” and “DKIM: PASS”.
- **DMARC:** Use a free checker (e.g. search “DMARC record checker”) and enter `kervinapps.com` and `lgbtq-hub.com` to confirm the record is visible.

### Summary checklist per domain

| Domain | SPF (TXT at root) | DKIM (TXT from provider) | DMARC (TXT at _dmarc) |
|--------|-------------------|---------------------------|------------------------|
| kervinapps.com | Add/update with your SMTP provider’s include | Add record from provider; verify | Add `_dmarc` with p=none and rua= |
| lgbtq-hub.com  | Same if you send from this domain | Same if provider hosts this domain | Same |

If you tell me which SMTP provider and which host you use for DNS (e.g. Zoho + Cloudflare), I can give you the exact record values and where to click in the UI.