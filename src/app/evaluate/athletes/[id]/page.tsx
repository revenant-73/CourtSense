import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, EVALUATE_ROLES } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import EvaluationForm from "@/components/EvaluationForm";

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
      <div className="max-w-2xl mx-auto p-4">
        <EvaluationForm athlete={athlete} initialEvaluation={athlete.evaluations[0]} />
      </div>
    </div>
  );
}
