/**
 * Applies pending prisma/migrations/* to a Turso (libsql://) database.
 *
 * `prisma migrate deploy` cannot connect to a libsql:// URL -- its migration
 * engine doesn't recognize the scheme, regardless of the driver adapter
 * PrismaClient uses at runtime. This applies each pending migration's SQL
 * directly via the libsql client and records it in _prisma_migrations so
 * `prisma migrate status` bookkeeping (and this script, on the next run)
 * stays consistent with what's actually been applied.
 *
 * Usage:
 *   DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx tsx prisma/apply-turso-migration.ts
 */
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !url.startsWith("libsql://")) {
    console.error("Set DATABASE_URL to a libsql:// URL before running this script.");
    process.exit(1);
  }
  if (!authToken) {
    console.error("Set TURSO_AUTH_TOKEN before running this script.");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  const applied = await client.execute(
    "SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL"
  );
  const appliedNames = new Set(applied.rows.map((r) => r.migration_name as string));

  const migrationsDir = join(__dirname, "migrations");
  const pending = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !appliedNames.has(name))
    .sort();

  if (pending.length === 0) {
    console.log("Nothing to apply -- Turso database is up to date.");
    return;
  }

  for (const name of pending) {
    const sql = readFileSync(join(migrationsDir, name, "migration.sql"), "utf8");
    console.log(`Applying ${name}...`);

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      await client.execute(statement);
    }

    const now = new Date().toISOString().replace("T", " ").replace("Z", "").slice(0, 19);
    await client.execute({
      sql: "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (?, ?, ?, ?, NULL, NULL, ?, 1)",
      args: [randomUUID(), "manual-apply", now, name, now],
    });
    console.log(`Applied ${name}.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
