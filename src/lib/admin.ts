import type { Condition, ContentStatus, Process, ReportType } from "./types";
import type { Tone } from "./engine";
import { answerLabel } from "./engine";

export const STATUS_META: Record<ContentStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  in_review: { label: "In review", tone: "info" },
  verified: { label: "Verified", tone: "brand" },
  published: { label: "Published", tone: "success" },
  review_due: { label: "Review due", tone: "warning" },
  needs_update: { label: "Needs update", tone: "danger" },
  archived: { label: "Archived", tone: "neutral" },
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  outdated: "Outdated",
  broken_link: "Broken link",
  unclear: "Unclear",
  missing_requirement: "Missing requirement",
  other: "Other",
};

/** Human-readable branching logic for the wizard builder view. */
export function describeCondition(c: Condition | undefined, p: Process): string {
  if (!c) return "Always";
  if ("all" in c) return c.all.map((x) => describeCondition(x, p)).join(" AND ");
  if ("any" in c) return `(${c.any.map((x) => describeCondition(x, p)).join(" OR ")})`;
  const q = p.questions.find((x) => x.id === c.q);
  const vals = ("is" in c ? c.is : c.not) as string | string[];
  const list = (Array.isArray(vals) ? vals : [vals]).map((v) => (q ? answerLabel(q, v) : v)).join(" / ");
  return `${q?.question.replace(/\?$/, "") ?? c.q} ${"is" in c ? "=" : "≠"} ${list}`;
}

export function isOverdue(p: Process, today = new Date()) {
  return new Date(`${p.reviewDue}T00:00:00`) < today;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function addMonths(iso: string, m: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
}
