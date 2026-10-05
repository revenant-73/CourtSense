"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, CHECK_IN_ROLES } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ImportAthlete } from "@/lib/athlete-import";
import { importRoster } from "@/lib/roster";
import { requireActiveAthlete, requireActiveSession } from "@/lib/tryout";

export async function importAthletes(sessionId: string, athletes: ImportAthlete[]) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "DIRECTOR") {
    throw new Error("Unauthorized");
  }

  const result = await importRoster(db, sessionId, athletes);

  revalidatePath(`/director/sessions/${sessionId}`);
  return result;
}

export async function createSession(data: {
  name: string;
  organization: string;
  date: string;
  ageGroup: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "DIRECTOR") {
    throw new Error("Unauthorized");
  }

  const newSession = await db.tryoutSession.create({
    data: {
      name: data.name,
      organization: data.organization,
      date: new Date(data.date),
      ageGroup: data.ageGroup,
    },
  });

  revalidatePath("/director");
  return newSession;
}

export async function checkInAthlete(athleteId: string, data: {
  athleteNumber: string;
  photoUrl?: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !CHECK_IN_ROLES.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  await requireActiveAthlete(athleteId);
  if (!/^\d{4}$/.test(data.athleteNumber)) throw new Error("Assign a four-digit athlete number");
  const athlete = await db.athlete.update({
    where: { id: athleteId },
    data: {
      athleteNumber: data.athleteNumber,
      photoUrl: data.photoUrl,
      checkInStatus: true,
      checkInTime: new Date(),
    },
  });

  revalidatePath(`/check-in/sessions/${athlete.sessionId}`);
  revalidatePath(`/director/sessions/${athlete.sessionId}`);
  return athlete;
}

export async function addWalkInAthlete(sessionId: string, data: {
  name: string;
  age: number;
  ageGroup: string;
  positionPreference: string;
  athleteNumber: string;
  photoUrl?: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !CHECK_IN_ROLES.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  await requireActiveSession(sessionId);
  if (!data.name.trim() || !data.ageGroup.trim() || !data.positionPreference.trim() || !Number.isInteger(data.age) || data.age < 1 || data.age > 99 || !/^\d{4}$/.test(data.athleteNumber)) throw new Error("Provide a name, age (1–99), age group, position, and four-digit number");
  const athlete = await db.athlete.create({
    data: {
      name: data.name.trim(),
      age: data.age,
      ageGroup: data.ageGroup.trim(),
      positionPreference: data.positionPreference.trim(),
      athleteNumber: data.athleteNumber,
      photoUrl: data.photoUrl,
      sessionId,
      checkInStatus: true,
      checkInTime: new Date(),
    },
  });

  revalidatePath(`/check-in/sessions/${sessionId}`);
  revalidatePath(`/director/sessions/${sessionId}`);
  return athlete;
}
