import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TeamsManager from "@/components/TeamsManager";

export default async function SessionTeamsPage({
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
        orderBy: { name: "asc" },
      },
      teams: {
        include: { athletes: { select: { id: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!tryoutSession) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <Link
        href={`/director/sessions/${id}/review`}
        className="inline-flex items-center text-sm font-bold text-foreground/60 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Review Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{tryoutSession.name}</h1>
        <p className="text-foreground/50">Team Rosters</p>
      </div>

      <TeamsManager
        sessionId={id}
        athletes={tryoutSession.athletes}
        teams={tryoutSession.teams.map((t) => ({
          id: t.id,
          name: t.name,
          memberCount: t.athletes.length,
        }))}
      />
    </div>
  );
}
