import type { PrismaClient } from "@prisma/client";

export async function deleteSessionData(db: PrismaClient, sessionId: string) {
  await db.$transaction(async tx => {
    const tryoutSession = await tx.tryoutSession.findUnique({ where: { id: sessionId }, select: { id: true } });
    if (!tryoutSession) throw new Error("Session not found");
    const athletes = await tx.athlete.findMany({ where: { sessionId }, select: { id: true } });
    const athleteIds = athletes.map(athlete => athlete.id);
    await tx.evaluation.deleteMany({ where: { athleteId: { in: athleteIds } } });
    await tx.tag.deleteMany({ where: { athleteId: { in: athleteIds } } });
    await tx.flag.deleteMany({ where: { athleteId: { in: athleteIds } } });
    await tx.athlete.deleteMany({ where: { sessionId } });
    await tx.team.deleteMany({ where: { sessionId } });
    await tx.tryoutSession.delete({ where: { id: sessionId } });
  });
}
