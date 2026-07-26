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
    <div className="max-w-md mx-auto px-6 py-8 pb-32">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-1 h-8 bg-primary rounded-full shadow-glow"></div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Evaluations</h1>
      </div>
      
      <div className="space-y-6">
        {tryoutSessions.map((s) => (
          <Link
            key={s.id}
            href={`/evaluate/sessions/${s.id}`}
            className="block p-6 glass-card rounded-3xl group hover:border-primary/50 transition-all active:scale-[0.98]"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</h3>
                <div className="flex items-center text-sm text-foreground/50 mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center text-primary font-bold text-sm uppercase tracking-widest">
                <ClipboardList className="h-5 w-5 mr-2" />
                Start Scouting
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>
        ))}
        {tryoutSessions.length === 0 && (
          <div className="text-center py-20 glass-card rounded-3xl border-dashed">
            <p className="text-foreground/40 font-medium">No active sessions for evaluation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
