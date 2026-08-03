# Roadmap to Aug 17 Launch

Assessment taken 2026-08-02. Target: fully operational for real tryout use by **2026-08-17**.

## What's Solid

- Core workflow is built and `next build` succeeds cleanly: Director creates sessions and manages users, Check-in staff register/photograph athletes, Evaluators score them on 6 categories plus tags/flags, Director reviews aggregated results.
- Auth is real (bcrypt + NextAuth credentials). A former login bypass backdoor was removed and replaced with a properly gated demo-login (see [CHANGELOG.md](CHANGELOG.md)).
- Role-based access is enforced server-side on check-in/evaluate routes and their actions, not just hidden in the nav.
- Data model (`prisma/schema.prisma`) is coherent, with a working seed script (3 demo users, 30-athlete demo session).
- `Evaluation` has a proper `@@unique([athleteId, evaluatorId])` constraint and `saveEvaluation` does a real upsert — no more duplicate-row risk on rapid saves.
- Director review dashboard's "Avg" column is a true average across all 6 scoring categories, and its "View" button opens a real per-athlete detail page (all evaluators' individual scores, notes, tags, flags).
- Director can delete a session (and all its athletes/evaluations/tags/flags) from the session detail page's Danger Zone.
- `npx eslint .` is down to 0 errors (was 8). Remaining 6 warnings are all `<img>` vs `next/image` perf suggestions, left as-is.
- Production deploy target is decided: Vercel (`court-sense` project) + Turso, already live and confirmed working. `prisma/seed-director.ts` bootstraps a single real Director account without fake data; `prisma/seed.ts` remains available for demo data. `prisma/apply-turso-migration.ts` applies pending migrations to the Turso database (see [Known Dev Gotcha](#known-dev-gotcha) below for why this can't run automatically in the Vercel build). See README's Deployment section for the full one-time setup steps.
- README replaced with real setup/deploy docs; `.env.example` committed.

## What Needs Work

1. **No automated tests** — nothing verifies auth, role gating, or scoring logic.
2. **Demo credentials are well-known** (`admin@tvvc.org` / `evaluator@tvvc.org` / `checkin@tvvc.org`, password `admin123`). Fine for a dry run, but change or delete them before the real event if `npx prisma db seed` was ever run against the production database.
3. Minor: two different position-preference strings can format to the same display label (e.g. "Opposite Hitter" vs "OH"), which produces duplicate-looking options in the Director review filter dropdown — cosmetic, not a data-correctness issue.

## Fixed: production photo-upload failure

Vercel's runtime error logs showed a real user hitting `Body exceeded 1 MB limit` on `/check-in/athletes/[id]` (2026-07-26) — raw camera photos were being base64-encoded and sent straight through a Server Action, which defaults to a 1MB body cap. Since every athlete gets a photo at check-in, this would have broken check-in at the real event. Fixed:

- Added [src/lib/image.ts](src/lib/image.ts)'s `compressImage()` — resizes to a max 800px dimension and re-encodes as JPEG (quality 0.7) client-side before upload. Wired into both `CheckInForm.tsx` and `WalkInForm.tsx`.
- Raised the Server Action body limit to `4mb` in `next.config.ts` as a safety net.
- Verified: a synthetic 3024×4032 test photo (matching real phone camera resolution) compresses to well under 1MB, and a full form submission through the actual UI (photo → submit → save) returned `200 OK`.

## Known Dev Gotcha

After changing `prisma/schema.prisma`, `npx prisma generate` alone can leave the dev server validating queries against a stale schema (`PrismaClientValidationError: Unknown argument ...` for fields/keys that exist in `schema.prisma`). Root cause: `query_compiler_fast_bg.wasm-base64.js` (what Turbopack actually loads, since it can't `require()` raw `.wasm`) isn't always refreshed by `prisma generate` alongside its `.wasm` sibling. Fix: `rm -rf node_modules/@prisma/client && npm install @prisma/client@<version> --no-save && npx prisma generate`, then delete `.next` and restart the dev server.

## Known Deploy Gotcha

**Never add `prisma migrate deploy` to the Vercel build command.** It cannot connect to a `libsql://` URL — the migration engine's own URL parsing doesn't recognize the scheme (error `P1013`), regardless of the driver adapter PrismaClient uses at runtime. This was tried on 2026-08-02 and broke a production deploy (`ERROR` state) for about 30 minutes before being reverted. Migrations against the Turso production database must be applied directly with `npx tsx prisma/apply-turso-migration.ts` — see README's Deployment section.

## Suggested Order

1. ~~Fix the evaluation-save race condition.~~ Done.
2. ~~Manually walk the full flow (check-in → evaluate → review).~~ Done — surfaced and fixed the Avg bug and the dead View button.
3. ~~Pin down the production DB/deploy target and add a real `.env.example`.~~ Done.
4. ~~Clean up lint errors.~~ Done.
5. ~~Replace boilerplate README.~~ Done.
6. Run the one-time production setup steps in the README (Turso env vars in Vercel, bootstrap Director account) before the 17th.
7. Decide whether to add any automated test coverage given the remaining time, or rely on manual verification.
