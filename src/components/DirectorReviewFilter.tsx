"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Flag as FlagIcon } from "lucide-react";
import { formatPosition } from "@/lib/utils";
import { assignAthleteTeam } from "@/app/actions/team";

interface Evaluation {
  id: string;
  perceptionScore: number;
  adaptabilityScore: number;
  functionalSkillScore: number;
  engagementScore: number;
  teamContributionScore: number;
  learningBehaviorScore: number;
}

function evaluationAverage(e: Evaluation) {
  return (
    (e.perceptionScore +
      e.adaptabilityScore +
      e.functionalSkillScore +
      e.engagementScore +
      e.teamContributionScore +
      e.learningBehaviorScore) /
    6
  );
}

interface Tag {
  id: string;
  name: string;
}

interface Flag {
  id: string;
}

interface Team {
  id: string;
  name: string;
}

interface Athlete {
  id: string;
  name: string;
  athleteNumber: string | null;
  photoUrl: string | null;
  positionPreference: string;
  ageGroup: string;
  teamId: string | null;
  evaluations: Evaluation[];
  tags: Tag[];
  flags: Flag[];
}

export default function DirectorReviewFilter({ athletes, teams }: { athletes: Athlete[]; teams: Team[] }) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");
  const [athleteTeams, setAthleteTeams] = useState<Record<string, string | null>>(
    Object.fromEntries(athletes.map((a) => [a.id, a.teamId]))
  );

  const positions = ["All", ...Array.from(new Set(athletes.map(a => a.positionPreference)))];
  const tags = ["All", "Serving", "Serve reception", "Attacking", "Setting", "Blocking", "Floor defense", "Reading the game"];

  const handleTeamChange = async (athleteId: string, teamId: string) => {
    const previous = athleteTeams[athleteId];
    const nextTeamId = teamId === "" ? null : teamId;
    setAthleteTeams((prev) => ({ ...prev, [athleteId]: nextTeamId }));
    try {
      await assignAthleteTeam(athleteId, nextTeamId);
    } catch (err) {
      console.error(err);
      setAthleteTeams((prev) => ({ ...prev, [athleteId]: previous }));
      alert(err instanceof Error ? err.message : "Failed to assign team");
    }
  };

  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || (a.athleteNumber || "").includes(search);
    const matchesPos = posFilter === "All" || a.positionPreference === posFilter;
    const matchesTag = tagFilter === "All" || a.tags.some((t: Tag) => t.name === tagFilter);
    const currentTeamId = athleteTeams[a.id];
    const matchesTeam =
      teamFilter === "All" ||
      (teamFilter === "Unassigned" ? !currentTeamId : currentTeamId === teamFilter);
    return matchesSearch && matchesPos && matchesTag && matchesTeam;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center glass-card p-4 rounded-2xl border-white/5">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/30" />
          <input
            type="text"
            placeholder="Search # or name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-foreground/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="rounded-xl px-4 py-2 bg-background/50 ring-1 ring-inset ring-white/10 text-sm text-foreground"
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
        >
          {positions.map(p => <option key={p} value={p} className="bg-card">{p}</option>)}
        </select>

        <select
          className="rounded-xl px-4 py-2 bg-background/50 ring-1 ring-inset ring-white/10 text-sm text-foreground"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          {tags.map(t => <option key={t} value={t} className="bg-card">{t}</option>)}
        </select>

        <select
          className="rounded-xl px-4 py-2 bg-background/50 ring-1 ring-inset ring-white/10 text-sm text-foreground"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          <option value="All" className="bg-card">All Teams</option>
          <option value="Unassigned" className="bg-card">Unassigned</option>
          {teams.map(t => <option key={t.id} value={t.id} className="bg-card">{t.name}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filteredAthletes.map((athlete) => (
          <div key={athlete.id} className="glass-card rounded-2xl border-white/5 overflow-hidden hover:border-primary/20 transition-all p-3 flex items-center gap-4">
            <div className="relative h-16 w-16 bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
              {athlete.photoUrl ? (
                <img src={athlete.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-foreground/20 font-bold text-xl">
                  {athlete.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary text-white font-black text-xs px-2 py-1 rounded-md shadow-glow">
                  #{athlete.athleteNumber}
                </span>
                <h3 className="text-base font-bold text-foreground truncate">{athlete.name}</h3>
                {athlete.flags.length > 0 && (
                  <FlagIcon className="h-4 w-4 text-warning fill-current" />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-foreground/50">
                <span className="font-medium">{formatPosition(athlete.positionPreference)}</span>
                <span className="text-foreground/20">•</span>
                <span>{athlete.ageGroup}</span>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap gap-1 max-w-[200px] justify-center">
              {athlete.tags.slice(0, 3).map((t: Tag) => (
                <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary uppercase">
                  {t.name}
                </span>
              ))}
              {athlete.tags.length > 3 && (
                <span className="text-[9px] text-foreground/30 font-bold">+{athlete.tags.length - 3}</span>
              )}
            </div>

            <div className="flex gap-6 text-center px-4 border-l border-r border-white/5 flex-shrink-0">
              <div>
                <p className="text-[9px] text-foreground/40 uppercase font-bold">Evals</p>
                <p className="text-base font-black text-primary">{athlete.evaluations.length}</p>
              </div>
              <div>
                <p className="text-[9px] text-foreground/40 uppercase font-bold">Avg</p>
                <p className="text-base font-black text-success">
                  {athlete.evaluations.length > 0
                    ? (athlete.evaluations.reduce((acc: number, e: Evaluation) => acc + evaluationAverage(e), 0) / athlete.evaluations.length).toFixed(1)
                    : "-"}
                </p>
              </div>
            </div>

            <select
              className="hidden sm:block rounded-xl px-3 py-2 bg-background/50 ring-1 ring-inset ring-white/10 text-xs text-foreground flex-shrink-0 max-w-[140px]"
              value={athleteTeams[athlete.id] || ""}
              onChange={(e) => handleTeamChange(athlete.id, e.target.value)}
            >
              <option value="" className="bg-card">No team</option>
              {teams.map(t => <option key={t.id} value={t.id} className="bg-card">{t.name}</option>)}
            </select>

            <Link
              href={`/director/athletes/${athlete.id}`}
              className="px-4 py-2 text-xs font-bold text-foreground/60 bg-white/5 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
