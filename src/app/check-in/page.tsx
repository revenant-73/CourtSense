import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Users, ChevronRight } from "lucide-react";

export default async function CheckInDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const tryoutSessions = await db.tryoutSession.findMany({
    where: { status: "ACTIVE" },
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: { athletes: true },
      },
    },
  });

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-6">Check-In</h1>

      <div className="space-y-4">
        {tryoutSessions.map((s) => (
          <Link
            key={s.id}
            href={`/check-in/sessions/${s.id}`}
            className="flex items-center justify-between p-4 glass-card rounded-xl border-white/5 hover:border-primary/40 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-foreground">{s.name}</h3>
              <div className="flex items-center text-xs text-foreground/50 mt-1">
                <Calendar className="h-3 w-3 mr-1 text-foreground/40" />
                {new Date(s.date).toLocaleDateString()}
                <span className="mx-2">|</span>
                <Users className="h-3 w-3 mr-1 text-foreground/40" />
                {s._count.athletes} Registered
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-foreground/40" />
          </Link>
        ))}
        {tryoutSessions.length === 0 && (
          <div className="text-center py-12 glass-card rounded-xl border-2 border-dashed border-white/10">
            <p className="text-foreground/40">No active sessions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
