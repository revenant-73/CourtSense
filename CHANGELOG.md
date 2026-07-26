# Changelog

## 2026-07-26

### Security
- Removed an authentication backdoor: the credentials provider accepted password `"bypass"` for **any** email in the database, skipping password verification entirely. ([src/lib/auth.ts](src/lib/auth.ts))

### Demo login
- Replaced the old bypass buttons on the login screen with one-click demo logins for the seeded Director / Evaluator / Staff accounts. These go through the same real, password-checked sign-in path as a normal login — no special-cased backend logic. ([src/app/login/page.tsx](src/app/login/page.tsx))
- The demo login section is gated behind `NEXT_PUBLIC_SHOW_DEMO_LOGIN`. Set it to `"true"` in an environment's variables to show the section (useful for coach demos/showcases), or omit/set to anything else to hide it once real tryout data is in use.

### Visual consistency
- Unified the dark theme across the app. The individual player evaluation page, the entire check-in flow (dashboard, athlete list, walk-in form, check-in form), and the director session detail / review dashboard pages were still built with an older light Tailwind palette (`gray-*`, `indigo-*`, `bg-white`), left over from an earlier version of the app. Low-contrast or mismatched text/cards on these pages have been restyled to match the dark glass-card theme (`text-foreground`, `bg-primary`, `text-success`/`text-warning` status colors) used everywhere else.
