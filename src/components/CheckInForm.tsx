"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkInAthlete } from "@/app/actions/athlete";
import { Camera, Check } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  athleteNumber: string | null;
  photoUrl: string | null;
  sessionId: string;
}

export default function CheckInForm({ athlete }: { athlete: Athlete }) {
  const [athleteNumber, setAthleteNumber] = useState(athlete.athleteNumber || "");
  const [photo, setPhoto] = useState<string | null>(athlete.photoUrl || null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteNumber) {
      alert("Please assign an athlete number");
      return;
    }

    setLoading(true);
    try {
      await checkInAthlete(athlete.id, {
        athleteNumber,
        photoUrl: photo || undefined,
      });
      router.push(`/check-in/sessions/${athlete.sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-48 w-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
          {photo ? (
            <img src={photo} alt="Athlete" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-12 w-12 text-gray-500" />
          )}
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handlePhotoChange}
          />
        </div>
        <p className="text-sm text-gray-600">Tap to take or upload photo</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Assign Athlete Number</label>
        <p className="text-xs text-gray-500 mb-1">4 digits: [Age Group] + [Player #] (e.g., 1601)</p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          required
          className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-3xl text-center font-bold py-4 border"
          value={athleteNumber}
          onChange={(e) => setAthleteNumber(e.target.value)}
          placeholder="0000"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? (
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
