"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Answers,
  AuditEntry,
  ContentOverride,
  FeedbackReport,
  Journey,
  JourneyProblem,
  Process,
  Reminder,
  Role,
  StepStatus,
  User,
} from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

const now = () => new Date().toISOString();

interface State {
  user: User | null;
  journeys: Journey[];
  reminders: Reminder[];
  reports: FeedbackReport[];
  overrides: Record<string, ContentOverride>;
  audit: AuditEntry[];
  recent: string[];
  assistantContext: boolean;

  /* auth (demo) */
  signIn: (email: string, name: string) => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
  setRole: (role: Role) => void;

  /* journeys */
  createJourney: (process: Process, answers: Answers) => string;
  updateAnswers: (id: string, answers: Answers) => void;
  setStepStatus: (id: string, stepId: string, status: StepStatus, label?: string) => void;
  setStepNote: (id: string, stepId: string, note: string) => void;
  toggleDoc: (id: string, docId: string) => void;
  setDocNote: (id: string, docId: string, note: string) => void;
  addCustomItem: (id: string, label: string) => void;
  toggleCustomItem: (id: string, itemId: string) => void;
  removeCustomItem: (id: string, itemId: string) => void;
  renameJourney: (id: string, title: string) => void;
  archiveJourney: (id: string, archived: boolean) => void;
  deleteJourney: (id: string) => void;
  reportProblem: (id: string, problem: Omit<JourneyProblem, "at">) => void;
  clearProblem: (id: string) => void;

  /* reminders */
  addReminder: (r: Omit<Reminder, "id" | "createdAt" | "enabled">) => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;

  /* feedback */
  addReport: (r: Omit<FeedbackReport, "id" | "createdAt" | "status">) => void;
  updateReport: (id: string, patch: Partial<FeedbackReport>) => void;

  /* admin */
  setOverride: (slug: string, patch: ContentOverride, action: string) => void;
  log: (action: string, target: string) => void;

  /* misc */
  addRecent: (slug: string) => void;
  setAssistantContext: (on: boolean) => void;
  deleteAllData: () => void;
}

const event = (text: string) => ({ at: now(), text });

const STATUS_WORDS: Record<StepStatus, string> = {
  not_started: "not started",
  in_progress: "in progress",
  completed: "completed",
  pending: "waiting",
  attention: "needs attention",
  skipped: "skipped",
};

const seedReports: FeedbackReport[] = [
  {
    id: "r-seed1",
    processSlug: "driving-licence",
    target: "Fees",
    type: "outdated",
    comment: "The learner's licence fee shown at my RTO was different from what I expected.",
    contactOk: false,
    status: "new",
    createdAt: "2026-11-18T09:12:00.000Z",
  },
  {
    id: "r-seed2",
    processSlug: "caste-certificate",
    target: "Step: Submit application",
    type: "unclear",
    comment: "Not clear whether I need my father's certificate or my grandfather's.",
    contactOk: true,
    email: "reader@example.com",
    status: "triaged",
    createdAt: "2026-11-15T14:40:00.000Z",
  },
  {
    id: "r-seed3",
    processSlug: "passport-new",
    target: "Link: Ministry of External Affairs",
    type: "broken_link",
    comment: "Link redirected to a different page for me.",
    contactOk: false,
    status: "resolved",
    resolution: "Checked — redirect is expected. Link label clarified.",
    createdAt: "2026-11-02T08:05:00.000Z",
  },
];

const seedAudit: AuditEntry[] = [
  { id: "a1", at: "2026-11-10T10:00:00.000Z", actor: "Reviewer · R. Iyer", action: "Marked review due", target: "caste-certificate" },
  { id: "a2", at: "2026-10-28T12:30:00.000Z", actor: "Reviewer · R. Iyer", action: "Verified & published v1.4", target: "passport-new" },
  { id: "a3", at: "2026-10-20T07:45:00.000Z", actor: "Author · S. Khan", action: "Submitted for review", target: "passport-new" },
];

