"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, EVALUATE_ROLES } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

  const evaluation = await db.evaluation.upsert({
    where: {
      id: (await db.evaluation.findFirst({
        where: { athleteId, evaluatorId: userId }
      }))?.id || 'new-id',
    },
    update: {
      ...data,
    },
    create: {
      ...data,
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

  const flag = await db.flag.create({
    data: {
      ...data,
      athleteId,
      evaluatorId: session.user.id,
    }
  });

  return flag;
}
