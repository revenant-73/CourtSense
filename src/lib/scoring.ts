export const SCORE_KEYS = [
  "perceptionScore", "adaptabilityScore", "functionalSkillScore",
  "engagementScore", "teamContributionScore", "learningBehaviorScore",
] as const;

export type Scores = Record<(typeof SCORE_KEYS)[number], number>;

export function observationSummary(evaluations: Scores[]) {
  const observed = evaluations.flatMap(e => SCORE_KEYS.map(key => e[key])).filter(score => score > 0);
  return {
    average: observed.length ? observed.reduce((sum, score) => sum + score, 0) / observed.length : null,
    observed: observed.length,
    possible: evaluations.length * SCORE_KEYS.length,
  };
}

export function validateScores(data: Scores) {
  for (const key of SCORE_KEYS) {
    if (!Number.isInteger(data[key]) || data[key] < 0 || data[key] > 3) {
      throw new Error("Scores must be whole numbers between 0 and 3");
    }
  }
}
