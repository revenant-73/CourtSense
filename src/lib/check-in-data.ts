import type { PrismaClient } from "@prisma/client";
import { POSITIONS } from "./workflow";

export function numberError(error: unknown, number: string): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
    throw new Error(`Athlete number ${number} is already assigned in this event. Choose a different number.`);
  }
  throw error;
}

export async function createWalkIn(db: PrismaClient, sessionId: string, data: { name: string; age: number; ageGroup: string; positionPreference: string; athleteNumber: string; photoUrl?: string }) {
  if (!data.name.trim()) throw new Error("Enter the athlete's full name.");
  if (!Number.isInteger(data.age) || data.age < 1 || data.age > 99) throw new Error("Age must be a whole number from 1 to 99.");
  if (!data.ageGroup.trim()) throw new Error("Enter an age group.");
  if (!POSITIONS.includes(data.positionPreference)) throw new Error("Choose a position from the list.");
  if (!/^\d{4}$/.test(data.athleteNumber)) throw new Error("Enter a four-digit athlete number.");
  try {
    return await db.$transaction(async tx => {
      const event = await tx.tryoutSession.findUnique({ where: { id: sessionId } });
      if (!event || event.status !== "ACTIVE") throw new Error("This event is archived or unavailable.");
      return tx.athlete.create({ data: { ...data, name: data.name.trim(), ageGroup: data.ageGroup.trim(), sessionId, checkInStatus: true, checkInTime: new Date() } });
    });
  } catch (error) { numberError(error, data.athleteNumber); }
}
