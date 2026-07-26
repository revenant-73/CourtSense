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
    <div className="max-w-7xl mx-auto px-6 py-8 pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-1 h-8 bg-primary rounded-full shadow-glow"></div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Director Control</h1>
          </div>
          <p className="text-foreground/40 text-sm font-bold uppercase tracking-[0.2em] ml-4">Organization Oversight</p>
        </div>
        <Link
          href="/director/new-session"
          className="inline-flex items-center px-6 py-4 rounded-2xl shadow-glow text-xs font-black uppercase tracking-widest text-white bg-primary hover:bg-primary/90 transition-all active:scale-95 self-start sm:self-center"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Session
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tryoutSessions.map((s) => (
          <Link
            key={s.id}
            href={`/director/sessions/${s.id}`}
            className="block glass-card overflow-hidden rounded-[2rem] border-white/5 hover:border-primary/40 transition-all group shadow-xl active:scale-[0.98]"
          >
            <div className="px-8 py-8">
              <div className="flex justify-between items-start mb-6">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    s.status === "ACTIVE"
                      ? "bg-success/10 text-success border-success/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : "bg-white/5 text-foreground/30 border-white/5"
                  }`}
                >
                  {s.status}
                </span>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 5l7 7-7 7"></path></svg>
                </div>
              </div>

              <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-4">
                {s.name}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center text-xs font-bold text-foreground/40 uppercase tracking-wider">
                  <Calendar className="flex-shrink-0 mr-3 h-4 w-4 text-primary/60" />
                  {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center text-xs font-bold text-foreground/40 uppercase tracking-wider">
                  <Users className="flex-shrink-0 mr-3 h-4 w-4 text-primary/60" />
                  {s._count.athletes} Athletes
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">
                  {s.ageGroup} | {s.organization}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {tryoutSessions.length === 0 && (
          <div className="col-span-full py-24 text-center glass-card rounded-[2.5rem] border-dashed">
            <p className="text-foreground/30 font-black uppercase tracking-widest text-xs">No active tryout data streams</p>
          </div>
        )}
      </div>
    </div>
  );
}
