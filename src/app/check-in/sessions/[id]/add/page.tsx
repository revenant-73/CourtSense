import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import WalkInForm from "@/components/WalkInForm";

export default async function AddWalkInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const tryoutSession = await db.tryoutSession.findUnique({
    where: { id },
  });

  if (!tryoutSession) {
    notFound();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Add Walk-in Athlete</h1>
      <p className="text-foreground/40 mb-6">{tryoutSession.name}</p>

      <div className="glass-card rounded-2xl border-white/5 p-6">
        <WalkInForm sessionId={id} />
      </div>
    </div>
  );
}
