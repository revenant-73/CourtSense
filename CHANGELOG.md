# Changelog

## 2026-08-02

### Bug fixes
- Fixed a data-integrity bug where `saveEvaluation` could create duplicate evaluation rows for the same athlete/evaluator on rapid saves. Added a real `@@unique([athleteId, evaluatorId])` constraint and switched to a proper upsert. ([src/app/actions/evaluation.ts](src/app/actions/evaluation.ts))
- Fixed the Director review dashboard's "Avg" column, which was only averaging `adaptabilityScore` instead of all 6 scoring categories — directors were seeing one category mislabeled as an athlete's overall score. ([src/components/DirectorReviewFilter.tsx](src/components/DirectorReviewFilter.tsx))
- Fixed check-in photo uploads failing in production with "Body exceeded 1 MB limit" — raw camera photos are now compressed client-side before upload. ([src/lib/image.ts](src/lib/image.ts))

### New features
- Added a Director-only athlete detail page showing every evaluator's individual scores, notes, tags, and flags for an athlete — this is what the review dashboard's "View" button now opens (previously did nothing). ([src/app/director/athletes/[id]/page.tsx](src/app/director/athletes/%5Bid%5D/page.tsx))
- Directors can now delete a tryout session (and all its athletes/evaluations/tags/flags) from the session detail page's Danger Zone. ([src/components/DeleteSessionButton.tsx](src/components/DeleteSessionButton.tsx))
- Added `prisma/seed-director.ts` to bootstrap a single real Director account in production without the demo/fake data the regular seed script creates.

### UI/UX
- Cut the evaluation page's scroll height by roughly a third and added a back arrow to return to the athlete roster (there was previously no way to leave a single evaluation without browser back).
- Moved the mobile role-switch links (Director/Evaluate/Check-in) into the top bar, replacing the floating bottom dock on every page.
- Renamed "Save Protocol" to "Save" and "Scout Intelligence Notes" to "Evaluator Notes".

### Cleanup
- Fixed all 8 ESLint errors (mostly unnecessary `any` types; one genuine cross-package type mismatch; a React Compiler immutability error in the login page's demo-login redirect).
- Replaced the boilerplate README with real setup/deploy docs and added `.env.example`.

### Deploy incident
- Briefly added `prisma migrate deploy` to the Vercel build command, intending it to apply migrations automatically. It cannot connect to a `libsql://` URL and broke a production deploy (`ERROR` state, ~30 min). Reverted, and added `prisma/apply-turso-migration.ts` as the correct way to apply migrations directly to the Turso production database — see README's Deployment section. The pending `Evaluation` unique-constraint migration was applied to production this way; no duplicate rows existed, so no data was affected.

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
