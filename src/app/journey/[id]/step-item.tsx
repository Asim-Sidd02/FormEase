"use client";

import { useState } from "react";
import { AlertTriangle, BellPlus, Check, ChevronDown, Clock3, Hourglass, Lock, Minus, PlayCircle, Wallet, X } from "lucide-react";
import type { DocumentRequirement, Journey, OfficialLink, ProcessStep, StepStatus } from "@/lib/types";
import { STEP_STATUS_META, stepState } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { Badge, cn, inputClass } from "@/components/ui";
import { OfficialLinkCard } from "@/components/official-link";
import { MODE } from "@/lib/labels";

const STATUS_OPTIONS: { value: StepStatus; label: string; icon: typeof Check }[] = [
  { value: "not_started", label: "Not started", icon: Minus },
  { value: "in_progress", label: "In progress", icon: PlayCircle },
  { value: "pending", label: "Waiting", icon: Hourglass },
  { value: "attention", label: "Needs attention", icon: AlertTriangle },
  { value: "completed", label: "Done", icon: Check },
  { value: "skipped", label: "Skip", icon: X },
];

export function StatusDot({ status, n, size = "md" }: { status: StepStatus; n: number; size?: "md" | "lg" }) {
  const s = size === "lg" ? "size-10 text-sm" : "size-8 text-[13px]";
  const map: Record<StepStatus, string> = {
    completed: "bg-brand text-brand-fg border-brand",
    in_progress: "bg-info-soft text-info border-info",
    pending: "bg-warning-soft text-warning border-warning",
    attention: "bg-danger-soft text-danger border-danger",
    skipped: "bg-surface-2 text-subtle border-line-strong border-dashed",
    not_started: "bg-surface text-muted border-line-strong",
  };
  const I = status === "completed" ? Check : status === "pending" ? Hourglass : status === "attention" ? AlertTriangle : status === "skipped" ? X : null;
  return (
    <span className={cn("z-10 grid shrink-0 place-items-center rounded-full border-2 font-bold", s, map[status])} aria-hidden>
      {I ? <I className="size-4" strokeWidth={status === "completed" ? 3 : 2.2} /> : n}
    </span>
  );
}

