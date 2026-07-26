import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, EVALUATE_ROLES } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import EvaluateFilter from "@/components/EvaluateFilter";

export default async function SessionEvaluatePage({
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

  const tryoutSession = await db.tryoutSession.findUnique({
    where: { id },
    include: {
      athletes: {
        where: { checkInStatus: true },
        include: {
          evaluations: {
            where: { evaluatorId: userId }
          },
          tags: true,
          flags: true,
        },
      },
    },
  });

  if (!tryoutSession) {
    notFound();
  }

  // Sort by athlete number
  const sortedAthletes = [...tryoutSession.athletes].sort((a, b) => {
    const numA = parseInt(a.athleteNumber || "999");
    const numB = parseInt(b.athleteNumber || "999");
    return numA - numB;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{tryoutSession.name}</h1>
        <p className="text-sm text-foreground/50">Select athlete by number to evaluate</p>
      </div>

      <EvaluateFilter athletes={sortedAthletes} sessionId={id} />
    </div>
  );
}
