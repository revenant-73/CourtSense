-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_athleteId_evaluatorId_key" ON "Evaluation"("athleteId", "evaluatorId");
