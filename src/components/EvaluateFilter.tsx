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
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pb-4 pt-2">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search # or name..."
            className="w-full pl-12 pr-4 py-4 glass-card rounded-2xl shadow-xl focus:ring-2 focus:ring-primary/50 outline-none text-lg text-foreground placeholder:text-foreground/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredAthletes.map((athlete) => (
          <Link
            key={athlete.id}
            href={`/evaluate/athletes/${athlete.id}`}
            className="flex items-center gap-4 glass-card rounded-[1.5rem] p-4 group hover:border-primary/40 transition-all active:scale-[0.98]"
          >
            <div className="bg-primary text-white text-xl font-black h-14 w-14 rounded-2xl flex items-center justify-center shadow-glow flex-shrink-0 group-hover:scale-105 transition-transform">
              {athlete.athleteNumber}
            </div>
            
            <div className="h-12 w-12 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
              {athlete.photoUrl ? (
                <img src={athlete.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-foreground/20 font-black text-xl">
                  {athlete.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {athlete.name}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-0.5">{formatPosition(athlete.positionPreference)}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {athlete.tags.length > 0 && (
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <LucideTag className="h-4 w-4 text-primary" />
                </div>
              )}
              {athlete.flags.length > 0 && (
                <div className="p-1.5 bg-warning/10 rounded-lg animate-pulse">
                  <LucideFlag className="h-4 w-4 text-warning" />
                </div>
              )}
              {athlete.evaluations.length > 0 && (
                <div className="h-3 w-3 bg-success rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" title="Evaluated" />
              )}
              <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredAthletes.length === 0 && (
        <div className="text-center py-24 glass-card rounded-[2rem] border-dashed">
          <p className="text-foreground/30 font-bold uppercase tracking-widest text-xs">No checked-in athletes found</p>
        </div>
      )}
    </div>
  );
}
