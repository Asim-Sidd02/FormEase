"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardCheck } from "lucide-react";
import { useAllProcesses } from "@/lib/hooks";
import { STATUS_META } from "@/lib/admin";
import { daysUntil, formatDate } from "@/lib/reminders";
import { Badge, Card, EmptyState } from "@/components/ui";
import { IconTile } from "@/components/icon";
import type { Process } from "@/lib/types";

export default function ReviewQueue() {
  const processes = useAllProcesses();
  const needsAction = processes.filter((p) => ["in_review", "review_due", "needs_update"].includes(p.status));
  const upcoming = processes
    .filter((p) => !needsAction.includes(p) && p.status !== "archived" && daysUntil(p.reviewDue) <= 60)
    .sort((a, b) => a.reviewDue.localeCompare(b.reviewDue));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Review queue</h1>
        <p className="mt-1 text-muted">Guides waiting on a reviewer, and scheduled re-checks coming up.</p>
      </div>
      <section aria-labelledby="rq-now">
        <h2 id="rq-now" className="mb-3 flex items-center gap-2 font-bold">
          <ClipboardCheck className="size-4 text-brand" /> Needs action ({needsAction.length})
        </h2>
        {needsAction.length ? (
          <div className="space-y-2">{needsAction.map((p) => <Row key={p.slug} p={p} />)}</div>
        ) : (
          <EmptyState icon={<ClipboardCheck className="size-6" />} title="All caught up" desc="No guides are waiting for review." />
        )}
      </section>
      <section aria-labelledby="rq-soon">
        <h2 id="rq-soon" className="mb-3 flex items-center gap-2 font-bold">
          <CalendarClock className="size-4 text-brand" /> Scheduled in the next 60 days ({upcoming.length})
        </h2>
        <div className="space-y-2">
          {upcoming.map((p) => <Row key={p.slug} p={p} />)}
          {!upcoming.length && <p className="text-sm text-muted">Nothing scheduled soon.</p>}
        </div>
      </section>
    </div>
  );
}

function Row({ p }: { p: Process }) {
  const d = daysUntil(p.reviewDue);
  return (
    <Link href={`/admin/processes/${p.slug}`}>
      <Card className="flex items-center gap-3 p-4 transition hover:border-brand/40 hover:shadow-lift">
        <IconTile name={p.icon} category={p.category} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.title}</p>
          <p className="text-xs text-muted">{p.owner} · last verified {formatDate(p.lastVerified)}</p>
        </div>
        <Badge tone={STATUS_META[p.status].tone}>{STATUS_META[p.status].label}</Badge>
        <Badge tone={d < 0 ? "danger" : d < 30 ? "warning" : "neutral"}>{d < 0 ? `${-d}d overdue` : `due in ${d}d`}</Badge>
        <ArrowRight className="hidden size-4 text-subtle sm:block" />
      </Card>
    </Link>
  );
}
