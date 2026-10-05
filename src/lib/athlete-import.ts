export interface ImportAthlete {
  name: string;
  age: string;
  ageGroup: string;
  positionPreference: string;
}

export function athleteImportKey(athlete: { name: string; age: number; ageGroup: string }) {
  return JSON.stringify([athlete.name.trim().toLowerCase(), athlete.age, athlete.ageGroup.trim().toLowerCase()]);
}

export function validateAthleteImport(rows: ImportAthlete[]) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 1000) {
    throw new Error("Choose a CSV containing 1–1,000 athletes");
  }
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const name = typeof row?.name === "string" ? row.name.trim() : "";
    const ageGroup = typeof row?.ageGroup === "string" ? row.ageGroup.trim() : "";
    const positionPreference = typeof row?.positionPreference === "string" ? row.positionPreference.trim() : "";
    const ageText = typeof row?.age === "string" ? row.age.trim() : "";
    const age = /^\d{1,2}$/.test(ageText) ? Number(ageText) : NaN;
    if (!name || name.length > 150 || !ageGroup || ageGroup.length > 50 || !positionPreference || positionPreference.length > 100 || !Number.isInteger(age) || age < 1 || age > 99) {
      throw new Error(`Row ${index + 2}: provide a name, whole-number age (1–99), age group, and position`);
    }
    const athlete = { name, age, ageGroup, positionPreference };
    const key = athleteImportKey(athlete);
    if (seen.has(key)) throw new Error(`Row ${index + 2}: repeated name, age, and age group (${name}). Review this possible duplicate before importing.`);
    seen.add(key);
    return athlete;
  });
}
