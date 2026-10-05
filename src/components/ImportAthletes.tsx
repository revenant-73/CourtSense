"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importAthletes } from "@/app/actions/athlete";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { validateAthleteImport } from "@/lib/athlete-import";
import { useRouter } from "next/navigation";

interface ImportData {
  name: string;
  age: string;
  ageGroup: string;
  positionPreference: string;
}

export default function ImportAthletes({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportData[] | null>(null);
  const router = useRouter();

  const confirmImport = async () => {
    if (!preview || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await importAthletes(sessionId, preview);
      if (!res.success) { setError(res.error); return; }
      setSuccess(res.count);
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import. Check your connection and review the roster before retrying.");
    } finally { setLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSuccess(null);
    setError(null);
    setPreview(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Basic validation of CSV headers
          const headers = results.meta.fields || [];
          const required = ["name", "age", "ageGroup", "positionPreference"];
          const missing = required.filter(h => !headers.includes(h));

          if (missing.length > 0) {
            throw new Error(`Missing columns: ${missing.join(", ")}`);
          }

          if (results.errors.length) throw new Error(`CSV could not be read: ${results.errors[0].message}`);
          const data = results.data as ImportData[];
          validateAthleteImport(data);
          setPreview(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to import athletes");
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError("Error parsing CSV: " + err.message);
        setLoading(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-lg cursor-pointer glass-card hover:bg-white/5 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-foreground/30" />
            <p className="mb-2 text-sm text-foreground/40">
              <span className="font-semibold text-foreground/60">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-foreground/30">CSV (name, age, ageGroup, positionPreference)</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={loading} />
        </label>
      </div>

      {loading && (
        <div className="flex items-center justify-center text-sm text-foreground/50">
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          Processing athletes...
        </div>
      )}

      {preview && (
        <div className="space-y-3 text-sm text-foreground/70">
          <p>{preview.length} athletes validated. Review before importing; nothing has been saved yet.</p>
          <ul className="max-h-60 overflow-y-auto space-y-1">
            {preview.map((row, i) => <li key={i}>{row.name} · {row.age}y · {row.ageGroup} · {row.positionPreference}</li>)}
          </ul>
          <div className="flex gap-3">
            <button disabled={loading} onClick={confirmImport} className="rounded-xl bg-primary text-white px-4 py-3 disabled:opacity-50">Confirm import</button>
            <button disabled={loading} onClick={() => setPreview(null)} className="rounded-xl bg-white/10 px-4 py-3">Cancel</button>
          </div>
        </div>
      )}

      {success !== null && (
        <div className="flex items-center p-3 text-sm text-success bg-success/10 rounded-lg">
          <CheckCircle className="mr-2 h-4 w-4" />
          Successfully imported {success} athletes!
        </div>
      )}

      {error && (
        <div className="flex items-center p-3 text-sm text-red-400 bg-red-500/10 rounded-lg">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}

      <div className="mt-4">
        <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">CSV Requirements</h4>
        <ul className="text-xs text-foreground/50 space-y-1">
          <li>• Headers: <code className="bg-white/10 px-1 rounded">name</code>, <code className="bg-white/10 px-1 rounded">age</code>, <code className="bg-white/10 px-1 rounded">ageGroup</code>, <code className="bg-white/10 px-1 rounded">positionPreference</code></li>
          <li>• Format: Plain text CSV</li>
          <li>• Repeated name + age + age group requires review. Existing roster matches are blocked.</li>
          <li>• Up to 1,000 athletes per file. All rows save together or none do.</li>
        </ul>
      </div>
    </div>
  );
}
