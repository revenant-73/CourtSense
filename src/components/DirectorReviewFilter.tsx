"use client";

import { useState } from "react";
import { Search, Flag as FlagIcon } from "lucide-react";
import { formatPosition } from "@/lib/utils";

interface Evaluation {
  id: string;
  adaptabilityScore: number;
}

interface Tag {
  id: string;
  name: string;
}

interface Flag {
  id: string;
}

interface Athlete {
  id: string;
  name: string;
  athleteNumber: string | null;
  photoUrl: string | null;
  positionPreference: string;
  ageGroup: string;
  evaluations: Evaluation[];
  tags: Tag[];
  flags: Flag[];
}

export default function DirectorReviewFilter({ athletes }: { athletes: Athlete[] }) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");

  const positions = ["All", ...Array.from(new Set(athletes.map(a => a.positionPreference)))];
  const tags = ["All", "Serving", "Serve reception", "Attacking", "Setting", "Blocking", "Floor defense", "Reading the game"];

  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || (a.athleteNumber || "").includes(search);
    const matchesPos = posFilter === "All" || a.positionPreference === posFilter;
    const matchesTag = tagFilter === "All" || a.tags.some((t: Tag) => t.name === tagFilter);
    return matchesSearch && matchesPos && matchesTag;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search # or name..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className="border rounded-xl px-4 py-2 bg-white text-sm"
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
        >
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select 
          className="border rounded-xl px-4 py-2 bg-white text-sm"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          {tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filteredAthletes.map((athlete) => (
          <div key={athlete.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow p-3 flex items-center gap-4">
            <div className="relative h-16 w-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              {athlete.photoUrl ? (
                <img src={athlete.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-300 font-bold text-xl">
                  {athlete.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-600 text-white font-black text-xs px-2 py-1 rounded-md">
                  #{athlete.athleteNumber}
                </span>
                <h3 className="text-base font-bold text-gray-900 truncate">{athlete.name}</h3>
                {athlete.flags.length > 0 && (
                  <FlagIcon className="h-4 w-4 text-red-500 fill-current" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">{formatPosition(athlete.positionPreference)}</span>
                <span className="text-gray-300">•</span>
                <span>{athlete.ageGroup}</span>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap gap-1 max-w-[200px] justify-center">
              {athlete.tags.slice(0, 3).map((t: Tag) => (
                <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                  {t.name}
                </span>
              ))}
              {athlete.tags.length > 3 && (
                <span className="text-[9px] text-gray-400 font-bold">+{athlete.tags.length - 3}</span>
              )}
            </div>

            <div className="flex gap-6 text-center px-4 border-l border-r border-gray-100 flex-shrink-0">
              <div>
                <p className="text-[9px] text-gray-500 uppercase font-bold">Evals</p>
                <p className="text-base font-black text-indigo-600">{athlete.evaluations.length}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase font-bold">Avg</p>
                <p className="text-base font-black text-green-600">
                  {athlete.evaluations.length > 0 
                    ? (athlete.evaluations.reduce((acc: number, e: Evaluation) => acc + e.adaptabilityScore, 0) / athlete.evaluations.length).toFixed(1)
                    : "-"}
                </p>
              </div>
            </div>

            <button className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
