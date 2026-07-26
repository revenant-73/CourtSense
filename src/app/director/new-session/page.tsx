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
      <h1 className="text-2xl font-bold text-foreground mb-6">Create New Tryout Session</h1>
      <form onSubmit={handleSubmit} className="glass-card rounded-[2rem] border-white/5 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/60">Session Name</label>
          <input
            name="name"
            type="text"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground text-sm py-2 px-3"
            placeholder="e.g. COURTSENSE 14U Tryouts - Day 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/60">Organization</label>
          <input
            name="organization"
            type="text"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground text-sm py-2 px-3"
            placeholder="e.g. COURTSENSE"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/60">Date</label>
          <input
            name="date"
            type="date"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground text-sm py-2 px-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/60">Age Group</label>
          <input
            name="ageGroup"
            type="text"
            required
            className="mt-1 block w-full rounded-xl bg-background/50 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-primary outline-none text-foreground text-sm py-2 px-3"
            placeholder="e.g. 14U"
          />
        </div>
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center py-2 px-4 rounded-xl shadow-glow text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50 transition-all"
          >
            {loading ? "Creating..." : "Create Session"}
          </button>
        </div>
      </form>
    </div>
  );
}
