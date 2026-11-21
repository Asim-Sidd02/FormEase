"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, FileStack, Inbox, Link2Off } from "lucide-react";
import { useAllProcesses } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { isOverdue, REPORT_TYPE_LABEL, STATUS_META } from "@/lib/admin";
import { daysUntil, formatDate, relativeTime } from "@/lib/reminders";
import { Badge, Card } from "@/components/ui";
import { IconTile } from "@/components/icon";
import { getProcess } from "@/content/processes";
import type { ContentStatus } from "@/lib/types";

export default function AdminDashboard() {
  const processes = useAllProcesses();
  const reports = useStore((s) => s.reports);
  const audit = useStore((s) => s.audit);
  const overrides = useStore((s) => s.overrides);

  const live = processes.filter((p) => ["published", "review_due", "needs_update"].includes(p.status));
  const overdue = processes.filter((p) => isOverdue(p) && p.status !== "archived");
  const openReports = reports.filter((r) => r.status === "new" || r.status === "triaged");
  const broken = Object.values(overrides).reduce((n, o) => n + Object.values(o.linkStatus ?? {}).filter((s) => s === "broken").length, 0);
  const upcoming = [...processes].filter((p) => p.status !== "archived").sort((a, b) => a.reviewDue.localeCompare(b.reviewDue)).slice(0, 6);

  const byStatus = processes.reduce<Partial<Record<ContentStatus, number>>>((acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }), {});
  const barColor: Record<ContentStatus, string> = {
    published: "bg-success",
    verified: "bg-brand",
    in_review: "bg-info",
    review_due: "bg-warning",
    needs_update: "bg-danger",
    draft: "bg-line-strong",
    archived: "bg-surface-3",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Content health</h1>
        <p className="mt-1 text-muted">Verification status, upcoming reviews and user reports at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={<FileStack className="size-5" />} label="Live guides" value={live.length} sub={`${processes.length} total`} />
        <Stat icon={<CalendarClock className="size-5" />} label="Reviews overdue" value={overdue.length} sub="Past review date" tone={overdue.length ? "warning" : undefined} />
        <Stat icon={<Inbox className="size-5" />} label="Open reports" value={openReports.length} sub={`${reports.filter((r) => r.status === "new").length} new`} tone={openReports.length ? "info" : undefined} />
        <Stat icon={<Link2Off className="size-5" />} label="Broken links" value={broken} sub="Flagged by checks" tone={broken ? "danger" : undefined} />
      </div>

      <Card className="p-5">
        <h2 className="font-bold">Verification status</h2>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-surface-3" role="img" aria-label="Distribution of content statuses">
          {(Object.keys(byStatus) as ContentStatus[]).map((s) => (
            <div key={s} className={barColor[s]} style={{ width: `${((byStatus[s] ?? 0) / processes.length) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {(Object.keys(byStatus) as ContentStatus[]).map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${barColor[s]}`} aria-hidden />
              {STATUS_META[s].label} <strong>{byStatus[s]}</strong>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Review schedule</h2>
            <Link href="/admin/reviews" className="text-sm font-semibold text-brand hover:underline">Queue →</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map((p) => {
              const d = daysUntil(p.reviewDue);
              return (
                <li key={p.slug}>
                  <Link href={`/admin/processes/${p.slug}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                    <IconTile name={p.icon} category={p.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.title}</p>
                      <p className="text-xs text-muted">{p.owner} · due {formatDate(p.reviewDue)}</p>
                    </div>
                    <Badge tone={d < 0 ? "danger" : d < 30 ? "warning" : "neutral"}>{d < 0 ? `${-d}d overdue` : `in ${d}d`}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Latest user reports</h2>
            <Link href="/admin/feedback" className="text-sm font-semibold text-brand hover:underline">All reports →</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {reports.slice(0, 5).map((r) => (
              <li key={r.id} className="py-2.5">
                <div className="flex items-center gap-2">
                  <Badge tone={r.status === "new" ? "warning" : r.status === "resolved" ? "success" : "neutral"}>{r.status}</Badge>
                  <span className="text-xs font-semibold text-muted">{REPORT_TYPE_LABEL[r.type]}</span>
                  <span className="ml-auto text-xs text-subtle">{relativeTime(r.createdAt)}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm">{r.comment || <em className="text-muted">No comment</em>}</p>
                <p className="text-xs text-muted">{r.processSlug ? getProcess(r.processSlug)?.shortTitle : "Site"} · {r.target}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Recent activity</h2>
          <Link href="/admin/audit" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            Audit log <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="mt-3 space-y-2.5">
          {audit.slice(0, 5).map((a) => (
            <li key={a.id} className="flex items-start gap-3 text-sm">
              {/(publish|verif|resolved)/i.test(a.action) ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-subtle" />}
              <p className="flex-1">
                <strong>{a.action}</strong> <span className="text-muted">· {getProcess(a.target)?.shortTitle ?? a.target} · {a.actor}</span>
              </p>
              <span className="shrink-0 text-xs text-subtle">{relativeTime(a.at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: number; sub: string; tone?: "warning" | "info" | "danger" }) {
  const c = tone === "warning" ? "bg-warning-soft text-warning" : tone === "danger" ? "bg-danger-soft text-danger" : tone === "info" ? "bg-info-soft text-info" : "bg-brand-soft text-brand";
  return (
    <Card className="p-4">
      <span className={`grid size-10 place-items-center rounded-xl ${c}`}>{icon}</span>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted">{sub}</p>
    </Card>
  );
}
