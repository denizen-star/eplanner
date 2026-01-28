# EventPlan Documentation Directory

Welcome to the EventPlan documentation. This directory provides an organized index of all documentation files.

**Current Application Version**: v11.0.0 (Tenant Manager)

---

## Quick Start

- **New to EventPlan?** Start with [Setup Guides](#setup-and-configuration)
- **Setting up email?** See [Email Setup](features/EMAIL_SETUP.md)
- **Troubleshooting?** Check [Troubleshooting Guide](troubleshooting/TROUBLESHOOTING.md)
- **User Guides** → See [user-guides/](user-guides/) directory

---

## Setup and Configuration

Essential guides for setting up and configuring EventPlan:

- [Netlify Setup](setup/NETLIFY_SETUP.md) - Initial Netlify deployment configuration
- [Netlify Environment Variables](setup/NETLIFY_ENV_VARS_SETUP.md) - Environment variable configuration
- [Database Credentials](setup/DATABASE_CREDENTIALS.md) - Database connection setup
- [Database Credentials (DBeaver)](setup/DATABASE_CREDENTIALS_DBEAVER.md) - DBeaver-specific database setup
- [DBeaver Setup](setup/DBEAVER_SETUP.md) - DBeaver installation and configuration
- [DNS and Netlify Subdomain Setup](setup/DNS_AND_NETLIFY_SUBDOMAIN_SETUP.md) - Subdomain configuration for tenants
- [Tenant Manager Setup](setup/TENANT_MANAGER_SETUP.md) - Multi-tenant subdomain setup (v11.0.0)

---

## Features and Functionality

Documentation for specific features and systems:

- [Email Setup](features/EMAIL_SETUP.md) - Email service configuration and setup
- [Email Troubleshooting](features/EMAIL_TROUBLESHOOTING.md) - Common email issues and solutions
- [Email Template Design Guide](features/EMAIL_TEMPLATE_DESIGN_APPLICATION_GUIDE.md) - Creating and customizing email templates
- [Design System Guide](features/DESIGN_SYSTEM_GUIDE.md) - UI/UX design patterns and components
- [Data Management Playbook](features/DATA_MANAGEMENT_PLAYBOOK.md) - Database and data management practices

---

## Architecture & Decisions

- [Why EventPlan Works](ARCHITECTURE_DECISIONS.md) - Design decisions, ordering, and common pitfalls

## Archived (Historical) Docs

These are preserved for historical context and cross-app migration work, but are **not required** for day-to-day EventPlan operation.

### Migration Guides (Archived)

- [Cancellation Feature Implementation](./_archive/migrations/CANCELLATION_FEATURE_IMPLEMENTATION_GUIDE.md)
- [Place Name & Domain Filtering Migration](./_archive/migrations/MIGRATION_GUIDE_PLACE_NAME_AND_DOMAIN_FILTERING.md)
- [Email Migration Guide (Runs App)](./_archive/migrations/EMAIL_MIGRATION_GUIDE_RUNS_APP.md)
- [Timezone and Validation Migration](./_archive/migrations/TIMEZONE_AND_VALIDATION_MIGRATION_GUIDE_RUNS_APP.md)
- [Failed Implementation Lessons Learned](./_archive/migrations/FAILED_IMPLEMENTATION_LESSONS_LEARNED.md)

---

## Troubleshooting

Debugging and troubleshooting resources:

- [Troubleshooting Guide](troubleshooting/TROUBLESHOOTING.md) - General troubleshooting and common issues
- [Pre-Implementation Steps](troubleshooting/PRE_IMPLEMENTATION_STEPS.md) - Pre-deployment checklist

---

### Reference Materials (Archived)

> Note: EventPlan is DB-only now, so Google Sheets / Apps Script materials are legacy references.

- [Kervapps Application Design Spec](./_archive/reference/Kervapps%20application%20design%20spec.md)
- [Google Apps Script Test Function](./_archive/reference/APPS_SCRIPT_TEST_FUNCTION.js)
- [Google Apps Script Code](./_archive/reference/google-apps-script-code.js)
- [Google Sheets Read Update](./_archive/reference/GOOGLE_SHEETS_READ_UPDATE.md)

---

## Marketing Materials

Press releases and marketing content:

- [Press Release](marketing/PRESS_RELEASE.md) - Full press release
- [Press Release (Short)](marketing/PRESS_RELEASE_SHORT.md) - Shortened press release
- [Press Release (WhatsApp)](marketing/PRESS_RELEASE_WHATSAPP.txt) - WhatsApp-formatted press release
- [WhatsApp Pacer Invite](marketing/WHATSAPP_PACER_INVITE.txt) - WhatsApp invitation template

---

## User Guides

End-user documentation (HTML and Markdown formats):

- [Admin Instructions](user-guides/ADMIN_INSTRUCTIONS.md) / [HTML](user-guides/ADMIN_INSTRUCTIONS.html) - Admin user guide
- [Pacer Instructions](user-guides/PACER_INSTRUCTIONS.md) / [HTML](user-guides/PACER_INSTRUCTIONS.html) - Pacer/coordinator guide
- [Runner Instructions](user-guides/RUNNER_INSTRUCTIONS.md) / [HTML](user-guides/RUNNER_INSTRUCTIONS.html) - Participant guide
- [Tenant Create Guide](user-guides/TENANT_CREATE_GUIDE.html) - Creating tenants guide

---

## Documentation by Version

### v11.0.0 - Tenant Manager
- [Tenant Manager Setup](setup/TENANT_MANAGER_SETUP.md)
- [DNS and Netlify Subdomain Setup](setup/DNS_AND_NETLIFY_SUBDOMAIN_SETUP.md)

### v8.0.0 - Cancellation & Domain Filtering
- [Cancellation Feature Implementation](./_archive/migrations/CANCELLATION_FEATURE_IMPLEMENTATION_GUIDE.md)
- [Place Name & Domain Filtering Migration](./_archive/migrations/MIGRATION_GUIDE_PLACE_NAME_AND_DOMAIN_FILTERING.md)

### v7.0.0 - Telemetry System
- See [Data Management Playbook](features/DATA_MANAGEMENT_PLAYBOOK.md)

### v5.0.0 - Event Pictures & Descriptions
- See [Design System Guide](features/DESIGN_SYSTEM_GUIDE.md)

---

## Directory Structure

```
docs/
├── README.md (this file)
├── setup/ - Setup and configuration guides
├── features/ - Feature documentation
├── troubleshooting/ - Troubleshooting guides
├── marketing/ - Marketing materials
├── _archive/ - Archived historical docs (migrations/reference)
└── user-guides/ - End-user documentation
```

---

## Need Help?

1. **Setup Issues?** → Check [Setup and Configuration](#setup-and-configuration) section
2. **Feature Questions?** → See [Features and Functionality](#features-and-functionality)
3. **Errors?** → Review [Troubleshooting](#troubleshooting) section
4. **User Questions?** → Direct users to [User Guides](#user-guides)

---

## Contributing to Documentation

When adding new documentation:

1. Place setup/configuration guides in `docs/setup/`
2. Place feature documentation in `docs/features/`
3. Place troubleshooting guides in `docs/troubleshooting/`
4. Place marketing materials in `docs/marketing/`
5. Place user guides in `docs/user-guides/`
6. If you need to keep historical notes, place them in `docs/_archive/`
7. Update this README.md with links to new documentation
8. Follow existing naming conventions (UPPERCASE_WITH_UNDERSCORES.md)
9. Include version information if feature-specific

---

*Last Updated: 2026-01-28*
