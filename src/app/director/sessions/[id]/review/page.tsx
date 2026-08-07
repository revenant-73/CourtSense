import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Shirt } from "lucide-react";
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
      teams: {
        orderBy: { name: "asc" },
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
        <Link
          href={`/director/sessions/${id}/teams`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-foreground/60 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Shirt className="h-4 w-4" />
          Manage Teams
        </Link>
      </div>

      <DirectorReviewFilter athletes={tryoutSession.athletes} teams={tryoutSession.teams} />
    </div>
  );
}
