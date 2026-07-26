import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Calendar, Users } from "lucide-react";

export default async function DirectorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DIRECTOR") {
    redirect("/login");
  }

  const tryoutSessions = await db.tryoutSession.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: { athletes: true },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Director Dashboard</h1>
        <Link
          href="/director/new-session"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          New Session
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tryoutSessions.map((s) => (
          <Link
            key={s.id}
            href={`/director/sessions/${s.id}`}
            className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {s.name}
              </h3>
              <div className="mt-2 flex flex-col space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  {new Date(s.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  {s._count.athletes} Athletes
                </div>
                <div className="text-sm text-gray-500">
                  {s.ageGroup} | {s.organization}
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    s.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {tryoutSessions.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No tryout sessions found. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
