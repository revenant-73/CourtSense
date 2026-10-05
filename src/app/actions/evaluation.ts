"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, EVALUATE_ROLES } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { validateScores, SCORE_KEYS, type Scores } from "@/lib/scoring";
import { requireActiveAthlete } from "@/lib/tryout";

export async function saveEvaluation(athleteId: string, data: {
  perceptionScore: number;
  adaptabilityScore: number;
  functionalSkillScore: number;
  engagementScore: number;
  teamContributionScore: number;
  learningBehaviorScore: number;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !EVALUATE_ROLES.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  validateScores(data);
  if (data.notes !== undefined && (typeof data.notes !== "string" || data.notes.length > 10000)) throw new Error("Notes must be text under 10,000 characters");
  const scores = Object.fromEntries(SCORE_KEYS.map(key => [key, data[key]])) as Scores;
  const payload = { ...scores, notes: data.notes };
  const athlete = await db.athlete.findUnique({ where: { id: athleteId }, select: { checkInStatus: true, session: { select: { status: true } } } });
  if (!athlete?.checkInStatus || athlete.session.status !== "ACTIVE") throw new Error("Only checked-in athletes in active sessions can be evaluated");

  const evaluation = await db.evaluation.upsert({
    where: {
      athleteId_evaluatorId: { athleteId, evaluatorId: userId },
    },
    update: {
      ...payload,
    },
    create: {
      ...payload,
      athleteId,
      evaluatorId: userId,
    },
  });

  revalidatePath(`/evaluate/athletes/${athleteId}`);
  return evaluation;
}

export async function toggleTag(athleteId: string, tagName: string, note?: string) {
  const session = await getServerSession(authOptions);
  if (!session || !EVALUATE_ROLES.includes(session.user.role)) throw new Error("Unauthorized");
  await requireActiveAthlete(athleteId, true);

  const existing = await db.tag.findFirst({
    where: { athleteId, name: tagName }
  });

  if (existing) {
    await db.tag.delete({ where: { id: existing.id } });
    return { status: 'removed' };
  } else {
    await db.tag.create({
      data: { athleteId, name: tagName, note }
    });
    return { status: 'added' };
  }
}

export async function saveFlag(athleteId: string, data: {
  type: string;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !EVALUATE_ROLES.includes(session.user.role)) throw new Error("Unauthorized");
  await requireActiveAthlete(athleteId, true);

  const flag = await db.flag.create({
    data: {
      type: data.type,
      note: data.note,
      athleteId,
      evaluatorId: session.user.id,
    }
  });

  return flag;
}
