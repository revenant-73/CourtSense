"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkInAthlete } from "@/app/actions/athlete";
import { compressImage } from "@/lib/image";
import { Camera, Check } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  athleteNumber: string | null;
  photoUrl: string | null;
  sessionId: string;
}

export default function CheckInForm({ athlete, suggestedNumber }: { athlete: Athlete; suggestedNumber: string }) {
  const [athleteNumber, setAthleteNumber] = useState(athlete.athleteNumber || suggestedNumber);
  const [photo, setPhoto] = useState<string | null>(athlete.photoUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const router = useRouter();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingPhoto(true);
      try {
        setPhoto(await compressImage(file));
      } catch (err) {
        console.error(err);
        setError("Could not process this photo. Try a different photo.");
      } finally {
        setProcessingPhoto(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.push(`/check-in/sessions/${athlete.sessionId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not check in. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p role="alert" className="text-warning">{error}</p>}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-48 w-48 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
          {photo ? (
            <img src={photo} alt="Athlete" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-12 w-12 text-foreground/30" />
          )}
          <input
            type="file"
            aria-label="Athlete photo"
            disabled={loading}
            accept="image/*"
            capture="user"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handlePhotoChange}
          />
        </div>
        <p className="text-sm text-foreground/40">Tap to take or upload photo</p>
      </div>

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
        {processingPhoto ? "Processing photo…" : loading ? (
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
