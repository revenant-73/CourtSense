import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, EVALUATE_ROLES } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EvaluationForm from "@/components/EvaluationForm";
import { formatPosition } from "@/lib/utils";

export default async function AthleteEvaluatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !EVALUATE_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const userId = session.user.id;

  const athlete = await db.athlete.findUnique({
    where: { id },
    include: {
      evaluations: {
        where: { evaluatorId: userId }
      },
      tags: true,
      flags: true,
    },
  });

  if (!athlete) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-20 glass-card border-b border-white/5 px-4 py-3 flex items-center justify-between rounded-none">
        <div className="flex items-center">
          <Link
            href={`/evaluate/sessions/${athlete.sessionId}`}
            className="h-10 w-10 flex items-center justify-center mr-2 -ml-1 text-foreground/60 hover:text-primary transition-colors"
            title="Back to athlete list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-12 bg-primary text-white font-black rounded-xl flex items-center justify-center mr-3 text-lg shadow-glow">
            {athlete.athleteNumber}
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{athlete.name}</h1>
            <p className="text-xs text-foreground/40 uppercase tracking-widest">{formatPosition(athlete.positionPreference)}</p>
          </div>
        </div>
        <div className="h-12 w-12 bg-white/5 rounded-xl overflow-hidden shadow-inner">
          {athlete.photoUrl && (
            <img src={athlete.photoUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <EvaluationForm athlete={athlete} initialEvaluation={athlete.evaluations[0]} />
      </div>
    </div>
  );
}
