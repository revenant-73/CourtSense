# CourtSense

A volleyball tryout management app for three roles — **Director**, **Evaluator**, and **Check-in Staff**.

- **Check-in staff** register athletes as they arrive, take a photo, and assign a jersey/roster number.
- **Evaluators** score checked-in athletes on 6 ecological categories (perception, adaptability, functional skill, engagement, team contribution, learning behavior), tag standout skills, and flag athletes for discussion.
- **Directors** create tryout sessions, manage user accounts, and review aggregated results across all evaluators.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) with Turbopack
- [Prisma ORM](https://www.prisma.io) with the [`@prisma/adapter-libsql`](https://www.npmjs.com/package/@prisma/adapter-libsql) driver adapter (SQLite / [Turso](https://turso.tech))
- [NextAuth](https://next-auth.js.org) with a credentials provider (bcrypt-hashed passwords)
- Tailwind CSS

> **Note:** this project runs on a pre-release/non-standard build of Next.js — some APIs and dev-server behavior differ from the current stable docs. See `AGENTS.md`.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values (see [Environment Variables](#environment-variables) below).

```bash
cp .env.example .env
```

### 3. Set up the database

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

The seed script creates three demo accounts (Director, Evaluator, Check-in Staff — all password `admin123`) and a 30-athlete demo tryout session.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite connection string. Local dev: `file:./dev.db`. Turso: `libsql://<db>.turso.io` |
| `TURSO_AUTH_TOKEN` | Only for Turso | Auth token for a remote Turso database. Omit for a local SQLite file. |
| `NEXTAUTH_SECRET` | Yes | Random secret used to sign session tokens. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes | The app's base URL (e.g. `http://localhost:3000` in dev, your production URL in prod). |
| `NEXT_PUBLIC_SHOW_DEMO_LOGIN` | No | Set to `"true"` to show one-click demo login buttons on `/login` (useful for demos; omit once real tryout data is in use). |

## Useful Commands

```bash
npx prisma studio          # browse the database in a GUI
npx prisma migrate dev     # create a new migration (interactive; see note below)
npx eslint .                # lint
npx tsc --noEmit            # type-check
npx next build               # production build
```

**Note:** `prisma migrate dev` requires an interactive terminal and will fail in non-interactive shells. In that case, hand-write the migration SQL under `prisma/migrations/<timestamp>_<name>/migration.sql` and apply it with `npx prisma migrate deploy` (works against the local `file:` database — for the Turso production database, see [Deployment](#deployment)).

If you edit `prisma/schema.prisma` and later hit a `PrismaClientValidationError` for a field/key that *is* in the schema, the dev server is likely serving a stale generated client. Fix: `rm -rf node_modules/@prisma/client && npm install @prisma/client@<version> --no-save && npx prisma generate`, then delete `.next` and restart the dev server.

## Deployment

Deployed on Vercel (project `court-sense`), backed by a [Turso](https://turso.tech) database in production. `vercel.json`'s build command is `npx prisma generate && next build`.

**Migrations do *not* run automatically on deploy.** `prisma migrate deploy` cannot connect to a `libsql://` URL — its migration engine doesn't recognize the scheme, regardless of the driver adapter PrismaClient uses at runtime. (This was tried once and broke a production deploy; don't add it back to `vercel.json`.) Instead, whenever `prisma/schema.prisma` changes, apply the new migration to the Turso database directly:

```bash
DATABASE_URL="<turso-url>" TURSO_AUTH_TOKEN="<token>" npx tsx prisma/apply-turso-migration.ts
```

This applies any migration under `prisma/migrations/` not yet recorded in Turso's `_prisma_migrations` table, and is safe to re-run (it's a no-op once everything's applied).

### One-time production setup

1. In the Vercel project's environment variables, set `DATABASE_URL` (your Turso `libsql://...` URL), `TURSO_AUTH_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production domain), and `NEXT_PUBLIC_SHOW_DEMO_LOGIN` (`"true"` or omit).
2. Run `npx tsx prisma/apply-turso-migration.ts` (as above) against the new database, then deploy.
3. Bootstrap the first real Director account — no fake data, just one real login:

   ```bash
   DATABASE_URL="<turso-url>" TURSO_AUTH_TOKEN="<token>" \
   BOOTSTRAP_DIRECTOR_EMAIL="you@example.com" \
   BOOTSTRAP_DIRECTOR_NAME="Your Name" \
   BOOTSTRAP_DIRECTOR_PASSWORD="<a real password>" \
   npx tsx prisma/seed-director.ts
   ```

   Sign in as that Director and use **Manage Users** in the app to create real Evaluator and Check-in Staff accounts.
4. (Optional) Also run `npx prisma db seed` against the same database to add the 3 demo accounts (`admin@tvvc.org` / `evaluator@tvvc.org` / `checkin@tvvc.org`, password `admin123`) and a 30-athlete demo session — useful for a dry run before the real event. **Delete the demo session from the Director dashboard's Danger Zone before the actual tryout** — this removes the session and all its athletes/evaluations/tags/flags. The demo *accounts* aren't removed by that (only the demo session), so change or delete them separately if you don't want well-known demo credentials sitting in production.