export function StepItem({
  step,
  n,
  journey,
  docs,
  links,
  isNext,
  isLast,
  blockedBy,
  onReminder,
  defaultOpen,
}: {
  step: ProcessStep;
  n: number;
  journey: Journey;
  docs: DocumentRequirement[];
  links: OfficialLink[];
  isNext: boolean;
  isLast: boolean;
  blockedBy: ProcessStep[];
  onReminder: (stepId: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const setStepStatus = useStore((s) => s.setStepStatus);
  const setStepNote = useStore((s) => s.setStepNote);
  const toggleDoc = useStore((s) => s.toggleDoc);
  const status = stepState(journey, step.id);
  const meta = STEP_STATUS_META[status];
  const M = MODE[step.mode];
  const stepDocs = (step.documents ?? []).map((id) => docs.find((d) => d.id === id)).filter(Boolean) as DocumentRequirement[];
  const stepLinks = (step.linkIds ?? []).map((id) => links.find((l) => l.id === id)).filter(Boolean) as OfficialLink[];
  const note = journey.steps[step.id]?.note ?? "";
  const blocked = blockedBy.length > 0 && status !== "completed" && status !== "skipped";
  const done = status === "completed" || status === "skipped";

  return (
    <li className="relative flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center pt-4">
        <StatusDot status={status} n={n} />
        {!isLast && <span className={cn("mt-1 w-0.5 flex-1", done ? "bg-brand/50" : "bg-line")} aria-hidden />}
      </div>
      <div
        className={cn(
          "mb-3 min-w-0 flex-1 rounded-2xl border bg-surface transition",
          isNext ? "border-brand/50 shadow-lift ring-4 ring-brand/8" : "border-line shadow-soft",
        )}
      >
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 p-4 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isNext && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-fg">Next</span>}
              <h3 className={cn("font-bold", done && "text-muted")}>{step.title}</h3>
            </div>
            <p className="mt-0.5 text-sm text-muted">{step.summary}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <Badge tone="neutral" icon={<M.icon className="size-3" />}>{M.label}</Badge>
              {blocked && <Badge tone="neutral" icon={<Lock className="size-3" />}>After: {blockedBy[0].title}</Badge>}
              {note && <Badge tone="neutral">Has note</Badge>}
            </div>
          </div>
          <ChevronDown className={cn("mt-1 size-5 shrink-0 text-subtle transition-transform", open && "rotate-180")} aria-hidden />
        </button>

        {open && (
          <div className="animate-fade-in space-y-4 border-t border-line px-4 pb-4 pt-4">
            {blocked && (
              <p className="flex gap-2 rounded-xl bg-surface-2 p-3 text-sm text-muted">
                <Lock className="mt-0.5 size-4 shrink-0" /> Finish <strong className="text-fg">{blockedBy.map((b) => b.title).join(", ")}</strong> first — this step depends on it.
              </p>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-subtle">What to do</p>
              <p className="mt-1 text-[15px]">{step.action}</p>
              {step.details && (
                <ul className="mt-2 space-y-1.5 text-sm text-muted">
                  {step.details.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-subtle">Why this matters</p>
              <p className="mt-1 text-sm text-muted">{step.why}</p>
            </div>
            {(step.time || step.fee) && (
              <div className="flex flex-wrap gap-2 text-sm">
                {step.time && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5">
                    <Clock3 className="size-4 text-brand" /> {step.time} <span className="text-xs text-subtle">(estimate)</span>
                  </span>
                )}
                {step.fee && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5">
                    <Wallet className="size-4 text-brand" /> {step.fee}
                  </span>
                )}
              </div>
            )}
            {step.warnings?.map((w) => (
              <p key={w} className="flex gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> {w}
              </p>
            ))}
            {stepDocs.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-subtle">Documents for this step</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {stepDocs.map((d) => {
                    const ready = journey.checklist[d.id]?.ready;
                    return (
                      <li key={d.id}>
                        <button
                          onClick={() => toggleDoc(journey.id, d.id)}
                          aria-pressed={!!ready}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition",
                            ready ? "border-brand bg-brand-soft text-brand" : "border-line-strong hover:border-brand/40",
                          )}
                        >
                          <span className={cn("grid size-4 place-items-center rounded", ready ? "bg-brand text-brand-fg" : "border border-line-strong")}>
                            {ready && <Check className="size-3" strokeWidth={3} />}
                          </span>
                          {d.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {stepLinks.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {stepLinks.map((l) => (
                  <OfficialLinkCard key={l.id} link={l} compact />
                ))}
              </div>
            )}

            <div>
              <p id={`st-${step.id}`} className="text-xs font-bold uppercase tracking-wider text-subtle">Update status</p>
              <div role="radiogroup" aria-labelledby={`st-${step.id}`} className="mt-2 flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    role="radio"
                    aria-checked={status === o.value}
                    onClick={() => setStepStatus(journey.id, step.id, o.value, step.title)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold transition",
                      status === o.value ? "border-brand bg-brand text-brand-fg" : "border-line-strong text-muted hover:border-brand/40 hover:text-fg",
                    )}
                  >
                    <o.icon className="size-3.5" /> {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor={`note-${step.id}`} className="text-xs font-bold uppercase tracking-wider text-subtle">
                Your notes
              </label>
              <textarea
                id={`note-${step.id}`}
                defaultValue={note}
                onBlur={(e) => e.target.value !== note && setStepNote(journey.id, step.id, e.target.value)}
                rows={2}
                placeholder="e.g. Appointment at 10:30, Kendra near station. (Don't store ID numbers here.)"
                className={cn(inputClass, "mt-1.5 text-sm")}
              />
            </div>
            <button onClick={() => onReminder(step.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              <BellPlus className="size-4" /> Set a reminder for this step
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
