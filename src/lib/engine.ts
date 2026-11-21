import type {
  Answers,
  Condition,
  DocumentRequirement,
  Journey,
  JourneyStatus,
  Process,
  ProcessStep,
  StepStatus,
  WizardQuestion,
} from "./types";

/* ------------------------------ Conditions ------------------------------ */

export function evaluate(cond: Condition | undefined, answers: Answers): boolean {
  if (!cond) return true;
  if ("all" in cond) return cond.all.every((c) => evaluate(c, answers));
  if ("any" in cond) return cond.any.some((c) => evaluate(c, answers));
  const value = answers[cond.q];
  if ("is" in cond) {
    const list = Array.isArray(cond.is) ? cond.is : [cond.is];
    return value !== undefined && list.includes(value);
  }
  const list = Array.isArray(cond.not) ? cond.not : [cond.not];
  return value === undefined || !list.includes(value);
}

/** Questions that apply given the answers so far (order preserved). */
export function visibleQuestions(process: Process, answers: Answers): WizardQuestion[] {
  return process.questions.filter((q) => evaluate(q.showIf, answers));
}

/** Drop answers to questions that are no longer visible (after an earlier answer changed). */
export function pruneAnswers(process: Process, answers: Answers): Answers {
  const out: Answers = {};
  // iterate in order so dependent questions see pruned predecessors
  for (const q of process.questions) {
    if (evaluate(q.showIf, out) && answers[q.id] !== undefined) out[q.id] = answers[q.id];
  }
  return out;
}

export function applicableSteps(process: Process, answers: Answers): ProcessStep[] {
  return process.steps.filter((s) => evaluate(s.showIf, answers));
}

export function applicableDocuments(process: Process, answers: Answers): DocumentRequirement[] {
  return process.documents.filter((d) => evaluate(d.showIf, answers));
}

export function answerLabel(q: WizardQuestion, value: string | undefined): string {
  if (!value) return "—";
  return q.options?.find((o) => o.value === value)?.label ?? value;
}

/* ------------------------------ Journeys ------------------------------ */

const DONE: StepStatus[] = ["completed", "skipped"];

export function stepState(j: Journey, stepId: string): StepStatus {
  return j.steps[stepId]?.status ?? "not_started";
}

export interface JourneyView {
  steps: ProcessStep[];
  documents: DocumentRequirement[];
  nextStep?: ProcessStep;
  progress: number;
  doneCount: number;
  docsReady: number;
  docsTotal: number;
  requiredDocsReady: number;
  requiredDocsTotal: number;
  status: JourneyStatus;
  blockedBy: (step: ProcessStep) => ProcessStep[];
}

export function buildJourneyView(process: Process, j: Journey): JourneyView {
  const steps = applicableSteps(process, j.answers);
  const documents = applicableDocuments(process, j.answers);
  const ids = new Set(steps.map((s) => s.id));

  const blockedBy = (step: ProcessStep) =>
    (step.dependsOn ?? [])
      .filter((d) => ids.has(d))
      .map((d) => steps.find((s) => s.id === d)!)
      .filter((d) => !DONE.includes(stepState(j, d.id)));

  const doneCount = steps.filter((s) => DONE.includes(stepState(j, s.id))).length;
  const attention = steps.find((s) => stepState(j, s.id) === "attention");
  const inProgress = steps.find((s) => stepState(j, s.id) === "in_progress");
  const firstOpen = steps.find(
    (s) => !DONE.includes(stepState(j, s.id)) && stepState(j, s.id) !== "pending" && blockedBy(s).length === 0,
  );
  const firstPending = steps.find((s) => stepState(j, s.id) === "pending");
  const nextStep = attention ?? inProgress ?? firstOpen ?? firstPending;

  const allDocs = documents.length + j.customItems.length;
  const docsReady =
    documents.filter((d) => j.checklist[d.id]?.ready).length + j.customItems.filter((c) => c.ready).length;
  const required = documents.filter((d) => d.kind !== "optional");

  let status: JourneyStatus = "active";
  if (doneCount === steps.length && steps.length > 0) status = "completed";
  else if (j.problem || attention) status = "attention";
  else if (!inProgress && !firstOpen && firstPending) status = "pending";

  return {
    steps,
    documents,
    nextStep,
    progress: steps.length ? Math.round((doneCount / steps.length) * 100) : 0,
    doneCount,
    docsReady,
    docsTotal: allDocs,
    requiredDocsReady: required.filter((d) => j.checklist[d.id]?.ready).length,
    requiredDocsTotal: required.length,
    status,
    blockedBy,
  };
}

/** Steps whose required documents are all ready (spec Journey C.5). */
export function stepDocsReady(step: ProcessStep, j: Journey, docs: DocumentRequirement[]): boolean {
  const relevant = (step.documents ?? []).filter((id) => docs.some((d) => d.id === id && d.kind !== "optional"));
  return relevant.every((id) => j.checklist[id]?.ready);
}

export const STEP_STATUS_META: Record<StepStatus, { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  pending: { label: "Waiting", tone: "warning" },
  attention: { label: "Needs attention", tone: "danger" },
  skipped: { label: "Skipped", tone: "neutral" },
};

export const JOURNEY_STATUS_META: Record<JourneyStatus, { label: string; tone: Tone }> = {
  active: { label: "In progress", tone: "info" },
  pending: { label: "Waiting", tone: "warning" },
  attention: { label: "Needs attention", tone: "danger" },
  completed: { label: "Completed", tone: "success" },
};

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";
