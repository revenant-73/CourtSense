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
}: {
  athletes: Athlete[];
}) {
  const [search, setSearch] = useState("");

  const filteredAthletes = athletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/30" />
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-foreground/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filteredAthletes.map((athlete) => (
          <Link
            key={athlete.id}
            href={`/check-in/athletes/${athlete.id}`}
            className="flex items-center justify-between p-4 glass-card rounded-xl border-white/5 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center">
              <div className="h-10 w-12 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-foreground/50">
                {athlete.athleteNumber || "?"}
              </div>
              <div className="ml-3">
                <p className="font-semibold text-foreground">{athlete.name}</p>
                <p className="text-xs text-foreground/40">
                  {athlete.ageGroup} | {formatPosition(athlete.positionPreference)}
                </p>
              </div>
            </div>
            {athlete.checkInStatus ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <Circle className="h-6 w-6 text-foreground/20" />
            )}
          </Link>
        ))}
        {filteredAthletes.length === 0 && (
          <div className="text-center py-12 text-foreground/40">
            No athletes found matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
