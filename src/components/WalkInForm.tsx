"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addWalkInAthlete } from "@/app/actions/athlete";
import { compressImage } from "@/lib/image";
import { Camera } from "lucide-react";
import { POSITIONS } from "@/lib/workflow";

export default function WalkInForm({ sessionId, defaultAgeGroup, suggestedNumber }: { sessionId: string; defaultAgeGroup: string; suggestedNumber: string }) {
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      age: Number(formData.get("age")),
      ageGroup: formData.get("ageGroup") as string,
      positionPreference: formData.get("positionPreference") as string,
      athleteNumber: formData.get("athleteNumber") as string,
      photoUrl: photo || undefined,
    };

    try {
      const result = await addWalkInAthlete(sessionId, data);
      if (!result.success) { setError(result.error); return; }
      router.push(`/check-in/sessions/${sessionId}`);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Could not save the athlete. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p role="alert" className="text-warning">{error}</p>}
      <fieldset disabled={loading || processingPhoto} className="space-y-4">
      <div className="flex flex-col items-center space-y-2 mb-4">
        <div className="relative h-32 w-32 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
          {photo ? (
            <img src={photo} alt="Athlete" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-foreground/30" />
          )}
          <input
            type="file"
            aria-label="Athlete photo"
            accept="image/*"
            capture="user"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handlePhotoChange}
          />
        </div>
        <p className="text-xs text-foreground/40">Tap to take photo</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label htmlFor="walk-in-name" className="block text-sm font-medium text-foreground/80">Full Name</label>
          <input
            id="walk-in-name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
          />
        </div>
        <div>
          <label htmlFor="walk-in-age" className="block text-sm font-medium text-foreground/80">Age</label>
          <input
            id="walk-in-age"
            min={1} max={99} step={1}
            name="age"
            type="number"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
          />
        </div>
        <div>
          <label htmlFor="walk-in-number" className="block text-sm font-medium text-foreground/80">Athlete # (4 digits)</label>
          <input
            id="walk-in-number"
            inputMode="numeric" maxLength={4} defaultValue={suggestedNumber}
            name="athleteNumber"
            type="text"
            pattern="[0-9]{4}"
            placeholder="0000"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2 font-bold text-center placeholder:text-foreground/20"
          />
        </div>
        <div>
          <label htmlFor="walk-in-group" className="block text-sm font-medium text-foreground/80">Age Group</label>
          <input
            id="walk-in-group"
            defaultValue={defaultAgeGroup}
            name="ageGroup"
            type="text"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
          />
        </div>
        <div>
          <label htmlFor="walk-in-position" className="block text-sm font-medium text-foreground/80">Position</label>
          <select
            id="walk-in-position"
            name="positionPreference"
            required
            defaultValue=""
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
          ><option value="" disabled>Choose position</option>{POSITIONS.map(position => <option key={position} className="bg-card">{position}</option>)}</select>
        </div>
      </div>
      <p className="text-xs text-foreground/70">The suggested number is checked again when saving. Another staff member may assign it first.</p>
      </fieldset>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading || processingPhoto}
          className="w-full inline-flex justify-center py-3 px-4 rounded-xl shadow-glow text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {processingPhoto ? "Processing photo…" : loading ? "Adding..." : "Add & Check-in"}
        </button>
      </div>
    </form>
  );
}
