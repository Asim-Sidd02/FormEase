"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { publicProcesses } from "@/content/processes";
import { useStore } from "@/lib/store";
import { Button, buttonClass, Card, cn, Field, inputClass } from "@/components/ui";
import type { ReportType } from "@/lib/types";

const TYPES: { value: ReportType; label: string }[] = [
  { value: "outdated", label: "Outdated information" },
  { value: "broken_link", label: "Broken link" },
  { value: "unclear", label: "Unclear wording" },
  { value: "missing_requirement", label: "Missing requirement" },
  { value: "other", label: "Request / other" },
];

export function ReportForm({ request }: { request?: string }) {
  const addReport = useStore((s) => s.addReport);
  const user = useStore((s) => s.user);
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<ReportType>(request ? "other" : "outdated");
  const [comment, setComment] = useState(request ? `Please add a guide for: ${request}` : "");
  const [contact, setContact] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return setError("Please describe the issue so we can look into it.");
    addReport({ processSlug: slug || undefined, target: slug ? "General" : request ? "Process request" : "Site", type, comment: comment.trim(), contactOk: contact, email: contact ? email : undefined });
    setDone(true);
  };

  if (done)
    return (
      <div className="container-page max-w-xl py-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold">Thank you — we&apos;ve got it</h2>
        <p className="mt-2 text-muted">Your report is in our review queue.{contact && " We'll email you when it's resolved."}</p>
        <Link href="/" className={buttonClass("primary", "md", "mt-6")}>Back to home</Link>
      </div>
    );

  return (
    <div className="container-page max-w-2xl py-10">
      <Card className="p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Field label="Which guide is this about?" htmlFor="rf-proc">
            <select id="rf-proc" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass}>
              <option value="">Not about a specific guide</option>
              {publicProcesses.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
            </select>
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Type of issue</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <label key={t.value} className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand", type === t.value ? "border-brand bg-brand-soft text-brand" : "border-line-strong hover:bg-surface-2")}>
                  <input type="radio" name="type" className="sr-only" checked={type === t.value} onChange={() => setType(t.value)} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Details" htmlFor="rf-comment" error={error} hint="What did you see? If you can, tell us what the official source says. Please don't include ID numbers.">
            <textarea id="rf-comment" rows={5} value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} maxLength={2000} aria-invalid={!!error} />
          </Field>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={contact} onChange={(e) => setContact(e.target.checked)} className="size-4 accent-[var(--brand)]" />
            Email me when this is resolved
          </label>
          {contact && (
            <Field label="Email" htmlFor="rf-email">
              <input id="rf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
            </Field>
          )}
          <Button type="submit" size="lg" className="w-full sm:w-auto">Send report</Button>
        </form>
      </Card>
    </div>
  );
}
