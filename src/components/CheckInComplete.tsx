"use client";

import { useState } from "react";
import { createPortal, flushSync } from "react-dom";
import Link from "next/link";
import { formatPosition } from "@/lib/utils";

export interface LabelAthlete {
  name: string;
  athleteNumber: string | null;
  positionPreference: string;
  sessionId: string;
}

export default function CheckInComplete({ athlete, onEdit }: { athlete: LabelAthlete; onEdit?: () => void }) {
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState("");
  const [printTarget, setPrintTarget] = useState<HTMLElement | null>(null);
  const position = formatPosition(athlete.positionPreference).replace(/^M$/, "MB");

  function printLabel() {
    if (printing || !athlete.athleteNumber) return;
    setPrinting(true);
    setMessage("");
    try {
      // Mount the print-only label before opening the dialog, including in kiosk mode.
      flushSync(() => setPrintTarget(document.body));
      // Fit the actual digits to the label's available width before print preview.
      const number = document.querySelector<HTMLElement>(".tryout-print-number");
      if (number && athlete.athleteNumber) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          context.font = "900 100px Arial";
          const measuredWidth = context.measureText(athlete.athleteNumber).width;
          number.style.fontSize = `${Math.min(240, (5.6 * 96 * 100) / Math.max(measuredWidth, 1))}px`;
        }
      }
      window.print();
      setMessage("Print requested. Check the printer for your label. If you cancelled or no label came out, you can reprint.");
    } catch {
      setMessage("Could not request printing. Check the laptop's printer setup and try again. Check-in is saved.");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <section aria-label="Check-in complete" className="space-y-4">
      <h2 className="text-xl font-bold text-success">Checked in</h2>
      <p className="text-sm text-foreground/70">Check-in is saved. Print one landscape 6 × 4-inch label, then continue to the next athlete.</p>
      <div aria-label="Label preview" className="rounded-xl bg-white p-5 text-center text-black break-words">
        <p className="text-6xl font-black">{athlete.athleteNumber || "No number"}</p>
        <p className="mt-3 text-xl font-bold">{position}</p>
        <p className="mt-2 text-xl font-semibold">{athlete.name}</p>
      </div>
      <button type="button" onClick={printLabel} disabled={printing || !athlete.athleteNumber} className="w-full rounded-xl bg-primary py-4 px-4 font-bold text-white disabled:opacity-50">
        {printing ? "Requesting print…" : "Print Label"}
      </button>
      <p role="status" className="text-sm text-foreground/70">{message}</p>
      <Link href={`/check-in/sessions/${athlete.sessionId}`} className="block rounded-xl border border-white/20 py-3 text-center font-semibold">Back to Check-in List</Link>
      {onEdit && <button type="button" onClick={onEdit} className="w-full py-2 text-sm underline">Edit check-in</button>}
      {printTarget && createPortal(
        <div className="tryout-print-label" aria-hidden="true">
          <style>{`
            .tryout-print-label { display: none; }
            @page { size: 6in 4in; margin: 0; }
            @media print {
              html, body { margin: 0 !important; padding: 0 !important; width: 6in !important; height: 4in !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
              body > :not(.tryout-print-label) { display: none !important; }
              body > .tryout-print-label { display: flex !important; box-sizing: border-box; width: 6in; height: 4in; padding: .2in; flex-direction: column; justify-content: center; align-items: center; gap: .08in; color: black; background: white; font-family: Arial, Helvetica, sans-serif; text-align: center; break-inside: avoid; }
              .tryout-print-number { font-size: 180pt; font-weight: 900; line-height: .85; white-space: nowrap; }
              .tryout-print-position { font-size: 30pt; font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; }
              .tryout-print-name { font-size: ${athlete.name.length > 45 ? "18" : "24"}pt; font-weight: 700; line-height: 1.1; overflow-wrap: anywhere; max-width: 100%; }
            }
          `}</style>
          <div className="tryout-print-number">{athlete.athleteNumber}</div>
          <div className="tryout-print-position">{position}</div>
          <div className="tryout-print-name">{athlete.name}</div>
        </div>, printTarget
      )}
    </section>
  );
}
