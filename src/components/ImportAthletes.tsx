"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importAthletes } from "@/app/actions/athlete";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSuccess(null);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Basic validation of CSV headers
          const headers = results.meta.fields || [];
          const required = ["name", "age", "ageGroup", "positionPreference"];
          const missing = required.filter(h => !headers.includes(h));

          if (missing.length > 0) {
            throw new Error(`Missing columns: ${missing.join(", ")}`);
          }

          const res = await importAthletes(sessionId, results.data as ImportData[]);
          setSuccess(res.count);
        } catch (err: any) {
          setError(err.message || "Failed to import athletes");
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
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">CSV (name, age, ageGroup, positionPreference)</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={loading} />
        </label>
      </div>

      {loading && (
        <div className="flex items-center justify-center text-sm text-gray-600">
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          Importing athletes...
        </div>
      )}

      {success !== null && (
        <div className="flex items-center p-3 text-sm text-green-700 bg-green-50 rounded-lg">
          <CheckCircle className="mr-2 h-4 w-4" />
          Successfully imported {success} athletes!
        </div>
      )}

      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-lg">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}

      <div className="mt-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">CSV Requirements</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Headers: <code className="bg-gray-100 px-1 rounded">name</code>, <code className="bg-gray-100 px-1 rounded">age</code>, <code className="bg-gray-100 px-1 rounded">ageGroup</code>, <code className="bg-gray-100 px-1 rounded">positionPreference</code></li>
          <li>• Format: Plain text CSV</li>
          <li>• Duplicate Detection: Not implemented in MVP</li>
        </ul>
      </div>
    </div>
  );
}
