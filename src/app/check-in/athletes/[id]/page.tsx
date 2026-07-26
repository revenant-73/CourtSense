import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import CheckInForm from "@/components/CheckInForm";

export default async function AthleteCheckInFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
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

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Check-in Athlete</h1>
      <p className="text-gray-500 mb-6">{athlete.name}</p>
      
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <CheckInForm athlete={athlete} />
      </div>
    </div>
  );
}
