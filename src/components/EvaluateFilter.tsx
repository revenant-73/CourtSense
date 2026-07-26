"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Tag as LucideTag, Flag as LucideFlag } from "lucide-react";
import { formatPosition } from "@/lib/utils";

interface Tag {
  id: string;
}

interface Flag {
  id: string;
}

interface Evaluation {
  id: string;
}

interface Athlete {
  id: string;
  name: string;
  athleteNumber: string | null;
  photoUrl: string | null;
  positionPreference: string;
  tags: Tag[];
  flags: Flag[];
  evaluations: Evaluation[];
}

export default function EvaluateFilter({
  athletes,
}: {
  athletes: Athlete[];
  sessionId: string;
}) {
  const [search, setSearch] = useState("");

  const filteredAthletes = athletes.filter((a) =>
    (a.athleteNumber || "").includes(search) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-gray-50 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search # or name..."
            className="w-full pl-10 pr-4 py-4 border rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-lg bg-white text-gray-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredAthletes.map((athlete) => (
          <Link
            key={athlete.id}
            href={`/evaluate/athletes/${athlete.id}`}
            className="flex items-center gap-4 bg-white border rounded-2xl p-3 shadow-sm hover:border-indigo-500 transition-colors"
          >
            <div className="bg-indigo-600 text-white text-lg font-black h-12 w-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              {athlete.athleteNumber}
            </div>
            
            <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {athlete.photoUrl ? (
                <img src={athlete.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">
                  {athlete.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 truncate">
                {athlete.name}
              </p>
              <p className="text-xs text-gray-600">{formatPosition(athlete.positionPreference)}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {athlete.tags.length > 0 && (
                <LucideTag className="h-5 w-5 text-indigo-500" />
              )}
              {athlete.flags.length > 0 && (
                <LucideFlag className="h-5 w-5 text-red-500" />
              )}
              {athlete.evaluations.length > 0 && (
                <div className="h-5 w-5 bg-green-500 rounded-full border-2 border-white shadow-sm" title="Evaluated" />
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredAthletes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No checked-in athletes found.
        </div>
      )}
    </div>
  );
}
