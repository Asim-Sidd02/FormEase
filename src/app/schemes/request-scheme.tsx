"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button, Card, Field, inputClass } from "@/components/ui";

export function RequestScheme() {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return setError("Enter the scheme's name.");
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/schemes/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, note }) });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Could not send your request.");
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold">Can&apos;t find a scheme?</h2>
      <p className="mt-1 text-sm text-muted">Tell us which one. Our editors read the official pages and write a guide — the most-requested schemes go first.</p>
      {sent ? (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-success-soft p-3 text-sm font-medium text-success">
          <Check className="size-4" /> Thanks — we&apos;ve noted your request for “{name.trim()}”.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <Field label="Scheme name" htmlFor="rq-name" error={error}>
            <input id="rq-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputClass} placeholder="e.g. PM Surya Ghar Muft Bijli Yojana" />
          </Field>
          <Field label="What do you want to know? (optional)" htmlFor="rq-note" hint="Don't include Aadhaar, PAN, phone or application numbers.">
            <textarea id="rq-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} className={inputClass} placeholder="e.g. Can farmers in Bihar apply?" />
          </Field>
          <Button type="submit" loading={loading}>
            <Send className="size-4" /> Request this scheme
          </Button>
        </form>
      )}
    </Card>
  );
}
