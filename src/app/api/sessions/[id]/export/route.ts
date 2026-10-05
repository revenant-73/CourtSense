import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SCORE_KEYS, observationSummary } from "@/lib/scoring";
import { resultsCsv } from "@/lib/csv";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Sign in required", { status: 401 });
  if (session.user.role !== "DIRECTOR") return new Response("Director access required", { status: 403 });
  const { id } = await params;
  const tryout = await db.tryoutSession.findUnique({ where: { id }, include: {
    athletes: { orderBy: { name: "asc" }, include: {
      team: { select: { name: true } }, tags: true,
      flags: { include: { evaluator: { select: { name: true, email: true } } } },
      evaluations: { include: { evaluator: { select: { name: true, email: true } } } },
    } },
  } });
  if (!tryout) return new Response("Session not found", { status: 404 });
  const rows: unknown[][] = [["Session", "Athlete ID", "Number", "Name", "Age", "Age group", "Position", "Checked in", "Team", "Evaluation count", "Observed average", "Observed categories", "Possible observations", "Evaluator", ...SCORE_KEYS, "Notes", "Tags", "Flags"]];
  for (const athlete of tryout.athletes) {
    const summary = observationSummary(athlete.evaluations);
    for (const evaluation of athlete.evaluations.length ? athlete.evaluations : [null]) {
      rows.push([tryout.name, athlete.id, athlete.athleteNumber, athlete.name, athlete.age, athlete.ageGroup, athlete.positionPreference, athlete.checkInStatus ? "Yes" : "No", athlete.team?.name, athlete.evaluations.length, summary.average?.toFixed(2), summary.observed, summary.possible, evaluation ? evaluation.evaluator.name || evaluation.evaluator.email : "", ...SCORE_KEYS.map(key => evaluation?.[key] ?? ""), evaluation?.notes, athlete.tags.map(tag => tag.name).join("; "), athlete.flags.map(flag => `${flag.type} (${flag.evaluator.name || flag.evaluator.email})${flag.note ? ": " + flag.note : ""}`).join("; ")]);
    }
  }
  return new Response(resultsCsv(rows), { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="tryout-results-${id.replace(/[^a-zA-Z0-9_-]/g, "")}.csv"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
