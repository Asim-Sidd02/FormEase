"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Ban, Check, Clock3, FileQuestion, HelpCircle, Hourglass, LifeBuoy, RotateCcw, ShieldAlert } from "lucide-react";
import type { Journey, JourneyProblem, Process } from "@/lib/types";
import { commonStatusTerms, rejectionPatterns } from "@/content/glossary";
import { applicableDocuments } from "@/lib/engine";
import { redact } from "@/lib/assistant";
import { useStore } from "@/lib/store";
import { Button, cn, Dialog, Disclosure, inputClass } from "@/components/ui";
import { OfficialLinkCard } from "@/components/official-link";
import { toast } from "@/components/toast";

const STATUSES: { value: JourneyProblem["status"] | "pending"; label: string; icon: typeof Clock3; desc: string }[] = [
  { value: "pending", label: "Still pending", icon: Hourglass, desc: "Submitted, waiting for an update" },
  { value: "delayed", label: "Taking too long", icon: Clock3, desc: "Longer than expected" },
  { value: "more_info", label: "Asked for more info", icon: FileQuestion, desc: "Office wants something extra" },
  { value: "returned", label: "Returned / objection", icon: RotateCcw, desc: "Sent back to fix something" },
  { value: "rejected", label: "Rejected", icon: Ban, desc: "Closed without approval" },
  { value: "blocked", label: "I'm stuck", icon: ShieldAlert, desc: "Can't move to the next step" },
];

export function StatusHelp({ open, onClose, process, journey }: { open: boolean; onClose: () => void; process: Process; journey: Journey }) {
  const reportProblem = useStore((s) => s.reportProblem);
  const clearProblem = useStore((s) => s.clearProblem);
  const [status, setStatus] = useState<(typeof STATUSES)[number]["value"] | "">(journey.problem?.status ?? "");
  const [message, setMessage] = useState(journey.problem?.message ?? "");
  const [analysed, setAnalysed] = useState(!!journey.problem?.message);

  const { text: clean, changed } = redact(message);
  const matches = useMemo(() => (analysed ? rejectionPatterns.filter((r) => r.match.test(clean)) : []), [analysed, clean]);
  const terms = [...(process.statusTerms ?? []), ...commonStatusTerms];
  const help = process.links.filter((l) => ["status", "grievance", "apply"].includes(l.purpose));
  const docs = applicableDocuments(process, journey.answers).filter((d) => d.kind !== "optional");
  const needsMessage = status === "returned" || status === "rejected" || status === "more_info";

  const save = () => {
    if (!status) return;
    if (status === "pending") {
      if (journey.problem) clearProblem(journey.id);
      toast("Noted — we'll keep your journey as waiting", { tone: "info" });
    } else {
      reportProblem(journey.id, { status, message: clean });
      toast("Journey marked as needing attention", { tone: "warning", desc: "Your next action has been updated." });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg" title="Application status help" description="Tell us where things stand. We'll explain what it may mean and what you can do — based only on verified information.">
      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">What&apos;s your current status?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={status === s.value}
                onClick={() => {
                  setStatus(s.value);
                  setAnalysed(false);
                }}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition",
                  status === s.value ? "border-brand bg-brand-soft/50" : "border-line hover:border-brand/40",
                )}
              >
                <s.icon className={cn("size-5", status === s.value ? "text-brand" : "text-subtle")} />
                <span className="text-sm font-bold">{s.label}</span>
                <span className="text-xs text-muted">{s.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {status && needsMessage && (
          <div className="animate-fade-in">
            <label htmlFor="sh-msg" className="text-sm font-semibold">
              Paste the reason or message you received <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="sh-msg"
              rows={3}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setAnalysed(false);
              }}
              placeholder="e.g. “Address proof not clear. Name mismatch between Aadhaar and application.”"
              className={cn(inputClass, "mt-1.5")}
            />
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <ShieldAlert className="size-3.5 text-warning" /> Remove Aadhaar, PAN, passport or application numbers before pasting.
            </p>
            {changed && <p className="mt-1 text-xs font-semibold text-warning">We&apos;ll automatically remove ID-like numbers before saving.</p>}
            <Button variant="outline" className="mt-3" onClick={() => setAnalysed(true)} disabled={!message.trim()}>
              <HelpCircle className="size-4" /> Explain this message
            </Button>
          </div>
        )}

        {analysed && (
          <div className="animate-fade-up space-y-3" aria-live="polite">
            {matches.length ? (
              <>
                <p className="text-sm">
                  This <strong>may</strong> relate to the following. Only the issuing office can confirm the exact reason.
                </p>
                {matches.map((m) => (
                  <div key={m.label} className="rounded-2xl border border-line bg-surface p-4">
                    <p className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="size-4 text-warning" /> {m.label}
                    </p>
                    <p className="mt-1 text-sm text-muted">{m.explain}</p>
                    <ul className="mt-2.5 space-y-1.5 text-sm">
                      {m.fix.map((f) => (
                        <li key={f} className="flex gap-2">
                          <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            ) : (
              <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">
                We couldn&apos;t match this message to a common reason. Contact the issuing office using the official links below and ask what exactly needs to change.
              </p>
            )}
          </div>
        )}

        {(status === "returned" || status === "rejected" || status === "more_info") && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 font-bold">
              <RotateCcw className="size-4 text-brand" /> Prepare for resubmission
            </p>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              {docs.map((d) => (
                <li key={d.id} className="flex gap-2">
                  <Check className={cn("mt-0.5 size-4 shrink-0", journey.checklist[d.id]?.ready ? "text-brand" : "text-line-strong")} />
                  <span>
                    {d.name} <span className="text-muted">— check it&apos;s current, clear and matches your form</span>
                  </span>
                </li>
              ))}
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-line-strong" /> Name, date of birth and address written identically everywhere
              </li>
            </ul>
          </div>
        )}

        {help.length > 0 && status && (
          <div>
            <p className="mb-2 text-sm font-semibold">Official tracking & grievance routes</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {help.map((l) => (
                <OfficialLinkCard key={l.id} link={l} compact />
              ))}
            </div>
          </div>
        )}

        <Disclosure summary={<span className="flex items-center gap-2"><LifeBuoy className="size-4 text-brand" /> What do common status messages mean?</span>}>
          <dl className="space-y-3">
            {terms.map((t) => (
              <div key={t.term}>
                <dt className="font-semibold text-fg">{t.term}</dt>
                <dd className="mt-0.5">{t.meaning} <span className="text-fg">Next: </span>{t.next}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          {journey.problem && (
            <Button
              variant="ghost"
              onClick={() => {
                clearProblem(journey.id);
                toast("Marked as resolved");
                onClose();
              }}
            >
              Problem resolved
            </Button>
          )}
          <Button onClick={save} disabled={!status}>
            {status === "pending" || !status ? "Save status" : "Mark as needs attention"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