const touch = (j: Journey, text?: string): Journey => ({
  ...j,
  updatedAt: now(),
  history: text ? [...j.history, event(text)] : j.history,
});

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const patchJourney = (id: string, fn: (j: Journey) => Journey) =>
        set((s) => ({ journeys: s.journeys.map((j) => (j.id === id ? fn(j) : j)) }));

      return {
        user: null,
        journeys: [],
        reminders: [],
        reports: seedReports,
        overrides: {},
        audit: seedAudit,
        recent: [],
        assistantContext: true,

        signIn: (email, name) =>
          set((s) => ({
            user:
              s.user?.email === email
                ? s.user
                : { email, name: name || email.split("@")[0], role: "user", createdAt: now(), emailReminders: true },
            // guest journeys on this device become saved journeys
            journeys: s.journeys.map((j) => (j.saved ? j : touch({ ...j, saved: true }, "Saved to your account"))),
          })),
        signOut: () => {
          if (typeof window !== "undefined") void fetch("/api/auth/sign-out", { method: "POST" }).catch(() => undefined);
          set({ user: null });
        },
        updateUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
        setRole: (role) => set((s) => (s.user ? { user: { ...s.user, role } } : s)),

        createJourney: (process, answers) => {
          const id = uid();
          const j: Journey = {
            id,
            processSlug: process.slug,
            title: process.shortTitle,
            answers,
            createdAt: now(),
            updatedAt: now(),
            steps: {},
            checklist: {},
            customItems: [],
            history: [event("Journey created from your answers")],
            archived: false,
            saved: !!get().user,
            contentVersion: process.version,
          };
          set((s) => ({ journeys: [j, ...s.journeys] }));
          return id;
        },
        updateAnswers: (id, answers) => patchJourney(id, (j) => touch({ ...j, answers }, "Answers updated — roadmap rebuilt")),
        setStepStatus: (id, stepId, status, label) =>
          patchJourney(id, (j) => {
            const prev = j.steps[stepId] ?? { status: "not_started", note: "" };
            return touch(
              { ...j, steps: { ...j.steps, [stepId]: { ...prev, status, updatedAt: now() } } },
              `“${label ?? stepId}” marked ${STATUS_WORDS[status]}`,
            );
          }),
        setStepNote: (id, stepId, note) =>
          patchJourney(id, (j) => {
            const prev = j.steps[stepId] ?? { status: "not_started", note: "" };
            return touch({ ...j, steps: { ...j.steps, [stepId]: { ...prev, note } } });
          }),
        toggleDoc: (id, docId) =>
          patchJourney(id, (j) => {
            const prev = j.checklist[docId] ?? { ready: false, note: "" };
            return touch({ ...j, checklist: { ...j.checklist, [docId]: { ...prev, ready: !prev.ready } } });
          }),
        setDocNote: (id, docId, note) =>
          patchJourney(id, (j) => {
            const prev = j.checklist[docId] ?? { ready: false, note: "" };
            return touch({ ...j, checklist: { ...j.checklist, [docId]: { ...prev, note } } });
          }),
        addCustomItem: (id, label) =>
          patchJourney(id, (j) => touch({ ...j, customItems: [...j.customItems, { id: uid(), label, ready: false, note: "" }] })),
        toggleCustomItem: (id, itemId) =>
          patchJourney(id, (j) =>
            touch({ ...j, customItems: j.customItems.map((c) => (c.id === itemId ? { ...c, ready: !c.ready } : c)) }),
          ),
        removeCustomItem: (id, itemId) =>
          patchJourney(id, (j) => touch({ ...j, customItems: j.customItems.filter((c) => c.id !== itemId) })),
        renameJourney: (id, title) => patchJourney(id, (j) => touch({ ...j, title }, `Renamed to “${title}”`)),
        archiveJourney: (id, archived) =>
          patchJourney(id, (j) => touch({ ...j, archived }, archived ? "Archived" : "Restored from archive")),
        deleteJourney: (id) =>
          set((s) => ({
            journeys: s.journeys.filter((j) => j.id !== id),
            reminders: s.reminders.filter((r) => r.journeyId !== id),
          })),
        reportProblem: (id, problem) =>
          patchJourney(id, (j) => touch({ ...j, problem: { ...problem, at: now() } }, `Application marked ${problem.status.replace("_", " ")}`)),
        clearProblem: (id) => patchJourney(id, (j) => touch({ ...j, problem: undefined }, "Problem marked resolved")),

        addReminder: (r) =>
          set((s) => ({ reminders: [...s.reminders, { ...r, id: uid(), createdAt: now(), enabled: true }] })),
        updateReminder: (id, patch) =>
          set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
        deleteReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

        addReport: (r) =>
          set((s) => ({ reports: [{ ...r, id: uid(), createdAt: now(), status: "new" }, ...s.reports] })),
        updateReport: (id, patch) => {
          set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
          if (patch.status) get().log(`Report ${patch.status}`, id);
        },

        setOverride: (slug, patch, action) => {
          set((s) => ({ overrides: { ...s.overrides, [slug]: { ...s.overrides[slug], ...patch } } }));
          get().log(action, slug);
        },
        log: (action, target) =>
          set((s) => {
            const u = s.user;
            const actor = u ? `${u.role[0].toUpperCase()}${u.role.slice(1)} · ${u.name}` : "System";
            return { audit: [{ id: uid(), at: now(), actor, action, target }, ...s.audit].slice(0, 300) };
          }),

        addRecent: (slug) => set((s) => ({ recent: [slug, ...s.recent.filter((x) => x !== slug)].slice(0, 6) })),
        setAssistantContext: (on) => set({ assistantContext: on }),
        deleteAllData: () =>
          set({ user: null, journeys: [], reminders: [], recent: [], overrides: {}, reports: seedReports, audit: seedAudit }),
      };
    },
    {
      name: "formease-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
