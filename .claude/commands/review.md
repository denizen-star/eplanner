# Code Review Task
Perform comprehensive code review. Be thorough but concise.

## Check For:

**Logging** - Server-side uses `console.log('[COMPONENT] message')` pattern; no raw untagged logs
**Error Handling** - Try-catch for all async functions; Netlify functions return proper HTTP status codes
**Production Readiness** - No debug statements, no TODOs, no hardcoded secrets or credentials
**Architecture** - Follows existing patterns; new API routes go in `netlify/functions/`, shared logic in `lib/`
- **Vanilla JS (frontend):** No framework, no build step. DOM manipulation only. No `import`/`export` (no bundler).
- **Netlify Functions:** Each function is self-contained. Shared DB/email logic imported from `lib/`.
- **Database (PlanetScale):** Use `lib/databaseClient.js` for all queries. No raw SQL outside that file. No foreign keys — enforce referential integrity in app code.
- **Multi-tenancy:** Tenant resolved via `lib/tenant.js`. Never hardcode tenant-specific logic outside that file or `assets/js/domain-variant.js`.
- **Email:** All email sending through `lib/emailService.js`. Templates in `lib/emailTemplates.js`.
**Security:** No SQL injection — use parameterized queries. Env vars for all secrets. Admin routes check `ADMIN_PASSWORD`. No user-supplied data rendered unescaped into HTML.

## Output Format

### ✅ Looks Good
- [Item 1]
- [Item 2]

### ⚠️ Issues Found
- **[Severity]** [[File:line](File:line)] - [Issue description]
  - Fix: [Suggested fix]

### 📊 Summary
- Files reviewed: X
- Critical issues: X
- Warnings: X

## Severity Levels
- **CRITICAL** - Security, data loss, crashes
- **HIGH** - Bugs, performance issues, bad UX
- **MEDIUM** - Code quality, maintainability
- **LOW** - Style, minor improvements
