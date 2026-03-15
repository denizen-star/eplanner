# Hero CTAs, Tenant Defaults, and Terminology Plan

**Overall Progress:** `~90%`

## TLDR

Align hero CTAs across pages (primary: "See upcoming events" → calendar; secondary: "Host an Event" / "Explore Our Community"), update lgbtq-hub product defaults to remove WhatsApp funnel, repurpose the community page as an events hub, rename Pacer→Organizer and Runner→Participant, improve share-message UX, and make map defaults tenant-aware. Finish with tenant DB records and legacy fallback cleanup.

## Critical Decisions

- **Hero primary CTA** → calendar.html with text "See upcoming events" (no WhatsApp link)
- **Hero secondary CTA** → "Explore Our Community" linking to community page
- **Remove redundant "Upcoming Public Events"** — same destination as primary CTA
- **Pacer → Organizer, Runner → Participant** — terminology change across UI and docs (DB column rename deferred)
- **Map defaults** — tenant-specific via `window._tenantConfig.defaultMapCenter`
- **Legacy fallback** — slim to favicon/logo/title only; remove WhatsApp branch

## Tasks

- [x] 🟩 **Step 1: Fix Hero CTAs**
  - [x] hero-find-group-btn: text → "See upcoming events", href → calendar.html (index.html:58)
  - [x] Remove redundant "Upcoming Public Events" button on signup.html, calendar.html, coordinate.html, whatsapp-community.html (hero-cta-group)
  - [x] signup-now-btn: text → "Host an Event", href stays coordinate.html (index.html:68)

- [x] 🟩 **Step 2: Update lgbtq-hub Product Defaults**
  - [x] hero.findGroupUrl → calendar.html (lib/tenant.js:69)
  - [x] hero.learnMoreUrl → community.html (lib/tenant.js:70)
  - [x] Add defaultMapCenter: [43.6532, -79.3832] to lgbtq-hub defaults (lib/tenant.js:67)
  - [x] Add defaultMapCenter: [25.7617, -80.1918] to eplanner defaults (lib/tenant.js:56)

- [x] 🟩 **Step 3: Repurpose Community Page**
  - [x] Remove Main Message Board WhatsApp join button (whatsapp-community.html)
  - [x] Add "View Events →" button linking to calendar.html in each of the 6 section cards
  - [x] Remove community page from coordinate.html desktop nav
  - [x] Remove community page from coordinate.html mobile nav

- [x] 🟩 **Step 4: Pacer → Organizer Rename**
  - [x] coordinate.html: id/name="organizerName", placeholder → "Organizer Name *"
  - [x] coordinate.js: organizerName, formData.plannerName → formData.organizerName, run.organizerName in message generator
  - [x] coordinate.js: add `// TODO: rename DB column pacer_name → organizer_name` comment on formData construction
  - [x] signup.html: id="runOrganizerName", "Organizer:" label
  - [x] docs/user-guides/PACER_INSTRUCTIONS.html: replace all "Pacer" → "Organizer", "Runner" → "Participant"
  - [x] docs/user-guides/RUNNER_INSTRUCTIONS.html: replace all "Pacer" → "Organizer", "Runner" → "Participant"

- [x] 🟩 **Step 5: Share Message Rename + Alert UX Fix**
  - [x] Rename "WhatsApp Message:" label → "Share Message:" in post-create result block (coordinate.js:759)
  - [x] Rename "Copy WhatsApp Message" button → "Copy Share Message"
  - [x] Replace alert() copy confirmations with inline button state: text → "Copied!" for 2s then resets

- [x] 🟩 **Step 6: Tenant-Aware Map Default**
  - [x] domain-variant.js: expose window._tenantConfig = config after applyBranding() call
  - [x] domain-variant.js: set window._tenantConfig = { defaultMapCenter: [...] } in runLegacy() fallback
  - [x] coordinate.js: add getDefaultMapCenter() helper with MIAMI_COORDINATES fallback
  - [x] coordinate.js: replace MIAMI_COORDINATES usages with getDefaultMapCenter()

- [ ] 🟥 **Step 7: Tenant DB Records**
  - [ ] Verify lgbtq-hub:to record exists with correct configJson (Toronto coordinates)
  - [ ] Create lgbtq-hub:mia record via /api/admin/tenants with configJson: { "defaultMapCenter": [25.7617, -80.1918] }

- [x] 🟩 **Step 8: Clean Up domain-variant.js Legacy Fallback**
  - [x] Remove WHATSAPP_GROUP_LINK constant from lib/tenant.js (line 45) — no longer referenced in defaults
  - [x] Remove WhatsApp icon injection from applyHeroButtons in domain-variant.js — findBtn now just sets href
  - [x] runLegacy() already slimmed to favicon/logo/title only
