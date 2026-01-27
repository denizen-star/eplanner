# Email Alias Sender Checklist (Zoho + Netlify)

Use this checklist to send confirmation emails **from** `info@to.lgbtq-hub.com` while continuing to authenticate to Zoho SMTP as `info@kervinapps.com`.

## Checklist

### 1) Zoho Mail: domain + alias

- [ ] **Verify domain**: `to.lgbtq-hub.com` is added and verified in Zoho Mail admin.
- [ ] **Create/confirm alias**: `info@to.lgbtq-hub.com` exists (as an alias or mailbox).
- [ ] **Allow send-as**: `info@kervinapps.com` (SMTP login) is permitted to send as `info@to.lgbtq-hub.com` (Zoho “send as” / alias settings).

### 2) DNS: SPF / DKIM / DMARC (deliverability)

- [ ] **SPF**: Add Zoho’s recommended SPF TXT record for `to.lgbtq-hub.com` (Zoho typically provides the exact value; commonly includes `include:zoho.com`).
- [ ] **DKIM**: Generate a DKIM key in Zoho for `to.lgbtq-hub.com` and publish the TXT record in DNS.
- [ ] **DMARC (recommended)**: Add a DMARC TXT record (start with `p=none` to monitor, then tighten later).
- [ ] **Propagation**: Wait for DNS to propagate, then verify in Zoho admin that SPF/DKIM are detected.

### 3) Netlify: environment variables (single site serving both domains)

Set these in Netlify **Site settings → Environment variables** (Production scope at minimum), then redeploy:

- [ ] `EMAIL_ENABLED=true`
- [ ] `SMTP_SERVER=<your Zoho SMTP host>` (e.g., `smtp.zoho.com` or `smtppro.zoho.com`)
- [ ] `SMTP_PORT=587` (or `465`)
- [ ] `SENDER_EMAIL=info@to.lgbtq-hub.com` (visible From address)
- [ ] `SMTP_USERNAME=info@kervinapps.com` (SMTP login / auth user)
- [ ] `SENDER_PASSWORD=<app-specific password for info@kervinapps.com>`

### 4) Verify in production

- [ ] Trigger a real signup on `to.lgbtq-hub.com` and `to-lgbtq.kervinapps.com`.
- [ ] Confirm the email shows **From: `info@to.lgbtq-hub.com`**.
- [ ] In the received email headers, confirm:
  - [ ] SPF passes (or at least doesn’t fail DMARC)
  - [ ] DKIM passes for `to.lgbtq-hub.com`

## Notes

- The app now supports **separating SMTP auth** (`SMTP_USERNAME`) from **visible sender** (`SENDER_EMAIL`). See `docs/EMAIL_SETUP.md` for details.
