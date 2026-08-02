"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function deleteSession(sessionId: string) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DIRECTOR") {
    throw new Error("Unauthorized");
  }

  const tryoutSession = await db.tryoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });

  if (!tryoutSession) {
    throw new Error("Session not found");
  }

  const athleteIds = await db.athlete
    .findMany({ where: { sessionId }, select: { id: true } })
    .then((list) => list.map((a) => a.id));

  await db.evaluation.deleteMany({ where: { athleteId: { in: athleteIds } } });
  await db.tag.deleteMany({ where: { athleteId: { in: athleteIds } } });
  await db.flag.deleteMany({ where: { athleteId: { in: athleteIds } } });
  await db.athlete.deleteMany({ where: { sessionId } });
  await db.tryoutSession.delete({ where: { id: sessionId } });

  revalidatePath("/director");
  return { success: true };
}
