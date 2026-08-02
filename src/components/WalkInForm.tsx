"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addWalkInAthlete } from "@/app/actions/athlete";
import { compressImage } from "@/lib/image";
import { Camera } from "lucide-react";

export default function WalkInForm({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const router = useRouter();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setPhoto(await compressImage(file));
      } catch (err) {
        console.error(err);
        alert("Failed to process photo");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      age: parseInt(formData.get("age") as string),
      ageGroup: formData.get("ageGroup") as string,
      positionPreference: formData.get("positionPreference") as string,
      athleteNumber: formData.get("athleteNumber") as string,
      photoUrl: photo || undefined,
    };

    try {
      await addWalkInAthlete(sessionId, data);
      router.push(`/check-in/sessions/${sessionId}`);
    } catch (error) {
      console.error(error);
      alert("Failed to add athlete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center space-y-2 mb-4">
        <div className="relative h-32 w-32 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
          {photo ? (
            <img src={photo} alt="Athlete" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-foreground/30" />
          )}
          <input
            type="file"
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
          <label className="block text-sm font-medium text-foreground/60">Full Name</label>
          <input
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/60">Age</label>
          <input
            name="age"
            type="number"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/60">Athlete # (4 digits)</label>
          <input
            name="athleteNumber"
            type="text"
            pattern="[0-9]{4}"
            placeholder="0000"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2 font-bold text-center placeholder:text-foreground/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/60">Age Group</label>
          <input
            name="ageGroup"
            type="text"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/60">Position</label>
          <input
            name="positionPreference"
            type="text"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground p-2"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center py-3 px-4 rounded-xl shadow-glow text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50 transition-all"
        >
          {loading ? "Adding..." : "Add & Check-in"}
        </button>
      </div>
    </form>
  );
}
