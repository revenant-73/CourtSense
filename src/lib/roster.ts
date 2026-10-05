import type { PrismaClient } from "@prisma/client";
import { athleteImportKey, validateAthleteImport, type ImportAthlete } from "./athlete-import";

export async function importRoster(db: PrismaClient, sessionId: string, athletes: ImportAthlete[]) {
  let validated;
  try { validated = validateAthleteImport(athletes); }
  catch (error) { return { success: false as const, error: error instanceof Error ? error.message : "Invalid CSV", count: 0 }; }
  return db.$transaction(async tx => {
    const tryout = await tx.tryoutSession.findUnique({ where: { id: sessionId } });
    if (!tryout || tryout.status !== "ACTIVE") return { success: false as const, error: "Choose an active tryout session", count: 0 };
    const existing = await tx.athlete.findMany({ where: { sessionId }, select: { name: true, age: true, ageGroup: true } });
    const keys = new Set(existing.map(athleteImportKey));
    const duplicate = validated.find(athlete => keys.has(athleteImportKey(athlete)));
    if (duplicate) return { success: false as const, error: `${duplicate.name} matches an existing athlete's name, age, and age group. No athletes were imported; review the roster before retrying.`, count: 0 };
    const result = await tx.athlete.createMany({ data: validated.map(athlete => ({ ...athlete, sessionId })) });
    return { success: true as const, count: result.count };
  });
}
