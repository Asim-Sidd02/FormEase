"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Inbox, Mail, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { REPORT_TYPE_LABEL } from "@/lib/admin";
import { relativeTime } from "@/lib/reminders";
import { getProcess } from "@/content/processes";
import { Badge, Button, Card, Dialog, EmptyState, Field, inputClass, Tabs } from "@/components/ui";
import { toast } from "@/components/toast";
import type { FeedbackReport } from "@/lib/types";

type F = FeedbackReport["status"] | "all";

export default function FeedbackQueue() {
  const reports = useStore((s) => s.reports);
  const update = useStore((s) => s.updateReport);
  const [filter, setFilter] = useState<F>("new");
  const [resolving, setResolving] = useState<FeedbackReport | null>(null);
  const [note, setNote] = useState("");
  const list = reports.filter((r) => filter === "all" || r.status === filter);
  const count = (s: F) => (s === "all" ? reports.length : reports.filter((r) => r.status === s).length);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">User reports</h1>
      <p className="mt-1 text-muted">Issues reported on guides, steps, fees and links.</p>
      <Tabs<F>
        className="mt-6 w-fit max-w-full"
        value={filter}
        onChange={setFilter}
        tabs={(["new", "triaged", "resolved", "dismissed", "all"] as F[]).map((s) => ({ value: s, label: <span className="capitalize">{s}</span>, count: count(s) }))}
      />
      <div className="mt-5 space-y-3">
        {list.length === 0 && <EmptyState icon={<Inbox className="size-6" />} title="Nothing here" desc="No reports with this status." />}
        {list.map((r) => {
          const p = r.processSlug ? getProcess(r.processSlug) : undefined;
          return (
            <Card key={r.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={r.status === "new" ? "warning" : r.status === "resolved" ? "success" : r.status === "triaged" ? "info" : "neutral"}>{r.status}</Badge>
                <Badge tone="neutral">{REPORT_TYPE_LABEL[r.type]}</Badge>
                {p ? (
                  <Link href={`/admin/processes/${p.slug}`} className="text-sm font-semibold text-brand hover:underline">{p.shortTitle}</Link>
                ) : (
                  <span className="text-sm font-semibold">Site-wide</span>
                )}
                <span className="text-sm text-muted">· {r.target}</span>
                <span className="ml-auto text-xs text-subtle">{relativeTime(r.createdAt)}</span>
              </div>
              <p className="mt-2.5 text-[15px]">{r.comment || <em className="text-muted">No comment provided</em>}</p>
              {r.contactOk && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
                  <Mail className="size-3.5" /> Wants an update{r.email ? ` · ${r.email}` : ""}
                </p>
              )}
              {r.resolution && <p className="mt-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success">Resolution: {r.resolution}</p>}
              {(r.status === "new" || r.status === "triaged") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.status === "new" && (
                    <Button size="sm" variant="outline" onClick={() => { update(r.id, { status: "triaged" }); toast("Marked as triaged", { tone: "info" }); }}>
                      Triage
                    </Button>
                  )}
                  <Button size="sm" onClick={() => { setResolving(r); setNote(""); }}>
                    <Check className="size-4" /> Resolve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { update(r.id, { status: "dismissed" }); toast("Dismissed", { tone: "info" }); }}>
                    <X className="size-4" /> Dismiss
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog
        open={!!resolving}
        onClose={() => setResolving(null)}
        title="Resolve report"
        description={resolving?.contactOk ? "The reporter asked to be notified — they'll receive this resolution note." : "Add an internal note on what changed."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResolving(null)}>Cancel</Button>
            <Button
              disabled={!note.trim()}
              onClick={() => {
                update(resolving!.id, { status: "resolved", resolution: note.trim() });
                toast("Report resolved", { desc: resolving!.contactOk ? "Reporter will be notified." : undefined });
                setResolving(null);
              }}
            >
              Mark resolved
            </Button>
          </>
        }
      >
        <Field label="Resolution note" htmlFor="res-note">
          <textarea id="res-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="e.g. Updated fee table after checking the official portal." />
        </Field>
      </Dialog>
    </div>
  );
}
