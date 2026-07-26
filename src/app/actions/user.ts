"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const VALID_ROLES = ["DIRECTOR", "EVALUATOR", "CHECK_IN"];

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DIRECTOR") {
    throw new Error("Unauthorized");
  }

  if (!VALID_ROLES.includes(data.role)) {
    throw new Error("Invalid role");
  }

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });

  revalidatePath("/director/users");
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DIRECTOR") {
    throw new Error("Unauthorized");
  }

  if (userId === session.user.id) {
    throw new Error("You cannot delete your own account");
  }

  await db.user.delete({ where: { id: userId } });
  revalidatePath("/director/users");
  return { success: true };
}
