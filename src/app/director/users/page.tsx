import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagement from "@/components/UserManagement";

export default async function ManageUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DIRECTOR") {
    redirect("/login");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-1 h-8 bg-primary rounded-full shadow-glow"></div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">Manage Users</h1>
      </div>
      <p className="text-foreground/40 text-sm font-bold uppercase tracking-[0.2em] ml-4 mb-10">Accounts & Roles</p>

      <UserManagement
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
