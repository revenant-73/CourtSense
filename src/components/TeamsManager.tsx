"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, Users } from "lucide-react";
import { createTeam, deleteTeam, assignAthleteTeam } from "@/app/actions/team";
import { formatPosition } from "@/lib/utils";

interface Athlete {
  id: string;
  name: string;
  athleteNumber: string | null;
  positionPreference: string;
  ageGroup: string;
  teamId: string | null;
}

interface Team {
  id: string;
  name: string;
  memberCount: number;
}

export default function TeamsManager({
  sessionId,
  athletes,
  teams,
}: {
  sessionId: string;
  athletes: Athlete[];
  teams: Team[];
}) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams[0]?.id ?? null);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [athleteTeams, setAthleteTeams] = useState<Record<string, string | null>>(
    Object.fromEntries(athletes.map((a) => [a.id, a.teamId]))
  );

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || null;

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const team = await createTeam(sessionId, newTeamName.trim());
      setNewTeamName("");
      setSelectedTeamId(team.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`Delete "${team.name}"? Athletes on this team will become unassigned.`)) return;
    try {
      await deleteTeam(team.id);
      setAthleteTeams((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          if (next[id] === team.id) next[id] = null;
        }
        return next;
      });
      if (selectedTeamId === team.id) setSelectedTeamId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete team");
    }
  };

  const handleToggleAthlete = async (athleteId: string, onTeam: boolean) => {
    if (!selectedTeamId) return;
    const previous = athleteTeams[athleteId];
    const nextTeamId = onTeam ? null : selectedTeamId;
    setAthleteTeams((prev) => ({ ...prev, [athleteId]: nextTeamId }));
    try {
      await assignAthleteTeam(athleteId, nextTeamId);
    } catch (err) {
      console.error(err);
      setAthleteTeams((prev) => ({ ...prev, [athleteId]: previous }));
      alert(err instanceof Error ? err.message : "Failed to update roster");
    }
  };

  const rosterCount = selectedTeamId
    ? Object.values(athleteTeams).filter((t) => t === selectedTeamId).length
    : 0;

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreateTeam} className="glass-card rounded-2xl border-white/5 p-4 flex gap-3">
        <input
          type="text"
          placeholder="New team name (e.g. 16U Red)"
          className="flex-1 px-4 py-2 rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-foreground/30"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
        />
        <button
          type="submit"
          disabled={creating || !newTeamName.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </form>
      {error && <p className="text-sm text-warning">{error}</p>}

      {teams.length === 0 ? (
        <p className="text-sm text-foreground/30 italic glass-card rounded-2xl p-6 text-center">
          No teams yet. Create one above to start building rosters.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center">
                <button
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-l-xl text-sm font-bold transition-all border ${
                    selectedTeamId === team.id
                      ? "bg-primary text-white border-primary shadow-glow"
                      : "glass-card text-foreground/60 border-white/5 hover:border-primary/30"
                  }`}
                >
                  {team.name}
                  <span className="text-xs opacity-70">
                    {selectedTeamId === team.id ? rosterCount : team.memberCount}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteTeam(team)}
                  title={`Delete ${team.name}`}
                  className={`px-2 py-2 rounded-r-xl border border-l-0 transition-all ${
                    selectedTeamId === team.id
                      ? "bg-primary border-primary text-white/70 hover:text-white"
                      : "glass-card border-white/5 text-foreground/30 hover:text-warning"
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {selectedTeam && (
            <section>
              <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-3 flex items-center">
                <Users className="h-3 w-3 mr-2 text-primary" />
                {selectedTeam.name} Roster ({rosterCount})
              </h3>
              <div className="space-y-2">
                {athletes.map((athlete) => {
                  const onTeam = athleteTeams[athlete.id] === selectedTeamId;
                  return (
                    <button
                      key={athlete.id}
                      onClick={() => handleToggleAthlete(athlete.id, onTeam)}
                      className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all text-left ${
                        onTeam
                          ? "bg-primary/10 border-primary/30"
                          : "glass-card border-white/5 hover:border-primary/20"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                          onTeam ? "bg-primary border-primary" : "border-white/20"
                        }`}
                      >
                        {onTeam && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <span className="bg-white/5 text-foreground/60 font-black text-xs px-2 py-1 rounded-md flex-shrink-0">
                        #{athlete.athleteNumber || "?"}
                      </span>
                      <span className="flex-1 min-w-0 text-sm font-bold text-foreground truncate">
                        {athlete.name}
                      </span>
                      <span className="text-xs text-foreground/40 flex-shrink-0">
                        {formatPosition(athlete.positionPreference)} · {athlete.ageGroup}
                      </span>
                      {athleteTeams[athlete.id] && athleteTeams[athlete.id] !== selectedTeamId && (
                        <span className="text-[9px] text-warning/70 font-bold uppercase flex-shrink-0">
                          On other team
                        </span>
                      )}
                    </button>
                  );
                })}
                {athletes.length === 0 && (
                  <p className="text-sm text-foreground/30 italic glass-card rounded-2xl p-6 text-center">
                    No athletes registered in this session yet.
                  </p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
