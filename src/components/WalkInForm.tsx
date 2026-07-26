"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addWalkInAthlete } from "@/app/actions/athlete";
import { Camera } from "lucide-react";

export default function WalkInForm({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
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
        <div className="relative h-32 w-32 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
          {photo ? (
            <img src={photo} alt="Athlete" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-gray-400" />
          )}
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handlePhotoChange}
          />
        </div>
        <p className="text-xs text-gray-500">Tap to take photo</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            name="age"
            type="number"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Athlete # (4 digits)</label>
          <input
            name="athleteNumber"
            type="text"
            pattern="[0-9]{4}"
            placeholder="0000"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2 font-bold text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Age Group</label>
          <input
            name="ageGroup"
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Position</label>
          <input
            name="positionPreference"
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border p-2"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add & Check-in"}
        </button>
      </div>
    </form>
  );
}
