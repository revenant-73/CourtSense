import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import AthleteListFilter from "@/components/AthleteListFilter";

export default async function SessionCheckInPage({
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
    include: {
      athletes: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!tryoutSession) {
    notFound();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tryoutSession.name}</h1>
          <p className="text-sm text-gray-500">Athlete Check-in</p>
        </div>
        <Link
          href={`/check-in/sessions/${id}/add`}
          className="p-2 bg-indigo-600 text-white rounded-full shadow-lg"
        >
          <UserPlus className="h-6 w-6" />
        </Link>
      </div>

      <AthleteListFilter athletes={tryoutSession.athletes} sessionId={id} />
    </div>
  );
}
