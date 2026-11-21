"use client";

import { useState } from "react";
import { CheckCircle2, Flag } from "lucide-react";
import type { ReportType } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Button, cn, Dialog, Field, inputClass } from "./ui";

const TYPES: { value: ReportType; label: string }[] = [
  { value: "outdated", label: "Outdated information" },
  { value: "broken_link", label: "Broken link" },
  { value: "unclear", label: "Unclear wording" },
  { value: "missing_requirement", label: "Missing requirement" },
  { value: "other", label: "Something else" },
];

export function ReportIssueButton({
  processSlug,
  target,
  targets,
  className,
  variant = "link",
}: {
  processSlug?: string;
  target?: string;
  targets?: string[];
  className?: string;
  variant?: "link" | "button";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          variant === "link"
            ? "inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-fg"
            : "inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-surface-2",
          className,
        )}
      >
        <Flag className="size-3.5" aria-hidden /> Report an issue
      </button>
      <ReportIssueDialog open={open} onClose={() => setOpen(false)} processSlug={processSlug} target={target} targets={targets} />
    </>
  );
}

export function ReportIssueDialog({
  open,
  onClose,
  processSlug,
  target,
  targets,
}: {
  open: boolean;
  onClose: () => void;
  processSlug?: string;
  target?: string;
  targets?: string[];
}) {
  const addReport = useStore((s) => s.addReport);
  const user = useStore((s) => s.user);
  const [type, setType] = useState<ReportType>("outdated");
  const [where, setWhere] = useState(target ?? targets?.[0] ?? "General");
  const [comment, setComment] = useState("");
  const [contactOk, setContactOk] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [done, setDone] = useState(false);

  const close = () => {
    onClose();
    setTimeout(() => {
      setDone(false);
      setComment("");
    }, 300);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addReport({ processSlug, target: where, type, comment: comment.trim(), contactOk, email: contactOk ? email : undefined });
    setDone(true);
  };

  return (
    <Dialog open={open} onClose={close} title={done ? "Thanks — report received" : "Report an issue"} description={done ? undefined : "Help us keep this guide accurate. Please don't include personal ID numbers."}>
      {done ? (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-7" />
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted">
            Our editorial team reviews every report. If you allowed contact, we&apos;ll let you know once it&apos;s resolved.
          </p>
          <Button className="mt-5" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">What&apos;s wrong?</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <label
                  key={t.value}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand",
                    type === t.value ? "border-brand bg-brand-soft text-brand" : "border-line-strong hover:bg-surface-2",
                  )}
                >
                  <input type="radio" name="type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="sr-only" />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          {targets && targets.length > 1 && (
            <Field label="Where?" htmlFor="ri-where">
              <select id="ri-where" value={where} onChange={(e) => setWhere(e.target.value)} className={inputClass}>
                {targets.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Details (optional)" htmlFor="ri-comment" hint="What did you see, and what did the official source say?">
            <textarea id="ri-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} maxLength={1000} />
          </Field>
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" checked={contactOk} onChange={(e) => setContactOk(e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
            <span>Tell me when this is resolved</span>
          </label>
          {contactOk && (
            <Field label="Email" htmlFor="ri-email">
              <input id="ri-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">Send report</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
