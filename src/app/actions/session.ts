"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteSessionData } from "@/lib/session-data";

export async function deleteSession(sessionId: string) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DIRECTOR") {
    throw new Error("Unauthorized");
  }

  await deleteSessionData(db, sessionId);

  revalidatePath("/director");
  return { success: true };
}

export async function setSessionArchived(sessionId: string, archived: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DIRECTOR") throw new Error("Unauthorized");
  await db.tryoutSession.update({ where: { id: sessionId }, data: { status: archived ? "ARCHIVED" : "ACTIVE" } });
  revalidatePath("/director");
  revalidatePath("/evaluate");
  revalidatePath("/check-in");
  revalidatePath(`/director/sessions/${sessionId}`);
}
