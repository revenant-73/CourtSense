import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ImportAthletes from "@/components/ImportAthletes";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import ArchiveSessionButton from "@/components/ArchiveSessionButton";
import { Calendar, Users, MapPin } from "lucide-react";
import { formatPosition } from "@/lib/utils";
import { observationSummary } from "@/lib/scoring";

export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "DIRECTOR") {
    redirect("/login");
  }

  const tryoutSession = await db.tryoutSession.findUnique({
    where: { id },
    include: {
      athletes: {
        orderBy: { name: "asc" },
        include: { evaluations: true },
      },
    },
  });

  if (!tryoutSession) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{tryoutSession.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-foreground/40">
          <div className="flex items-center">
            <Calendar className="mr-1.5 h-4 w-4" />
            {new Date(tryoutSession.date).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <MapPin className="mr-1.5 h-4 w-4" />
            {tryoutSession.organization}
          </div>
          <div className="flex items-center">
            <Users className="mr-1.5 h-4 w-4" />
            {tryoutSession.ageGroup}
          </div>
        </div>
      </div>

      <nav aria-label="Event actions" className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {[["Check-in", `/check-in/sessions/${id}`], ["Evaluate", `/evaluate/sessions/${id}`], ["Review", `/director/sessions/${id}/review`], ["Teams", `/director/sessions/${id}/teams`], ["Export CSV", `/api/sessions/${id}/export`]].map(([label, href]) => (
          <a key={label} href={href} className="px-4 py-3 rounded-xl bg-white/10 text-center font-semibold">{label}</a>
        ))}
      </nav>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" aria-label="Event progress">
        {[["Registered", tryoutSession.athletes.length], ["Checked in", tryoutSession.athletes.filter(a => a.checkInStatus).length], ["With observations", tryoutSession.athletes.filter(a => observationSummary(a.evaluations).observed > 0).length], ["Unassigned", tryoutSession.athletes.filter(a => !a.teamId).length]].map(([label, count]) => (
          <div key={label} className="glass-card p-4 rounded-xl"><p className="text-sm text-foreground/70">{label}</p><p className="text-2xl font-bold">{count}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-[2rem] border-white/5 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-medium text-foreground">Registered Athletes</h2>
              <span className="bg-white/5 text-foreground/60 text-xs font-semibold px-2.5 py-0.5 rounded">
                {tryoutSession.athletes.length} Total
              </span>
            </div>
            <ul className="divide-y divide-white/5">
              {tryoutSession.athletes.map((athlete) => (
                <li key={athlete.id} className="px-4 py-4 sm:px-6 hover:bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="h-10 w-10 flex-shrink-0 bg-white/10 rounded-full flex items-center justify-center text-foreground/40 font-bold">
                        {athlete.athleteNumber || "?"}
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-foreground break-words">{athlete.name}</div>
                        <div className="text-xs text-foreground/40">
                          {athlete.age}y | {formatPosition(athlete.positionPreference)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          athlete.checkInStatus
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {athlete.checkInStatus ? "Checked In" : "Pending"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {tryoutSession.athletes.length === 0 && (
                <li className="px-4 py-12 text-center text-foreground/30 italic">
                  No athletes registered yet.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card rounded-[2rem] border-white/5 p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Actions</h2>
            <p className="text-sm text-foreground/60 mb-3">{tryoutSession.status}</p>
            <a href={`/api/sessions/${id}/export`} className="block rounded-xl bg-primary text-white text-center px-4 py-3 mb-3">Export results CSV</a>
            <ArchiveSessionButton sessionId={id} archived={tryoutSession.status === "ARCHIVED"} />
            <Link
              href={`/director/sessions/${id}/review`}
              className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-glow text-sm font-medium text-white bg-success hover:bg-success/90 mb-3 transition-colors"
            >
              Go to Review Dashboard
            </Link>
            <Link
              href={`/director/sessions/${id}/teams`}
              className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl text-sm font-medium text-foreground/70 bg-white/5 hover:bg-white/10 mb-4 transition-colors"
            >
              Manage Teams
            </Link>
            <h2 className="text-lg font-medium text-foreground mb-4 pt-4 border-t border-white/5">Import Athletes</h2>
            {tryoutSession.status === "ACTIVE" ? <ImportAthletes sessionId={id} /> : <p className="text-sm text-foreground/60">Reopen this session to import athletes.</p>}
          </div>

          <div className="glass-card rounded-[2rem] border-white/5 p-6">
            <h2 className="text-lg font-medium text-warning mb-4">Danger Zone</h2>
            <DeleteSessionButton
              sessionId={id}
              sessionName={tryoutSession.name}
              athleteCount={tryoutSession.athletes.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
