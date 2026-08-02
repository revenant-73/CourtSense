import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flag as FlagIcon, Tag as TagIcon, Star, MessageSquare } from "lucide-react";
import { formatPosition } from "@/lib/utils";

const CATEGORIES = [
  { id: "perceptionScore", label: "Perception & Decision" },
  { id: "adaptabilityScore", label: "Adaptability" },
  { id: "functionalSkillScore", label: "Functional Skill" },
  { id: "engagementScore", label: "Competitive Engagement" },
  { id: "teamContributionScore", label: "Team Contribution" },
  { id: "learningBehaviorScore", label: "Learning Behavior" },
] as const;

const SCORE_LABELS = ["Not Observed", "Emerging", "Consistent", "Standout"];

interface ScoredEvaluation {
  perceptionScore: number;
  adaptabilityScore: number;
  functionalSkillScore: number;
  engagementScore: number;
  teamContributionScore: number;
  learningBehaviorScore: number;
}

function evaluationAverage(e: ScoredEvaluation) {
  const total = CATEGORIES.reduce((acc, c) => acc + e[c.id], 0);
  return total / CATEGORIES.length;
}

export default async function DirectorAthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "DIRECTOR") {
    redirect("/login");
  }

  const athlete = await db.athlete.findUnique({
    where: { id },
    include: {
      evaluations: {
        include: { evaluator: true },
        orderBy: { createdAt: "asc" },
      },
      tags: true,
      flags: {
        include: { evaluator: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!athlete) {
    notFound();
  }

  const overallAvg =
    athlete.evaluations.length > 0
      ? (
          athlete.evaluations.reduce((acc, e) => acc + evaluationAverage(e), 0) /
          athlete.evaluations.length
        ).toFixed(1)
      : "-";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <Link
        href={`/director/sessions/${athlete.sessionId}/review`}
        className="inline-flex items-center text-sm font-bold text-foreground/60 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Review Dashboard
      </Link>

      <div className="glass-card rounded-[2rem] border-white/5 p-6 mb-6 flex items-center gap-4">
        <div className="h-16 w-16 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-foreground/20 font-bold text-2xl">
          {athlete.photoUrl ? (
            <img src={athlete.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            athlete.name.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary text-white font-black text-xs px-2 py-1 rounded-md shadow-glow">
              #{athlete.athleteNumber}
            </span>
            <h1 className="text-xl font-bold text-foreground truncate">{athlete.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <span className="font-medium">{formatPosition(athlete.positionPreference)}</span>
            <span className="text-foreground/20">•</span>
            <span>{athlete.ageGroup}</span>
            <span className="text-foreground/20">•</span>
            <span>{athlete.age}y</span>
          </div>
        </div>
        <div className="text-center flex-shrink-0">
          <p className="text-[9px] text-foreground/40 uppercase font-bold">Avg ({athlete.evaluations.length})</p>
          <p className="text-2xl font-black text-success">{overallAvg}</p>
        </div>
      </div>

      {athlete.tags.length > 0 && (
        <section className="mb-6">
          <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-3 flex items-center">
            <TagIcon className="h-3 w-3 mr-2 text-primary" />
            Standout Indicators
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {athlete.tags.map((t) => (
              <span
                key={t.id}
                className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20"
              >
                {t.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {athlete.flags.length > 0 && (
        <section className="mb-6">
          <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-3 flex items-center">
            <FlagIcon className="h-3 w-3 mr-2 text-warning" />
            Flags
          </h3>
          <div className="space-y-2">
            {athlete.flags.map((f) => (
              <div key={f.id} className="glass-card rounded-2xl border-warning/20 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-warning">{f.type}</span>
                  <span className="text-[10px] text-foreground/40">
                    {f.evaluator.name || f.evaluator.email} • {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {f.note && <p className="text-xs text-foreground/60">{f.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-3 flex items-center">
          <Star className="h-3 w-3 mr-2 text-primary" />
          Evaluations ({athlete.evaluations.length})
        </h3>
        {athlete.evaluations.length === 0 && (
          <p className="text-sm text-foreground/30 italic glass-card rounded-2xl p-6 text-center">
            No evaluations submitted yet.
          </p>
        )}
        <div className="space-y-4">
          {athlete.evaluations.map((e) => (
            <div key={e.id} className="glass-card rounded-[2rem] border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-foreground">
                  {e.evaluator.name || e.evaluator.email}
                </span>
                <span className="text-sm font-black text-success">{evaluationAverage(e).toFixed(1)} avg</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <p className="text-[9px] text-foreground/40 uppercase tracking-wide truncate" title={cat.label}>
                      {cat.label}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {SCORE_LABELS[e[cat.id as keyof typeof e] as number]}
                    </p>
                  </div>
                ))}
              </div>
              {e.notes && (
                <div className="pt-3 border-t border-white/5">
                  <h4 className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1 flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1.5 text-primary" />
                    Notes
                  </h4>
                  <p className="text-sm text-foreground/70">{e.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
