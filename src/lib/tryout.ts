import { db } from "@/lib/db";

export async function requireActiveSession(sessionId: string) {
  const session = await db.tryoutSession.findUnique({ where: { id: sessionId }, select: { status: true } });
  if (!session || session.status !== "ACTIVE") throw new Error("This session is archived or unavailable. Reopen it before making changes.");
}

export async function requireActiveAthlete(athleteId: string, checkedIn = false) {
  const athlete = await db.athlete.findUnique({ where: { id: athleteId }, select: { sessionId: true, checkInStatus: true } });
  if (!athlete || (checkedIn && !athlete.checkInStatus)) throw new Error("Athlete unavailable or not checked in");
  await requireActiveSession(athlete.sessionId);
  return athlete;
}
