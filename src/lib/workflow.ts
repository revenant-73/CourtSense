import { observationSummary, type Scores } from "./scoring";

export const STANDOUT_TAGS = ["Serving", "Serve reception", "Attacking", "Setting", "Blocking", "Floor defense", "Transition", "Out-of-system play", "Reading the game", "Communication", "Athletic movement", "Ball control"];
export const POSITIONS = ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero", "Defensive Specialist"];

export function evaluationProgress(evaluations: Scores[]) {
  const { observed, possible } = observationSummary(evaluations);
  return { observed, possible, state: !observed ? (evaluations.length ? "started" : "none") : observed < possible ? "partial" : "observed" };
}

export function nextAthleteNumber(ageGroup: string, numbers: (string | null)[]) {
  const age = ageGroup.trim().match(/^(\d{1,2})\s*U$/i)?.[1];
  if (!age || Number(age) < 1) return "";
  const prefix = age.padStart(2, "0");
  const used = new Set(numbers);
  for (let player = 1; player <= 99; player++) {
    const candidate = prefix + String(player).padStart(2, "0");
    if (!used.has(candidate)) return candidate;
  }
  return "";
}
