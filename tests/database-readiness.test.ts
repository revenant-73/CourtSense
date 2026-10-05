import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import type { CredentialsConfig } from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { importRoster } from "../src/lib/roster";
import { deleteSessionData } from "../src/lib/session-data";

test("isolated SQLite/Turso adapter regression checks", async t => {
  const root = mkdtempSync(join(tmpdir(), "courtsense-readiness-test-"));
  const url = "file:" + join(root, "test.db").replaceAll("\\", "/");
  // Never read .env or use an existing database for these tests.
  process.env.DATABASE_URL = url;
  delete process.env.TURSO_AUTH_TOKEN;
  Object.assign(process.env, { NODE_ENV: "production" });
  const client = createClient({ url });
  const migrations = resolve("prisma/migrations");
  for (const entry of readdirSync(migrations, { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    await client.executeMultiple(readFileSync(join(migrations, entry.name, "migration.sql"), "utf8"));
  }
  client.close();
  const db = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  let authDb: PrismaClient | undefined;
  try {
    await db.user.create({ data: { id: "director", email: "director@test.invalid", role: "DIRECTOR", password: await bcrypt.hash("Test-private-password!", 10) } });
    await db.user.create({ data: { id: "demo", email: "admin@tvvc.org", role: "DIRECTOR", password: await bcrypt.hash("admin123", 10) } });
    await db.tryoutSession.create({ data: { id: "session", name: "Test", organization: "Test", ageGroup: "16U", date: new Date() } });
    const row = { name: "Alex", age: "16", ageGroup: "16U", positionPreference: "Setter" };
    await t.test("valid batch commits once; mixed duplicate retry writes nothing", async () => {
      assert.deepEqual(await importRoster(db, "session", [row]), { success: true, count: 1 });
      const rejected = await importRoster(db, "session", [{ ...row, name: "Should not save" }, row]);
      assert.equal(rejected.success, false);
      assert.equal(await db.athlete.count(), 1);
      const invalid = await importRoster(db, "session", [{ ...row, name: "New" }, { ...row, age: "bad" }]);
      assert.equal(invalid.success, false);
      assert.equal(await db.athlete.count(), 1);
    });
    await t.test("archived session blocks imports and athlete writes", async () => {
      await db.tryoutSession.update({ where: { id: "session" }, data: { status: "ARCHIVED" } });
      assert.equal((await importRoster(db, "session", [{ ...row, name: "New" }])).success, false);
      const { requireActiveSession, requireActiveAthlete } = await import("../src/lib/tryout");
      authDb = (await import("../src/lib/db")).db;
      await assert.rejects(requireActiveSession("session"), /archived/);
      const athlete = await db.athlete.findFirstOrThrow();
      await assert.rejects(requireActiveAthlete(athlete.id), /archived/);
      await db.tryoutSession.update({ where: { id: "session" }, data: { status: "ACTIVE" } });
      await assert.doesNotReject(requireActiveSession("session"));
    });
    const { authOptions } = await import("../src/lib/auth");
    const provider = authOptions.providers[0] as CredentialsConfig;
    const authorize = provider.options?.authorize ?? provider.authorize;
    const request = { body: {}, query: {}, headers: {}, method: "POST" };
    const jwt = authOptions.callbacks!.jwt!;
    const refresh = (token: JWT) => jwt({ token, account: null, user: undefined } as unknown as Parameters<typeof jwt>[0]);
    await t.test("production rejects known demo credentials; real credentials authenticate", async () => {
      assert.equal(await authorize({ email: "admin@tvvc.org", password: "admin123" }, request), null);
      const user = await authorize({ email: " DIRECTOR@TEST.INVALID ", password: "Test-private-password!" }, request);
      assert.equal(user?.id, "director");
    });
    await t.test("reset or removal revokes sessions; old versionless tokens rejected", async () => {
      const user = await authorize({ email: "director@test.invalid", password: "Test-private-password!" }, request);
      const token = await jwt({ token: { id: "", role: "" }, user, account: null } as Parameters<typeof jwt>[0]);
      assert.equal((await refresh(token)).id, "director");
      assert.equal((await refresh({ id: "director", role: "DIRECTOR" })).id, "");
      await db.user.update({ where: { id: "director" }, data: { password: await bcrypt.hash("Updated-private-password!", 10) } });
      assert.equal((await refresh(token)).id, "");
      const freshUser = await authorize({ email: "director@test.invalid", password: "Updated-private-password!" }, request);
      const freshToken = await jwt({ token: { id: "", role: "" }, user: freshUser, account: null } as Parameters<typeof jwt>[0]);
      assert.equal((await refresh(freshToken)).id, "director");
      await db.user.delete({ where: { id: "director" } });
      assert.equal((await refresh(freshToken)).id, "");
    });
    await db.user.create({ data: { id: "evaluator", email: "evaluator@test.invalid", role: "EVALUATOR", password: "test-only" } });
    const athlete = await db.athlete.findFirstOrThrow();
    const team = await db.team.create({ data: { sessionId: "session", name: "16U Red" } });
    await db.athlete.update({ where: { id: athlete.id }, data: { teamId: team.id } });
    await db.evaluation.create({ data: { athleteId: athlete.id, evaluatorId: "evaluator", perceptionScore: 3 } });
    await db.tag.create({ data: { athleteId: athlete.id, name: "Serving" } });
    await db.flag.create({ data: { athleteId: athlete.id, evaluatorId: "evaluator", type: "Discuss" } });
    await t.test("session deletion rolls back every record if any step fails", async () => {
      const failingDb = db.$extends({ query: { team: { async deleteMany() { throw new Error("Injected storage failure"); } } } });
      await assert.rejects(deleteSessionData(failingDb as unknown as PrismaClient, "session"), /Injected storage failure/);
      assert.equal(await db.athlete.count(), 1);
      assert.equal(await db.evaluation.count(), 1);
      assert.equal(await db.tag.count(), 1);
      assert.equal(await db.flag.count(), 1);
      assert.equal(await db.team.count(), 1);
      assert.equal(await db.tryoutSession.count(), 1);
    });
    await t.test("successful session deletion removes related data and preserves users", async () => {
      await deleteSessionData(db, "session");
      assert.equal(await db.tryoutSession.count(), 0);
      assert.equal(await db.athlete.count(), 0);
      assert.equal(await db.evaluation.count(), 0);
      assert.equal(await db.tag.count(), 0);
      assert.equal(await db.flag.count(), 0);
      assert.equal(await db.team.count(), 0);
      assert.equal(await db.user.count(), 2);
    });
  } finally {
    await authDb?.$disconnect();
    await db.$disconnect();
    assert.equal(resolve(root).startsWith(join(resolve(tmpdir()), "courtsense-readiness-test-")), true);
    try { await rm(root, { recursive: true, force: true }); }
    catch (error) {
      // Windows may retain native SQLite handles until this test process exits.
      // The directory contains only disposable fixtures, never real app data.
      if (process.platform !== "win32" || (error as NodeJS.ErrnoException).code !== "EBUSY") throw error;
      t.diagnostic(`Temporary test database retained until process exit: ${root}`);
    }
  }
});
