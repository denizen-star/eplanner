# Release v12.0.0

Release date: 2026-02-02 (tag date).

This release includes event link preview (Open Graph) improvements so shared event/signup URLs show the correct thumbnail and description in messaging apps and social platforms, server-side OG injection so crawlers receive the right meta, waiver updates for data collection consent, weekly newsletter features, admin and delete improvements, and documentation updates.

---

## Event Link Preview (Open Graph / Thumbnail & Description)

### Problem

When users shared an event or signup link (e.g. to WhatsApp, iMessage, Facebook, Twitter), the preview often showed a generic image and title. Link-preview crawlers do not run JavaScript, so any meta tags set only in the client after loading event data were never seen by crawlers.

### Changes

1. **Event image as thumbnail**
   - If an event has an image, the link preview image (og:image and twitter:image) is now the event’s image, served via `/api/event-image/:runId`.
   - If the event has no image, the preview uses the site default thumbnail (`/assets/images/og-default.jpeg`).
   - Implemented in both client-side (event.js, signup.js) and server-side (og-page function) so behavior is consistent.

2. **Netlify redirect for event-image API**
   - Added redirect so `/api/event-image/:runId` is served by the existing event-image Netlify function, making the event image URL fetchable by crawlers.

3. **Server-side OG meta injection**
   - New Netlify function `og-page.js` handles all requests to `/event.html` and `/signup.html`. When the URL includes `?id=`, the function loads the event from the database, builds Open Graph and Twitter Card meta (title, description, image URL), injects them into the static HTML, and returns the modified HTML. Crawlers therefore receive the correct preview without executing JavaScript.
   - Redirects in netlify.toml were updated so that every request to event.html and signup.html is rewritten to this function (no query-parameter condition), avoiding known issues with query-based rewrites on Netlify. When `?id=` is missing, the function returns the static HTML unchanged.

4. **Link preview title and description format**
   - **Title:** Event name only; removed the fixed suffix " - Gay Run Club" from the preview title (e.g. "6ix Pickle - Pickleball & Pints" instead of "6ix Pickle - Pickleball & Pints - Gay Run Club").
   - **Description:** New structured format: "Join us!. Date: &lt;date&gt;. Location: &lt;location&gt;. Organized by: &lt;organizer&gt;. Event Status: &lt;status&gt;." (e.g. "Join us!. Date: Feb 3, 2026, 3:00 PM. Location: 102 Berkeley Street, Toronto.... Organized by: Kerv. Event Status: Active."). Applied in both the og-page function and the signup page client-side OG update.

5. **Static HTML for og-page**
   - The og-page function reads the static event.html and signup.html from the function bundle (included_files in netlify.toml) so it can inject meta without fetching the live site and creating a redirect loop.

6. **Documentation**
   - Added `docs/reference/EVENT_LINK_PREVIEW_IMPLEMENTATION.md` describing the architecture, thumbnail logic, description format, and a checklist for applying the same pattern to other applications.

**Files touched:** netlify.toml (redirects, included_files), netlify/functions/og-page.js (new), netlify/functions/event-image.js (existing; unchanged), assets/js/event.js, assets/js/signup.js, event.html, signup.html (static meta), docs/reference/EVENT_LINK_PREVIEW_IMPLEMENTATION.md (new).

---

## Waiver: Data Collection and Consent

- Added **Section 9: Data Collection and Use** to the Electronic Waiver of Liability, Media Release, Code of Conduct, and Communication Consent.
- The new section discloses that technical and usage data are collected in connection with registration and use of the signup system (e.g. device type, browser and operating system, screen and connection details, session identifier, page URL and referrer). It states that this data is used for security, fraud prevention, improving the service, and analytics, and may be stored with registration and waiver records, and that by accepting the waiver the participant consents to this collection and use.
- The former Section 9 (Electronic Consent) was renumbered to **Section 10**.

**Files touched:** assets/js/signup.js (waiverText template).

---

## Waiver UI

- The waiver required text "(Required to complete registration)" is now styled in red with an asterisk for clarity.

**Files touched:** signup.html (label styling).

---

## Weekly Event Newsletter

- **App members and passive CTA:** Introduced app_members (e.g. NA “not yet signed up” members) and passive signup-intent tracking (e.g. “Sign Up” CTA clicks) with opt-in to the weekly digest.
- **Digest email:** Weekly event digest email for opted-in members; admin can trigger send; unsubscribe flow with redirect and handling.
- **Newsletter improvements (follow-up):** Unsubscribe redirect fix, NA uniqueness, linking signup to app_member, attendee confirmation email fix, and digest comment/behavior adjustments.
- **Deploy fix:** Use emailTemplatesLegacy.js instead of an ignored .backup file for deploy.

**Files touched:** lib/databaseClient.js (app_members, signup app_member link), netlify/functions (runs-signup, etc.), lib/emailTemplates.js, lib/emailTemplatesLegacy.js, admin, docs (NEWSLETTER_SETUP.md, NEWSLETTER_MANUAL_CHECKLIST.md), and related assets.

---

## Email and Signup Fixes

- **Attendee confirmation email:** Fixed by passing externalSignup into signupConfirmationEmail and removing temporary debug instrumentation.

**Files touched:** lib/emailTemplates.js, netlify/functions/runs-signup.js.

---

## Admin and Data Management

- **Admin password gate:** Admin page is gated behind a password modal; admin guide updated accordingly.
- **DELETE support:** Added DELETE support for runs and signups with corrected delete flows.

**Files touched:** admin.html, assets/js/admin-auth.js, admin.js, server.js, netlify functions (run-get, runs-signups), docs.

---

## Mobile and Tenant UI

- **Mobile hero:** Strengthened CSS for hero formatting across pages so font sizes and background images display correctly on mobile (including !important where needed).
- **Tenant Manager:** Hero section layout and favicon uploads; subdomain tenants, branding, admin UI, and setup docs; default sender info@lgbtq-hub.com for to.lgbtq-hub / to-lgbtq.
- **DNS/subdomain:** Documentation for DNS and Netlify subdomain setup.

**Files touched:** assets/css/main.css, coordinate.html, tenant-related pages, netlify.toml, docs.

---

## Documentation and Cleanup

- Reorganized docs and archived historical guides; cleaned up marketing docs.
- Added docs/reference documentation (e.g. GOOGLE_SHEETS_READ_UPDATE.md, EVENT_LINK_PREVIEW_IMPLEMENTATION.md, RELEASE_v12.0.0.md).
- WhatsApp community page updated (LGBTQ+ Hub, removed TO as appropriate).
- Redirect: toronto.lgbtq-hub.com to to.lgbtq-hub.com; to.lgbtq-hub.com treated as to-lgbtq variant.

---

## Summary of Notable Files

| Area | Files |
|------|--------|
| Link preview / OG | netlify/functions/og-page.js, event-image.js, netlify.toml, assets/js/event.js, assets/js/signup.js |
| Waiver | assets/js/signup.js, signup.html |
| Newsletter / app members | lib/databaseClient.js, lib/emailTemplates.js, netlify/functions/runs-signup.js, admin, docs |
| Admin | admin.html, assets/js/admin-auth.js, assets/js/admin.js |
| Docs | docs/reference/*.md, docs/NEWSLETTER_*.md, docs/setup/*.md |
