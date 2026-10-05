"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, CHECK_IN_ROLES } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ImportAthlete } from "@/lib/athlete-import";
import { importRoster } from "@/lib/roster";
import { requireActiveAthlete, requireActiveSession } from "@/lib/tryout";
import { createWalkIn, numberError } from "@/lib/check-in-data";

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

  try {
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
  }).catch(error => numberError(error, data.athleteNumber));

  revalidatePath(`/check-in/sessions/${athlete.sessionId}`);
  revalidatePath(`/director/sessions/${athlete.sessionId}`);
  return { success: true as const, athlete };
  } catch (error) {
    return { success: false as const, error: error instanceof Error && error.constructor === Error ? error.message : "Could not save check-in. Check your connection and retry." };
  }
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

  try {
  await requireActiveSession(sessionId);
  const athlete = await createWalkIn(db, sessionId, { name: data.name, age: data.age, ageGroup: data.ageGroup, positionPreference: data.positionPreference, athleteNumber: data.athleteNumber, photoUrl: data.photoUrl });

  revalidatePath(`/check-in/sessions/${sessionId}`);
  revalidatePath(`/director/sessions/${sessionId}`);
  return { success: true as const, athlete };
  } catch (error) {
    return { success: false as const, error: error instanceof Error && error.constructor === Error ? error.message : "Could not add athlete. Check your connection and retry." };
  }
}
