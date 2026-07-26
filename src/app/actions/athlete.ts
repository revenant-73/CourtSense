"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ImportAthlete {
  name: string;
  age: string;
  ageGroup: string;
  positionPreference: string;
}

export async function importAthletes(sessionId: string, athletes: ImportAthlete[]) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "DIRECTOR") {
    throw new Error("Unauthorized");
  }

  const createdAthletes = await Promise.all(
    athletes.map((athlete) =>
      db.athlete.create({
        data: {
          name: athlete.name,
          age: parseInt(athlete.age),
          ageGroup: athlete.ageGroup,
          positionPreference: athlete.positionPreference,
          sessionId: sessionId,
        },
      })
    )
  );

  revalidatePath(`/director/sessions/${sessionId}`);
  return { success: true, count: createdAthletes.length };
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
  
  if (!session) {
    throw new Error("Unauthorized");
  }

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
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  const athlete = await db.athlete.create({
    data: {
      ...data,
      sessionId,
      checkInStatus: true,
      checkInTime: new Date(),
    },
  });

  revalidatePath(`/check-in/sessions/${sessionId}`);
  revalidatePath(`/director/sessions/${sessionId}`);
  return athlete;
}
