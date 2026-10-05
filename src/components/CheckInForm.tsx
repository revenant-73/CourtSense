"use client";

import { useState } from "react";
import CheckInComplete, { type LabelAthlete } from "./CheckInComplete";
import { checkInAthlete } from "@/app/actions/athlete";
import AthletePhoto from "./AthletePhoto";
import { Check } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  athleteNumber: string | null;
  photoUrl: string | null;
  sessionId: string;
  positionPreference: string;
  checkInStatus: boolean;
}

export default function CheckInForm({ athlete, suggestedNumber }: { athlete: Athlete; suggestedNumber: string }) {
  const [athleteNumber, setAthleteNumber] = useState(athlete.athleteNumber || suggestedNumber);
  const [photo, setPhoto] = useState<string | null>(athlete.photoUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [savedAthlete, setSavedAthlete] = useState<LabelAthlete | null>(athlete.checkInStatus ? athlete : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || processingPhoto) return;
    if (!athleteNumber) {
      alert("Please assign an athlete number");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await checkInAthlete(athlete.id, {
        athleteNumber,
        photoUrl: photo || undefined,
      });
      if (!result.success) { setError(result.error); return; }
      setSavedAthlete(result.athlete);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not check in. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  if (savedAthlete) return <CheckInComplete athlete={savedAthlete} onEdit={() => setSavedAthlete(null)} />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p role="alert" className="text-warning">{error}</p>}
      <AthletePhoto photo={photo} disabled={loading} onPhoto={setPhoto} onBusyChange={setProcessingPhoto} />

      <div>
        <label htmlFor="check-in-number" className="block text-sm font-medium text-foreground/80">Assign Athlete Number</label>
        <p className="text-xs text-foreground/40 mb-1">4 digits: [Age Group] + [Player #] (e.g., 1601)</p>
        <input
          id="check-in-number"
          disabled={loading}
          maxLength={4}
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          required
          className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-3xl text-center font-bold py-4 text-foreground"
          value={athleteNumber}
          onChange={(e) => setAthleteNumber(e.target.value)}
          placeholder="0000"
        />
      </div>

      <button
        type="submit"
        disabled={loading || processingPhoto}
        className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-glow text-lg font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50 transition-all"
      >
        {processingPhoto ? "Finish photo first" : loading ? (
          "Checking in..."
        ) : (
          <>
            <Check className="mr-2 h-6 w-6" />
            Complete Check-in
          </>
        )}
      </button>
    </form>
  );
}
