"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, CheckCircle, Circle } from "lucide-react";
import { formatPosition } from "@/lib/utils";

interface Athlete {
  id: string;
  name: string;
  age: number;
  ageGroup: string;
  positionPreference: string;
  checkInStatus: boolean;
  athleteNumber: string | null;
}

export default function AthleteListFilter({
  athletes,
  sessionId,
}: {
  athletes: Athlete[];
  sessionId: string;
}) {
  const [search, setSearch] = useState("");

  const filteredAthletes = athletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white text-gray-900"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filteredAthletes.map((athlete) => (
          <Link
            key={athlete.id}
            href={`/check-in/athletes/${athlete.id}`}
            className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-500"
          >
            <div className="flex items-center">
              <div className="h-10 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600">
                {athlete.athleteNumber || "?"}
              </div>
              <div className="ml-3">
                <p className="font-semibold text-gray-900">{athlete.name}</p>
                <p className="text-xs text-gray-600">
                  {athlete.ageGroup} | {formatPosition(athlete.positionPreference)}
                </p>
              </div>
            </div>
            {athlete.checkInStatus ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <Circle className="h-6 w-6 text-gray-400" />
            )}
          </Link>
        ))}
        {filteredAthletes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No athletes found matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
