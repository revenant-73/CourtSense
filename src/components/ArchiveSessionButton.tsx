"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSessionArchived } from "@/app/actions/session";

export default function ArchiveSessionButton({ sessionId, archived }: { sessionId: string; archived: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return <div>
    <button disabled={pending} className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm disabled:opacity-50" onClick={async () => {
      if (!confirm(archived ? "Reopen this session for check-in and evaluation?" : "Archive this session? Records remain available for review and export; check-in and evaluation will stop.")) return;
      setPending(true);
      setError("");
      try { await setSessionArchived(sessionId, !archived); router.refresh(); }
      catch { setError("Could not update the session. Please try again."); }
      finally { setPending(false); }
    }}>{pending ? "Updating…" : archived ? "Reopen session" : "Archive session"}</button>
    {error && <p role="alert" className="text-sm text-warning mt-2">{error}</p>}
  </div>;
}
