import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Calendar } from "lucide-react";

export default async function EvaluateDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const tryoutSessions = await db.tryoutSession.findMany({
    where: { status: "ACTIVE" },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Evaluations</h1>
      
      <div className="space-y-4">
        {tryoutSessions.map((s) => (
          <Link
            key={s.id}
            href={`/evaluate/sessions/${s.id}`}
            className="block p-6 bg-white border rounded-2xl shadow-sm hover:border-indigo-500 transition-colors"
          >
            <h3 className="text-lg font-bold text-gray-900">{s.name}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(s.date).toLocaleDateString()}
            </div>
            <div className="mt-4 flex items-center text-indigo-600 font-semibold">
              <ClipboardList className="h-5 w-5 mr-2" />
              Start Evaluating
            </div>
          </Link>
        ))}
        {tryoutSessions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No active sessions for evaluation.
          </div>
        )}
      </div>
    </div>
  );
}
