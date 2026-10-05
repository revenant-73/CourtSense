import type { PrismaClient } from "@prisma/client";

export async function assignUnassignedAthletes(db: PrismaClient, sessionId: string, athleteIds: string[], teamId: string) {
  const ids = [...new Set(athleteIds)];
  if (!ids.length || ids.length > 1000 || ids.some(id => typeof id !== "string" || !id)) throw new Error("Select 1–1,000 unassigned athletes.");
  return db.$transaction(async tx => {
    const event = await tx.tryoutSession.findUnique({ where: { id: sessionId }, select: { status: true } });
    if (!event || event.status !== "ACTIVE") throw new Error("This event is archived or unavailable.");
    const team = await tx.team.findUnique({ where: { id: teamId }, select: { sessionId: true } });
    if (!team || team.sessionId !== sessionId) throw new Error("Choose a team in this event.");
    const result = await tx.athlete.updateMany({ where: { id: { in: ids }, sessionId, teamId: null }, data: { teamId } });
    if (result.count !== ids.length) throw new Error("An athlete is no longer unassigned or belongs to another event. Refresh and review the selection; nothing was assigned.");
    return result;
  });
}
