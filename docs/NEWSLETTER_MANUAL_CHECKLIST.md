# Weekly Newsletter – Manual Checklist

Use this checklist to verify the newsletter subscription and digest flow.

## Setup

- Run migration `lib/migration-add-app-members.sql` in PlanetScale (dev branch, then promote).
- Set env `NEWSLETTER_UNSUBSCRIBE_SECRET` and configure SPF/DKIM/DMARC for sending domains: see [NEWSLETTER_SETUP.md](NEWSLETTER_SETUP.md) for step-by-step instructions.

## Passive member (signup-intent CTA)

1. Open site (eplanner or to-lgbtq), click a sign-up CTA (e.g. "Sign Up for This Event", "Sign Up" on signup form).
2. In DB, confirm an `app_members` row with `type='NA'`, `status='passive'`, and correct `app_name`/`tenant_key`/`session_id` (or `email` if submitted from signup form).

## Weekly opt-in at registration

1. Open signup page for an event, accept waiver, check "Send me weekly emails...", submit with valid email/name/phone.
2. In DB, confirm a separate `app_members` row with `type='Weekly'`, `status='active'`, same `email`; NA row unchanged.
3. Confirm signup confirmation email is still sent and signup record exists in `ep_signups`.

## Send weekly digest (admin)

1. Log in as admin, open Admin Dashboard, click "Send Weekly Events Email".
2. Confirm success message shows sent/skipped/events count.
3. Check inbox for each active Weekly member: digest with event cards, correct from-address (eplanner vs lgbtq-hub), and working unsubscribe link.

## Unsubscribe

1. From a digest email, click the unsubscribe link.
2. Confirm landing page shows "You have been unsubscribed...".
3. In DB, confirm that row’s `status` is `opt-out` for that email (all sessions).
4. Trigger "Send Weekly Events Email" again; that email must not receive the digest.

## Optional

- Add List-Unsubscribe header in `EmailService.sendEmail` for digest emails (same URL as body link).
- Log send attempts/failures (e.g. to `app_events` or a small log table) for debugging.
