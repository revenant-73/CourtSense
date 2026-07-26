# Changelog

## 2026-07-26

### Security
- Removed an authentication backdoor: the credentials provider accepted password `"bypass"` for **any** email in the database, skipping password verification entirely. ([src/lib/auth.ts](src/lib/auth.ts))
- Enforced role-based access on check-in and evaluate routes. Those pages and their server actions previously only checked "is logged in", so any authenticated account — regardless of DIRECTOR / EVALUATOR / CHECK_IN — could reach every section and call every mutating action. Added shared role-group constants ([src/lib/roles.ts](src/lib/roles.ts)) and applied them consistently; the navbar also now only shows links a role can actually use.

### Demo login
- Replaced the old bypass buttons on the login screen with one-click demo logins for the seeded Director / Evaluator / Staff accounts. These go through the same real, password-checked sign-in path as a normal login — no special-cased backend logic. ([src/app/login/page.tsx](src/app/login/page.tsx))
- The demo login section is gated behind `NEXT_PUBLIC_SHOW_DEMO_LOGIN`. Set it to `"true"` in an environment's variables to show the section (useful for coach demos/showcases), or omit/set to anything else to hide it once real tryout data is in use.

### New feature
- Added a "Manage Users" page for the Director role ([src/app/director/users](src/app/director/users)). Previously the only three accounts in the system came from `prisma/seed.ts`, and there was no way to create new accounts — director, evaluator, or check-in — without editing that script and re-running it by hand. Directors can now create and remove accounts directly from the app, with passwords bcrypt-hashed server-side.

### Visual consistency
- Unified the dark theme across the app. The individual player evaluation page, the entire check-in flow (dashboard, athlete list, walk-in form, check-in form), and the director session detail / review dashboard pages were still built with an older light Tailwind palette (`gray-*`, `indigo-*`, `bg-white`), left over from an earlier version of the app. Low-contrast or mismatched text/cards on these pages have been restyled to match the dark glass-card theme (`text-foreground`, `bg-primary`, `text-success`/`text-warning` status colors) used everywhere else.
