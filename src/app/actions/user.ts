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

  if (!data.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || data.password.length < 12 || data.password.length > 128) throw new Error("Provide a name, valid email, and password of 12–128 characters");
  const email = data.email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await db.user.create({
    data: {
      name: data.name,
      email,
      password: hashedPassword,
      role: data.role,
    },
  });

  revalidatePath("/director/users");
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function resetUserPassword(userId: string, password: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DIRECTOR") throw new Error("Unauthorized");
  if (typeof password !== "string" || password.length < 12 || password.length > 128) throw new Error("Use a password of 12–128 characters");
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  revalidatePath("/director/users");
  return { success: true };
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
