# Tryout readiness — October 5, 2026

Target: real tryout use in about four weeks (early November; exact date to confirm).

## Released October 5, 2026

- Application commit `5f89ed212028a6b15b658f20e8311fe93c1285a1` pushed to GitHub `main` and deployed to production by Vercel Git integration.
- Deployment `dpl_CbgpoTWy5wKxaZwzY8mZ3iLEwqvs` is READY and serves https://court-sense-lac.vercel.app. Remote build generated Prisma Client and passed Next.js compilation/TypeScript. No database migration or seed was run.
- Live browser smoke checks passed: phone/desktop login, hidden demo controls, rejection of known demo credentials, logged-out Director/Evaluate/Check-in redirects, anonymous CSV export rejection (401), and the credentials provider endpoint. No uncaught browser errors occurred, and no authenticated production data was changed.
- Real staff sign-in after deployment remains to be confirmed by the user; their successful production sign-in was before this release. Everyone must sign in again because older sessions are revoked.
- The baseline and local implementation notes below record the earlier stages; this section is the current release status.

## Verified baseline

- Local `main`, refreshed GitHub `origin/main`, and Vercel production all match `4ac0de893960defed93b09207b1871ed18999142`.
- Production: https://court-sense-lac.vercel.app, deployment `dpl_GzuEj2wty82NkbeXB94khUM3qSvQ`, READY.
- Production login responds; logged-out Director/Evaluate/Check-in requests redirect to login.
- Build and TypeScript pass; ESLint has zero errors and six image warnings.
- `npm audit --omit=dev` reports 15 findings (3 critical, 10 high, 1 moderate, 1 low). This is a dependency inventory, not proof of reachable production exploits. Review applicability and upgrade deliberately; do not use forced downgrades suggested by npm.
- Production displays demo login. Hiding buttons does not disable seeded accounts with known passwords.
- Authenticated production workflows, live migration state, backups/restores, and real-device/venue-network behavior were not verified.

## Priorities

1. Secure demo accounts and remove public demo access before real data. Preserve evaluation history; rotate credentials rather than deleting staff who have records. Verify access revocation.
2. Make first-time and subsequent evaluation saving reliable: visible saved/error states, retry, prevent overlapping saves, protect unsaved navigation. Test loss of connection.
3. Validate and preview CSV imports before a single transaction. Detect duplicate rows and previously imported athletes without treating name alone as a unique identity.
4. Clarify that zero means not observed. Show observation coverage; exclude unobserved categories from observed-score averages consistently in review, detail, and exports.
5. Add director-only exports, session archiving, and atomic deletion. Define and rehearse database backup/restore; CSV is not a complete database backup.
6. Improve mobile review and team controls. Prevent one evaluator silently removing another evaluator's standout indicators; this requires a carefully tested additive ownership migration.
7. Review dependencies, add regression coverage, and rehearse with several staff devices on venue Wi-Fi at least one week before the event.

## Implementation and release tracking

First implementation batch (now deployed as recorded above):

