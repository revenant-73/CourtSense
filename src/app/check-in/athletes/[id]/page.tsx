import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, CHECK_IN_ROLES } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import CheckInForm from "@/components/CheckInForm";
import { nextAthleteNumber } from "@/lib/workflow";

export default async function AthleteCheckInFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !CHECK_IN_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const athlete = await db.athlete.findUnique({
    where: { id },
    include: {
      session: true,
    },
  });

  if (!athlete) {
    notFound();
  }
  const numbers = athlete.athleteNumber ? [] : await db.athlete.findMany({ where: { sessionId: athlete.sessionId }, select: { athleteNumber: true } });

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Check-in Athlete</h1>
      <p className="text-foreground/40 mb-6">{athlete.name}</p>

      <div className="glass-card rounded-2xl border-white/5 p-6">
        <CheckInForm athlete={athlete} suggestedNumber={nextAthleteNumber(athlete.session.ageGroup, numbers.map(a => a.athleteNumber))} />
      </div>
    </div>
  );
}
