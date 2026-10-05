import { test } from "node:test";
import assert from "node:assert/strict";
import { observationSummary, validateScores, type Scores } from "../src/lib/scoring";
import { validateAthleteImport, athleteImportKey } from "../src/lib/athlete-import";
import { csvCell, resultsCsv } from "../src/lib/csv";

const empty: Scores = { perceptionScore: 0, adaptabilityScore: 0, functionalSkillScore: 0, engagementScore: 0, teamContributionScore: 0, learningBehaviorScore: 0 };
test("unobserved scores never penalize observed results; coverage remains explicit", () => {
  assert.deepEqual(observationSummary([]), { average: null, observed: 0, possible: 0 });
  assert.deepEqual(observationSummary([empty]), { average: null, observed: 0, possible: 6 });
  assert.deepEqual(observationSummary([{ ...empty, perceptionScore: 3 }, { ...empty, adaptabilityScore: 1, engagementScore: 2 }]), { average: 2, observed: 3, possible: 12 });
});
test("scores reject out-of-range, fractional, missing and nonnumeric values", () => {
  validateScores(empty);
  for (const score of [-1, 4, 1.5, NaN, undefined, "3"]) assert.throws(() => validateScores({ ...empty, perceptionScore: score } as Scores));
});
const row = { name: " Alex Smith ", age: "16", ageGroup: "16U", positionPreference: "Setter" };
test("imports normalize rows, detect possible duplicates, and reject bad ages before writes", () => {
  const validated = validateAthleteImport([row]);
  assert.equal(validated[0].name, "Alex Smith");
  assert.equal(validated[0].age, 16);
  assert.throws(() => validateAthleteImport([row, { ...row, name: "alex smith" }]), /repeated/);
  assert.doesNotThrow(() => validateAthleteImport([row, { ...row, age: "15" }]));
  assert.equal(athleteImportKey(validated[0]), athleteImportKey({ ...validated[0], name: "ALEX SMITH" }));
  for (const age of ["16abc", "16.5", "0", "-1", "", "100"]) assert.throws(() => validateAthleteImport([{ ...row, age }]), /Row 2/);
  assert.throws(() => validateAthleteImport([]));
  assert.throws(() => validateAthleteImport(Array(1001).fill(row)));
  assert.throws(() => validateAthleteImport([{ ...row, name: " " }]));
});
test("exports preserve multiline quotes and neutralize spreadsheet formulas", () => {
  assert.equal(csvCell('hello,"world"\nnext'), '"hello,""world""\nnext"');
  for (const formula of ["=1+1", "+CMD", "-1+2", "@SUM(A1)", "  =1", "\tformula"]) assert.ok(csvCell(formula).startsWith('"\''));
  assert.equal(csvCell(null), '""');
  assert.ok(resultsCsv([["name", "notes"], ["Alex", "note"]]).startsWith('\uFEFF"name","notes"\r\n'));
});
