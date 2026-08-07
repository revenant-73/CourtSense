"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireDirector() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DIRECTOR") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createTeam(sessionId: string, name: string) {
  await requireDirector();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Team name is required");
  }

  const existing = await db.team.findFirst({
    where: { sessionId, name: trimmed },
  });
  if (existing) {
    throw new Error("A team with this name already exists for this session");
  }

  const team = await db.team.create({
    data: { sessionId, name: trimmed },
  });

  revalidatePath(`/director/sessions/${sessionId}/teams`);
  revalidatePath(`/director/sessions/${sessionId}/review`);
  return team;
}

export async function deleteTeam(teamId: string) {
  await requireDirector();

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new Error("Team not found");
  }

  await db.athlete.updateMany({
    where: { teamId },
    data: { teamId: null },
  });
  await db.team.delete({ where: { id: teamId } });

  revalidatePath(`/director/sessions/${team.sessionId}/teams`);
  revalidatePath(`/director/sessions/${team.sessionId}/review`);
  return { success: true };
}

export async function assignAthleteTeam(athleteId: string, teamId: string | null) {
  await requireDirector();

  const athlete = await db.athlete.findUnique({
    where: { id: athleteId },
    select: { sessionId: true },
  });
  if (!athlete) {
    throw new Error("Athlete not found");
  }

  if (teamId) {
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team || team.sessionId !== athlete.sessionId) {
      throw new Error("Invalid team");
    }
  }

  await db.athlete.update({
    where: { id: athleteId },
    data: { teamId },
  });

  revalidatePath(`/director/sessions/${athlete.sessionId}/teams`);
  revalidatePath(`/director/sessions/${athlete.sessionId}/review`);
  revalidatePath(`/director/athletes/${athleteId}`);
  return { success: true };
}
