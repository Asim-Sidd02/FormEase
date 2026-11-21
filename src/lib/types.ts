/* ------------------------------------------------------------------ */
/*  FormEase content model — mirrors spec §8.1 (Process Content Model) */
/* ------------------------------------------------------------------ */

export type Answers = Record<string, string>;

/** Declarative branching logic evaluated against wizard answers. */
export type Condition =
  | { q: string; is: string | string[] }
  | { q: string; not: string | string[] }
  | { all: Condition[] }
  | { any: Condition[] };

export interface QuestionOption {
  value: string;
  label: string;
  hint?: string;
}

export interface WizardQuestion {
  id: string;
  question: string;
  /** Short helper shown under the question. */
  help?: string;
  /** "Why are we asking?" disclosure — spec §6.3. */
  why?: string;
  type: "choice" | "state";
  options?: QuestionOption[];
  showIf?: Condition;
}

export type DocKind = "required" | "optional" | "conditional";

export interface DocumentRequirement {
  id: string;
  name: string;
  kind: DocKind;
  why: string;
  /** Format / copy / original / validity guidance. */
  format?: string;
  /** Accepted alternatives ("any one of"). */
  alternatives?: string[];
  showIf?: Condition;
  /** Shown when the requirement depends on the user's answers or location. */
  conditionNote?: string;
}

export type StepMode = "online" | "offline" | "either";

export interface ProcessStep {
  id: string;
  title: string;
  summary: string;
  why: string;
  action: string;
  details?: string[];
  mode: StepMode;
  documents?: string[];
  linkIds?: string[];
  fee?: string;
  time?: string;
  warnings?: string[];
  dependsOn?: string[];
  showIf?: Condition;
}

export type LinkPurpose =
  | "apply"
  | "status"
  | "appointment"
  | "info"
  | "form"
  | "fees"
  | "grievance"
  | "locate";

/** unreachable = our checker couldn't get a verdict (timeout, TLS, bot-blocking) — needs a manual check. */
export type LinkStatus = "ok" | "redirected" | "broken" | "unreachable";

export interface OfficialLink {
  id: string;
  label: string;
  url: string;
  purpose: LinkPurpose;
  org: string;
  lastChecked: string;
  linkStatus?: LinkStatus;
}

export interface FeeItem {
  label: string;
  amount: string;
  note?: string;
  kind: "government" | "service";
}

export interface TimeItem {
  label: string;
  value: string;
  /** official = published by the authority; editorial = FormEase estimate */
  kind: "official" | "editorial";
}

export interface Source {
  title: string;
  org: string;
  url: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface StatusTerm {
  term: string;
  meaning: string;
  next: string;
}

export type ContentStatus =
  | "draft"
  | "in_review"
  | "verified"
  | "published"
  | "review_due"
  | "needs_update"
  | "archived";

export type Complexity = "Easy" | "Moderate" | "Involved";

export interface Process {
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  icon: string;
  summary: string;
  description: string;
  forWho: string[];
  situations: string[];
  prerequisites: string[];
  keywords: string[];
  complexity: Complexity;
  scope: "National" | "State-specific";
  scopeNote?: string;
  inPerson: string;
  fees: FeeItem[];
  feeNote?: string;
  times: TimeItem[];
  questions: WizardQuestion[];
  documents: DocumentRequirement[];
  steps: ProcessStep[];
  mistakes: string[];
  tips: string[];
  links: OfficialLink[];
  sources: Source[];
  faqs: FAQ[];
  statusTerms?: StatusTerm[];
  related: string[];
  lastVerified: string;
  reviewDue: string;
  status: ContentStatus;
  owner: string;
  version: string;
  limitations?: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
  live: boolean;
}

/* ------------------------------ User data ------------------------------ */

export type StepStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "pending"
  | "attention"
  | "skipped";

export type JourneyStatus = "active" | "pending" | "attention" | "completed";

export interface JourneyStepState {
  status: StepStatus;
  note: string;
  updatedAt?: string;
}

export interface ChecklistState {
  ready: boolean;
  note: string;
}

export interface CustomItem {
  id: string;
  label: string;
  ready: boolean;
  note: string;
}

export interface JourneyEvent {
  at: string;
  text: string;
}

export interface JourneyProblem {
  status: "returned" | "rejected" | "delayed" | "more_info" | "blocked";
  message: string;
  at: string;
}

export interface Journey {
  id: string;
  processSlug: string;
  title: string;
  answers: Answers;
  createdAt: string;
  updatedAt: string;
  steps: Record<string, JourneyStepState>;
  checklist: Record<string, ChecklistState>;
  customItems: CustomItem[];
  history: JourneyEvent[];
  archived: boolean;
  /** false while a guest — stored only on this device until sign-in */
  saved: boolean;
  problem?: JourneyProblem;
  contentVersion: string;
}

export type ReminderKind = "appointment" | "continue" | "expiry" | "step" | "custom";

export interface Reminder {
  id: string;
  title: string;
  kind: ReminderKind;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  journeyId?: string;
  stepId?: string;
  channel: "email" | "in_app";
  enabled: boolean;
  snoozedUntil?: string;
  createdAt: string;
}

export type ReportType =
  | "outdated"
  | "broken_link"
  | "unclear"
  | "missing_requirement"
  | "other";

export interface FeedbackReport {
  id: string;
  processSlug?: string;
  target: string;
  type: ReportType;
  comment: string;
  contactOk: boolean;
  email?: string;
  status: "new" | "triaged" | "resolved" | "dismissed";
  createdAt: string;
  resolution?: string;
}

export type Role = "user" | "author" | "reviewer" | "admin";

export interface User {
  email: string;
  name: string;
  state?: string;
  role: Role;
  createdAt: string;
  emailReminders: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
}

export interface ContentOverride {
  status?: ContentStatus;
  lastVerified?: string;
  reviewDue?: string;
  summary?: string;
  owner?: string;
  reviewer?: string;
  notes?: string;
  linkStatus?: Record<string, LinkStatus>;
  linksCheckedAt?: string;
}
