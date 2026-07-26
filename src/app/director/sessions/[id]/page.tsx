import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ImportAthletes from "@/components/ImportAthletes";
import { Calendar, Users, MapPin } from "lucide-react";
import { formatPosition } from "@/lib/utils";

export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "DIRECTOR") {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{tryoutSession.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="mr-1.5 h-4 w-4" />
            {new Date(tryoutSession.date).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <MapPin className="mr-1.5 h-4 w-4" />
            {tryoutSession.organization}
          </div>
          <div className="flex items-center">
            <Users className="mr-1.5 h-4 w-4" />
            {tryoutSession.ageGroup}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Registered Athletes</h2>
              <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                {tryoutSession.athletes.length} Total
              </span>
            </div>
            <ul className="divide-y divide-gray-200">
              {tryoutSession.athletes.map((athlete) => (
                <li key={athlete.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                        {athlete.athleteNumber || "?"}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-indigo-600">{athlete.name}</div>
                        <div className="text-xs text-gray-500">
                          {athlete.age}y | {formatPosition(athlete.positionPreference)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          athlete.checkInStatus
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {athlete.checkInStatus ? "Checked In" : "Pending"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {tryoutSession.athletes.length === 0 && (
                <li className="px-4 py-12 text-center text-gray-500 italic">
                  No athletes registered yet.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
            <Link
              href={`/director/sessions/${id}/review`}
              className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mb-4"
            >
              Go to Review Dashboard
            </Link>
            <h2 className="text-lg font-medium text-gray-900 mb-4 pt-4 border-t">Import Athletes</h2>
            <ImportAthletes sessionId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
