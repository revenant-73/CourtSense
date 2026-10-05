"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTeam, deleteTeam, assignAthleteTeam, assignSelectedAthletes } from "@/app/actions/team";
import { formatPosition } from "@/lib/utils";

interface Athlete { id: string; name: string; athleteNumber: string | null; positionPreference: string; ageGroup: string; teamId: string | null }
interface Team { id: string; name: string; memberCount: number }

export default function TeamsManager({ sessionId, athletes, teams }: { sessionId: string; athletes: Athlete[]; teams: Team[] }) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const [newTeamName, setNewTeamName] = useState("");
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const roster = athletes.filter(a => a.teamId === selectedTeamId);
  const unassigned = athletes.filter(a => !a.teamId);
  const positions = [...new Set(athletes.map(a => formatPosition(a.positionPreference)))].sort();
  const visible = unassigned.filter(a => (a.name.toLowerCase().includes(search.trim().toLowerCase()) || (a.athleteNumber ?? "").includes(search.trim())) && (position === "all" || formatPosition(a.positionPreference) === position));
  const selectedIds = selected.filter(id => unassigned.some(a => a.id === id));

  async function run(action: () => Promise<unknown>, success: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const result = await action();
      if (typeof result === "object" && result !== null && "error" in result) throw new Error(String(result.error));
      setSelected([]); setMessage(success); router.refresh();
    }
    catch (error) { setError(error instanceof Error ? error.message : "Could not update the roster. Retry."); router.refresh(); }
    finally { lock.current = false; setBusy(false); }
  }

  return <div className="space-y-6">
    <form onSubmit={e => { e.preventDefault(); void run(async () => { const team = await createTeam(sessionId, newTeamName); setSelectedTeamId(team.id); setNewTeamName(""); }, "Team created."); }} className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
      <input aria-label="New team name" placeholder="New team name (e.g. 16U Red)" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} disabled={busy} className="w-full min-w-0 flex-1 px-4 py-3 bg-card rounded-xl" />
      <button disabled={busy || !newTeamName.trim()} className="px-4 py-3 bg-primary text-white rounded-xl disabled:opacity-50">Create</button>
    </form>
    {error && <p role="alert" className="text-warning">{error}</p>}
    <p role="status" className="text-sm text-foreground/80">{busy ? "Updating roster…" : message}</p>
    <div className="flex flex-wrap gap-2">
      {teams.map(team => <button key={team.id} disabled={busy} aria-pressed={selectedTeamId === team.id} onClick={() => { setSelectedTeamId(team.id); setSelected([]); }} className={`px-4 py-3 rounded-xl border ${selectedTeamId === team.id ? "bg-primary text-white" : "bg-card border-white/20"}`}>{team.name} ({athletes.filter(a => a.teamId === team.id).length})</button>)}
    </div>
    {!teams.length && <p className="text-foreground/70">No teams yet. Create one above to start building rosters.</p>}
    <div className="grid md:grid-cols-2 gap-6">
      <section className="glass-card rounded-2xl p-4 min-w-0">
        <h3 className="font-bold text-lg">{selectedTeam ? `${selectedTeam.name} Roster (${roster.length})` : "Choose a team"}</h3>
        {selectedTeam && <>
          <p className="text-sm text-foreground/80 my-3">{positions.map(pos => `${pos}: ${roster.filter(a => formatPosition(a.positionPreference) === pos).length}`).join(" · ")}</p>
          <ul className="space-y-3">{roster.map(a => <li key={a.id} className="rounded-xl bg-white/5 p-3">
            <p className="font-semibold break-words">#{a.athleteNumber ?? "?"} {a.name}</p><p className="text-sm text-foreground/80">{formatPosition(a.positionPreference)} · {a.ageGroup}</p>
            <label className="block text-sm mt-2">Move {a.name} to
              <select aria-label={`Team for ${a.name}`} value={a.teamId ?? ""} disabled={busy} onChange={e => void run(() => assignAthleteTeam(a.id, e.target.value || null), "Assignment saved.")} className="w-full mt-1 p-3 bg-card rounded-xl">
                <option value="">Unassigned</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          </li>)}</ul>
          {!roster.length && <p className="text-sm text-foreground/70">Select unassigned athletes to add to this team.</p>}
          <button disabled={busy} onClick={() => { if (confirm(`Delete "${selectedTeam.name}"? Athletes will become unassigned.`)) void run(async () => { await deleteTeam(selectedTeam.id); setSelectedTeamId(teams.find(t => t.id !== selectedTeam.id)?.id ?? ""); }, "Team deleted; athletes preserved."); }} className="mt-6 p-3 text-warning border border-warning/30 rounded-xl">Delete {selectedTeam.name}</button>
        </>}
      </section>
      <section className="glass-card rounded-2xl p-4 min-w-0">
        <h3 className="font-bold text-lg">Unassigned ({unassigned.length})</h3>
        <label className="block text-sm mt-3">Search unassigned athletes<input value={search} onChange={e => setSearch(e.target.value)} className="block w-full mt-1 p-3 rounded-xl bg-card" placeholder="Name or number" /></label>
        <label className="block text-sm mt-3">Position<select value={position} onChange={e => setPosition(e.target.value)} className="block w-full mt-1 p-3 rounded-xl bg-card"><option value="all">All positions</option>{positions.map(pos => <option key={pos}>{pos}</option>)}</select></label>
        <p className="text-sm text-foreground/70 my-3">Showing {visible.length} · {selectedIds.length} selected</p>
        <button disabled={busy || !selectedTeam || !selectedIds.length} onClick={() => void run(() => assignSelectedAthletes(sessionId, selectedIds, selectedTeamId), "Selected athletes assigned.")} className="w-full px-4 py-3 mb-4 rounded-xl bg-primary text-white disabled:opacity-50">Assign selected to {selectedTeam?.name ?? "team"}</button>
        <ul className="space-y-2">{visible.map(a => <li key={a.id}><label className="flex gap-3 items-start p-3 bg-white/5 rounded-xl">
          <input type="checkbox" disabled={busy || !selectedTeam} checked={selectedIds.includes(a.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id))} className="mt-1 h-5 w-5 shrink-0" />
          <span className="min-w-0 break-words"><span className="font-semibold">#{a.athleteNumber ?? "?"} {a.name}</span><span className="block text-sm text-foreground/80">{formatPosition(a.positionPreference)} · {a.ageGroup}</span></span>
        </label></li>)}</ul>
        {!visible.length && <p className="text-sm text-foreground/70">No unassigned athletes match these filters.</p>}
      </section>
    </div>
  </div>;
}
