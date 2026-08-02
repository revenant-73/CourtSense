"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteSession } from "@/app/actions/session";

export default function DeleteSessionButton({
  sessionId,
  sessionName,
  athleteCount,
}: {
  sessionId: string;
  sessionName: string;
  athleteCount: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = confirm(
      `Delete "${sessionName}"? This permanently deletes all ${athleteCount} athlete(s) in this session, along with their evaluations, tags, and flags. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteSession(sessionId);
      router.push("/director");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete session");
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl text-sm font-medium text-warning bg-warning/10 hover:bg-warning/20 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      {deleting ? "Deleting..." : "Delete Session"}
    </button>
  );
}