- Evaluation changes autosave for new and existing evaluations. Saved/saving/error states and manual retry are visible; saves cannot overlap, and score/notes inputs pause during a save. Link navigation and page unload warn about unsaved changes. Browser back and mobile OS termination/draft recovery still need verification and follow-up; this is not offline storage.
- CSV upload validates every row, previews before saving, detects repeated name/age/age-group combinations, and imports atomically. A mixed batch with a match already in the roster saves nothing. Same-name athletes with the same age/group require manual review and can be added separately as walk-ins; the matching key is a conservative duplicate check, not a permanent identity.
- Review, athlete detail, and CSV use observed-only averages with explicit category coverage. An all-unobserved evaluation shows no average.
- Director-only CSV includes athletes without evaluations, individual scores/notes, tags/flags, and team assignments. Formula-like text is neutralized. Photos, passwords, and tokens are excluded; CSV is not a full backup.
- Sessions can be archived/reopened. Mutation actions reject archived sessions; review/export remain available. Session and team deletion are transactional.
- Director password reset preserves history. Reset/deleted accounts lose access on their next request. Production rejects known demo credentials and hides demo buttons. Existing sessions from before this upgrade must sign in again.
- Next.js and its ESLint config upgraded to 16.3.8; unused Prisma Auth adapter removed (credentials/JWT authentication uses direct Prisma queries). Compatible lockfile fixes applied; no major forced downgrades.
- The first dependency pass reduced the production audit from 15 findings to 7. The subsequent dependency remediation described below reduces it to zero. Source: [Next.js 16.3.8 release](https://github.com/vercel/next.js/releases/tag/v16.3.8), [image optimization advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), and current npm audit output.
- Review rows wrap on narrow screens and expose team assignment controls on phones. Browser inspection confirms the layout and team selector fit. A clipped Create button on Manage Teams was found and fixed by stacking the form at phone widths, then verified against the rebuilt/restarted local server with a successful team creation.
- Explicit field selection prevents evaluator password hashes from being sent with review props; evaluation/walk-in writes accept only expected fields.

Verification: `npm test` passes 11 tests, including isolated SQLite/libsql adapter checks for duplicate/mixed-batch rejection, archive gating, demo rejection, credential normalization, reset/removal revocation, deletion rollback and successful deletion. Scoring and CSV escaping/formula neutralization are covered. TypeScript and build pass; lint has zero errors and the original six image warnings. No production database was used.

Browser verification resumed after the user started the isolated local production-mode server at http://localhost:3107. Automated Chromium checks passed for demo rejection, first evaluation autosave/reload, simulated failed save/retry, unsaved-link cancellation, CSV preview/import, duplicate mixed-batch rejection, Director-only export (401 anonymous, 403 evaluator/check-in, 200 Director), archive/write rejection/reopen, password reset/relogin/session revocation with history preserved, photo check-in, walk-in with photo, and team creation/assignment persistence/export. A synthetic 3024×4032 JPEG larger than 1 MB was compressed below 1 MB and survived check-in/reload. No uncaught browser errors occurred in the first complete workflow suite.

Layout checks and screenshots covered 375px and 390px phone, 768px tablet and 1280px desktop. After the rebuilt local server was restarted, all 16 review/teams/users/evaluation page-size checks passed with no offscreen input/select/button controls or horizontal page overflow. The fixed phone Teams form successfully created a team. Phone check-in and walk-in layouts also passed. This is browser emulation, not a physical phone camera or venue-network rehearsal. Production data remains untouched.

Saved screenshot evidence: [phone review](qa/2026-10-05/review-phone.png), [fixed phone Teams form](qa/2026-10-05/teams-phone.png), [photo check-in form](qa/2026-10-05/photo-check-in-phone.png). These use only synthetic test athletes.

Production baseline is `4ac0de8`. The user confirmed their private production sign-in and authorized committing and deploying this batch after the patched-build browser checks passed. No schema migration is needed. Staff using known demo passwords will be unable to sign in after release. Everyone must sign in again.

## Dependency remediation follow-up

The user confirmed successful production sign-in with their email and password. Dependency remediation and the restarted-server checks below were completed before release authorization.

- `npm audit --omit=dev`: **0 vulnerabilities**, down from the seven remaining entries. Findings in parent packages disappeared when their vulnerable transitive dependencies were replaced; audit exclusions were not added.
- Scoped `package.json` overrides pin NextAuth's optional `@auth/core` peer to **0.41.3**, Prisma config's `deepmerge-ts` to **8.0.2**, and Prisma CLI's `mysql2` to **3.24.5**. NextAuth stays on 4.24.15 and Prisma stays on version 7; no forced framework downgrade, authentication migration, or database migration is involved.
- NextAuth v4's installed JavaScript does not import the optional Auth.js core package; its adapter type declaration references it. This app uses credentials/JWT and no Auth.js adapter. Patched core also removes its vulnerable nested cookie dependency. [Auth.js advisory](https://github.com/advisories/GHSA-7rqj-j65f-68wh).
- `deepmerge-ts` 8 changes Map merging and some custom types. Prisma config uses its ordinary `deepmerge` export with this repository's plain-object configuration; schema validation and client generation both pass with the override. [Version 8 release notes](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0).
- The MySQL driver is bundled by the Prisma CLI; the application continues to use libsql. Its patched version remains within major version 3. [MySQL2 advisory](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3).
- Full `npm audit` still reports **5 high development-only entries**, all one `braces` advisory propagated through `micromatch`, `fast-glob`, the Next ESLint plugin, and its config. Registry latest `braces` is 3.0.3, which is affected; no patched release is currently listed. This is a remaining tooling issue, not a clean full audit. Recheck upstream before the event. [Braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- Verification after these pins: 11 regression tests pass (including credentials and revocation), TypeScript passes, lint has zero errors and six existing image warnings, production build passes, Prisma schema validation and client generation pass, and `npm ls` accepts the overridden dependency tree.
- After the user restarted the local server, the complete browser suite passed again against the patched build using only isolated test accounts/data: Director/evaluator sign-in, demo rejection, autosave/reload, failed save/retry and navigation cancellation, CSV preview/import and atomic duplicate rejection, anonymous/evaluator/Director export permissions, phone review, archive/write rejection/reopen, and password reset with old-session revocation, new sign-in and preserved evaluation history. No uncaught browser errors occurred.
- The patched build also passed all 16 review/teams/users/evaluation layout checks at 375, 390, 768 and 1280px, with no horizontal overflow or offscreen controls; phone team creation passed again.

An independent temporary-directory `npm ci --ignore-scripts` also reproduces all three pins and a zero-finding production audit. Lifecycle scripts were disabled for that installation check; Prisma generation and the production build were verified separately in the working repository.

Keep these overrides until upstream manifests accept patched versions. When removing a pin, regenerate the lockfile and repeat the audit, Prisma checks, authentication tests, and build.

## Remaining work

### Windows check-in label printing

The same branch now includes remembered webcam selection and shared capture/retake/use controls for registered athletes and walk-ins. Browser component tests with synthetic cameras and mocked client save actions passed; physical USB webcam and saved-photo server round-trip checks remain required on the actual laptop. The camera preference belongs to its browser profile, and unavailable saved cameras require another explicit choice.

The label-printing follow-up adds a saved check-in confirmation, one-label printing and reprinting for registered athletes and walk-ins. It is on `codex/tryout-label-printing`, pending production deployment. See [Rollo check-in setup and laptop handoff](ROLLO_CHECK_IN_SETUP.md) for 4 × 6-inch label settings, dedicated Chrome shortcuts, physical acceptance checks, and a prompt to continue in Codex on the actual laptop. No migration or new dependency is required. Normal browsers show a print dialog; the dedicated laptop profile must be configured and tested for silent printing. Printer delivery is not detectable by the app.

### Seven workflow improvements — release follow-up

All seven review recommendations are implemented and verified locally. The user authorized committing and deploying this follow-up on 2026-10-05. No schema migration or dependency addition is required. Deployment status is verified separately against the Vercel release and Git commit.

1. Event actions (Check-in, Evaluate, Review, Teams, Export) now appear above the roster. Progress counts show registered, checked-in, athletes with observed scores, and unassigned athletes.
2. Check-in supports name/number search, All/Pending/Checked-in filters and counts, a labeled walk-in button, a back link, and inline save errors. Successful check-in returns to the list.
3. Evaluator progress reflects only that evaluator's actual scores: Not started, Started with no scores, or N of 6 observed. Needs my observation excludes fully observed athletes and includes empty saved records.
4. Phone athlete names wrap; evaluation cards put progress on a separate line. Scoring uses larger labels, clearer contrast and two columns on phones. Athlete identity and save status share a sticky header.
5. Review has visible filter labels, missing/partial coverage, unresolved follow-up flags, all 12 standout choices (plus existing custom tags), result counts, and sorting by number/name/coverage/observed average. Unobserved averages sort last.
6. Walk-in uses labeled inputs, whole-number age constraints, consistent position choices, event age-group default, and a suggested available number. Both walk-in and existing check-in give safe duplicate-number messages, preserve input on failure, and wait for photo processing before save. Suggestions do not reserve numbers; the database unique constraint decides concurrent conflicts.
7. Team management shows selected roster and unassigned athletes side by side on larger screens and stacked on phones, with roster/position counts, search, and explicit selection/assignment. Bulk assignment is atomic and accepts only unassigned athletes in the same active event; a stale or cross-event selection rolls back entirely. Existing team members can be moved or unassigned individually.

No schema migration or new dependency is needed. Existing athletes, observations, tags and assignments are preserved. Shared standout ownership remains a separate follow-up requiring an additive migration.

Verification: 14 tests pass, including unique-number enforcement and failed bulk assignment rollback; TypeScript/build pass and lint has zero errors with six image warnings. The production dependency audit remains at zero findings. Production-mode browser testing caught Next.js suppressing thrown validation messages, so expected check-in/walk-in and bulk-assignment failures now return safe structured errors. A root scroll container also blocked sticky positioning; that container was corrected, and existing malformed arrow SVGs were repaired.

After the final rebuilt server restarted, the complete seven-workflow browser suite passed against a separate 30-athlete synthetic event in the isolated local database. It verified event actions/counts, number lookup/status filters, duplicate check-in errors and successful return, walk-in defaults/position choices/duplicate errors with fields preserved, evaluator-specific progress, autosave/reload, identity and Saved visibility while scrolled, coverage/tag/flag filters and sorting, bulk team assignment/counts, reload and export persistence, individual unassignment, and two-browser stale selection rejection without overwriting assignments. No uncaught browser errors occurred. All 32 layout checks (eight screens at 375/390/768/1280px) passed with no page overflow or offscreen controls. Physical-device/venue-network checks remain outstanding. Production was untouched.

Screenshot evidence: [sticky evaluation identity and save status on phone](qa/2026-10-05-workflow/evaluation-sticky-phone.png), [walk-in form on phone](qa/2026-10-05-workflow/walk-in-phone.png). Only synthetic test data appears in these images.

- Complete actual-device/venue-network rehearsal and concurrent edits/imports. Browser workflow and rebuilt phone-layout checks passed; native camera capture, browser-back recovery, OS termination and real venue Wi-Fi remain unverified.
- Add evaluator ownership to standout tags with an additive migration that preserves legacy tags; shared toggle behavior remains in this batch.
- Recheck the unresolved development-only `braces` advisory and replace temporary dependency overrides when upstream packages adopt patched versions. Production dependency audit is now clean locally.
- Rehearse complete database backup/restore in an isolated destination; CSV export is only an operational fallback.
- Consider explicit draft recovery for browser back/OS shutdown, multi-day athlete identity, evaluator coverage filters, and clearer duplicate-number errors after rehearsal.

## Four-week sequence

- Week 1: saving/import/data-integrity fixes, demo-account controls, dependency triage.
- Week 2: exports, archiving, mobile workflow, regression checks.
- Week 3: staff/device rehearsal with realistic roster size, simultaneous edits, photos, duplicate numbers, network loss and reconnect; rehearse backup restoration in an isolated database.
- Week 4: fix rehearsal issues, verify real staff logins, import final roster once, export a paper check-in fallback, verify venue network and charged devices. Freeze feature work before the event.
