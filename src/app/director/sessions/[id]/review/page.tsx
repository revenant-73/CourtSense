import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import DirectorReviewFilter from "@/components/DirectorReviewFilter";

export default async function SessionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DIRECTOR") {
    redirect("/login");
  }

  const tryoutSession = await db.tryoutSession.findUnique({
    where: { id },
    include: {
      athletes: {
        include: {
          evaluations: {
            include: { evaluator: true }
          },
          tags: true,
          flags: {
            include: { evaluator: true }
          },
        },
      },
    },
  });

  if (!tryoutSession) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{tryoutSession.name}</h1>
          <p className="text-foreground/50">Director Review Dashboard</p>
        </div>
      </div>

      <DirectorReviewFilter athletes={tryoutSession.athletes} />
    </div>
  );
}
