"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/app/actions/athlete";

export default function NewSessionPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      organization: formData.get("organization") as string,
      date: formData.get("date") as string,
      ageGroup: formData.get("ageGroup") as string,
    };

    try {
      const session = await createSession(data);
      router.push(`/director/sessions/${session.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Tryout Session</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Session Name</label>
          <input
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
            placeholder="e.g. COURTSENSE 14U Tryouts - Day 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Organization</label>
          <input
            name="organization"
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
            placeholder="e.g. COURTSENSE"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            name="date"
            type="date"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Age Group</label>
          <input
            name="ageGroup"
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
            placeholder="e.g. 14U"
          />
        </div>
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Session"}
          </button>
        </div>
      </form>
    </div>
  );
}
