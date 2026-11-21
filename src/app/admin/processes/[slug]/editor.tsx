"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarPlus,
  Check,
  CircleSlash,
  ExternalLink,
  Eye,
  GitBranch,
  Link2,
  Loader2,
  RotateCcw,
  Send,
  ShieldAlert,
  Archive,
} from "lucide-react";
import { useProcess } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { addMonths, describeCondition, isOverdue, STATUS_META, todayISO } from "@/lib/admin";
import { formatDate, relativeTime } from "@/lib/reminders";
import { DOC_KIND, MODE } from "@/lib/labels";
import { Badge, Button, buttonClass, Card, cn, Field, inputClass, Tabs } from "@/components/ui";
import { IconTile } from "@/components/icon";
import { toast } from "@/components/toast";
import { ROLE_CAN } from "../../admin-shell";
import type { ContentStatus, LinkStatus } from "@/lib/types";

type Tab = "overview" | "wizard" | "steps" | "documents" | "sources" | "history";

export function ProcessEditor({ slug }: { slug: string }) {
  const p = useProcess(slug)!;
  const user = useStore((s) => s.user)!;
  const override = useStore((s) => s.overrides[slug]);
  const setOverride = useStore((s) => s.setOverride);
  const audit = useStore((s) => s.audit);
  const reports = useStore((s) => s.reports);
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState(p.summary);
  const [owner, setOwner] = useState(p.owner);
  const [reviewDue, setReviewDue] = useState(p.reviewDue);
  const [checking, setChecking] = useState(false);

  const canEdit = ROLE_CAN.edit(user.role);
  const canReview = ROLE_CAN.review(user.role);
  const history = audit.filter((a) => a.target === slug);
  const openReports = reports.filter((r) => r.processSlug === slug && (r.status === "new" || r.status === "triaged"));
  const dirty = summary !== p.summary || owner !== p.owner || reviewDue !== p.reviewDue;

  const transition = (status: ContentStatus, action: string, extra: Record<string, string> = {}) => {
    setOverride(slug, { status, ...extra }, action);
    toast(action, { tone: "info" });
  };

  const checkLinks = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/link-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      if (!res.ok) throw new Error();
      const data: { checkedAt: string; results: { id: string; status: LinkStatus; code: number }[] } = await res.json();
      const bad = data.results.filter((r) => r.status !== "ok");
      const unreachable = data.results.filter((r) => r.status === "unreachable").length;
      setOverride(slug, { linkStatus: Object.fromEntries(data.results.map((r) => [r.id, r.status])), linksCheckedAt: data.checkedAt }, `Ran link check (${bad.length} flagged)`);
      toast("Link check complete", { tone: bad.length ? "warning" : "success", desc: bad.length ? `${bad.length} of ${data.results.length} links need a look${unreachable ? ` (${unreachable} couldn't be reached automatically — open them manually)` : ""}.` : `All ${data.results.length} links responded OK.` });
    } catch {
      toast("Link check failed", { tone: "warning", desc: "Couldn't reach the checker. Try again." });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <Link href="/admin/processes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> All processes
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        <IconTile name={p.icon} category={p.category} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">{p.title}</h1>
            <Badge tone={STATUS_META[p.status].tone}>{STATUS_META[p.status].label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            v{p.version} · {p.owner} · verified {formatDate(p.lastVerified)} · review {isOverdue(p) ? <strong className="text-danger">overdue ({formatDate(p.reviewDue)})</strong> : `due ${formatDate(p.reviewDue)}`}
          </p>
        </div>
        <Link href={`/process/${p.slug}`} target="_blank" className={buttonClass("outline", "sm")}>
          <Eye className="size-4" /> Preview
        </Link>
      </div>

      {/* Workflow bar */}
      <Card className="mt-5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-subtle">Verification workflow</p>
        <ol className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {(["draft", "in_review", "verified", "published"] as ContentStatus[]).map((s, i, arr) => {
            const order = arr.indexOf(p.status);
            const done = order >= i || (p.status === "review_due" || p.status === "needs_update" ? i <= 3 : false);
            return (
              <li key={s} className="flex items-center gap-1.5">
                <span className={cn("rounded-full px-2.5 py-1", p.status === s ? "bg-brand text-brand-fg" : done ? "bg-brand-soft text-brand" : "bg-surface-2 text-subtle")}>{STATUS_META[s].label}</span>
                {i < arr.length - 1 && <span className="h-px w-4 bg-line-strong" aria-hidden />}
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {canEdit && (p.status === "draft" || p.status === "needs_update" || p.status === "review_due") && (
            <Button size="sm" onClick={() => transition("in_review", "Submitted for review")}>
              <Send className="size-4" /> Submit for review
            </Button>
          )}
          {canReview && p.status === "in_review" && (
            <>
              <Button size="sm" onClick={() => transition("published", `Verified & published v${p.version}`, { lastVerified: todayISO(), reviewDue: addMonths(todayISO(), 3) })}>
                <BadgeCheck className="size-4" /> Approve & publish
              </Button>
              <Button size="sm" variant="outline" onClick={() => transition("draft", "Requested changes")}>
                <RotateCcw className="size-4" /> Request changes
              </Button>
            </>
          )}
          {canReview && (p.status === "published" || p.status === "review_due") && (
            <Button size="sm" variant="outline" onClick={() => transition("published", "Re-verified — no changes", { lastVerified: todayISO(), reviewDue: addMonths(todayISO(), 3) })}>
              <Check className="size-4" /> Mark re-verified today
            </Button>
          )}
          {canReview && p.status !== "needs_update" && p.status !== "archived" && (
            <Button size="sm" variant="outline" onClick={() => transition("needs_update", "Marked needs update")}>
              <ShieldAlert className="size-4" /> Mark needs update
            </Button>
          )}
          {user.role === "admin" && p.status !== "archived" && (
            <Button size="sm" variant="ghost" onClick={() => transition("archived", "Archived (temporarily unavailable)")}>
              <Archive className="size-4" /> Take offline
            </Button>
          )}
          {user.role === "admin" && p.status === "archived" && (
            <Button size="sm" variant="outline" onClick={() => transition("draft", "Restored to draft")}>
              <RotateCcw className="size-4" /> Restore to draft
            </Button>
          )}
        </div>
        {!canEdit && !canReview && <p className="mt-2 text-xs text-muted">Your role can view content but not change it.</p>}
        {openReports.length > 0 && (
          <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
            {openReports.length} open user report{openReports.length > 1 ? "s" : ""} on this guide — <Link href="/admin/feedback" className="font-semibold underline">review</Link>
          </p>
        )}
      </Card>

      <Tabs<Tab>
        className="mt-6 w-fit max-w-full"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "wizard", label: "Wizard", count: p.questions.length },
          { value: "steps", label: "Steps", count: p.steps.length },
          { value: "documents", label: "Documents", count: p.documents.length },
          { value: "sources", label: "Sources & links", count: p.links.length },
          { value: "history", label: "History", count: history.length },
        ]}
      />

      <div className="mt-5 animate-fade-in">
        {tab === "overview" && (
          <Card className="space-y-5 p-5">
            <Field label="Public summary" htmlFor="ed-summary" hint="Shown on cards and at the top of the guide. Plain language, one or two sentences.">
              <textarea id="ed-summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} className={inputClass} disabled={!canEdit} maxLength={280} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Content owner" htmlFor="ed-owner">
                <input id="ed-owner" value={owner} onChange={(e) => setOwner(e.target.value)} className={inputClass} disabled={!canEdit} />
              </Field>
              <Field label="Next review date" htmlFor="ed-review" hint="Reviewers set this when verifying.">
                <input id="ed-review" type="date" value={reviewDue} onChange={(e) => setReviewDue(e.target.value)} className={inputClass} disabled={!canReview} />
              </Field>
            </div>
            <dl className="grid gap-4 rounded-xl bg-surface-2/60 p-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-muted">Scope</dt><dd className="font-semibold">{p.scope}</dd></div>
              <div><dt className="text-xs text-muted">Complexity</dt><dd className="font-semibold">{p.complexity}</dd></div>
              <div><dt className="text-xs text-muted">Related</dt><dd className="font-semibold">{p.related.length} guides</dd></div>
            </dl>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={!dirty}
                onClick={() => {
                  setOverride(slug, { summary, owner, reviewDue }, reviewDue !== p.reviewDue ? `Scheduled review for ${formatDate(reviewDue)}` : "Edited overview");
                  toast("Changes saved", { desc: canReview ? undefined : "A reviewer must approve before they go live." });
                }}
              >
                Save changes
              </Button>
              {canReview && (
                <Button variant="outline" onClick={() => { const d = addMonths(todayISO(), 3); setReviewDue(d); }}>
                  <CalendarPlus className="size-4" /> Review in 3 months
                </Button>
              )}
              {dirty && <span className="text-xs text-warning">Unsaved changes</span>}
            </div>
          </Card>
        )}

        {tab === "wizard" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Questions and their branching logic. Only questions whose condition is met are shown to the user.</p>
            {p.questions.map((q, i) => (
              <Card key={q.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{i + 1}</span>
                  <p className="font-semibold">{q.question}</p>
                  <Badge tone="neutral">{q.type === "state" ? "State picker" : "Single choice"}</Badge>
                  <code className="rounded bg-surface-2 px-1.5 text-xs text-muted">{q.id}</code>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-info">
                  <GitBranch className="mt-0.5 size-3.5 shrink-0" /> Show when: {describeCondition(q.showIf, p)}
                </p>
                {q.options && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {q.options.map((o) => <span key={o.value} className="rounded-lg border border-line px-2 py-1 text-xs">{o.label}</span>)}
                  </div>
                )}
                {q.why && <p className="mt-2 text-xs text-muted"><strong>Why asked:</strong> {q.why}</p>}
              </Card>
            ))}
            <Link href={`/process/${p.slug}/start`} target="_blank" className={buttonClass("outline", "sm")}>
              <Eye className="size-4" /> Test the wizard
            </Link>
          </div>
        )}

        {tab === "steps" && (
          <div className="space-y-3">
            {p.steps.map((s, i) => {
              const M = MODE[s.mode];
              return (
                <Card key={s.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-brand text-xs font-bold text-brand-fg">{i + 1}</span>
                    <p className="font-semibold">{s.title}</p>
                    <Badge tone="neutral" icon={<M.icon className="size-3" />}>{M.label}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{s.action}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span><GitBranch className="mr-1 inline size-3.5" />Applies: {describeCondition(s.showIf, p)}</span>
                    {s.dependsOn?.length ? <span>Depends on: {s.dependsOn.join(", ")}</span> : null}
                    {s.documents?.length ? <span>Docs: {s.documents.length}</span> : null}
                    {s.linkIds?.length ? <span>Links: {s.linkIds.join(", ")}</span> : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "documents" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-line bg-surface-2/60 text-left text-xs uppercase tracking-wider text-subtle">
                  <tr>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Condition</th>
                    <th className="px-4 py-3">Alternatives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {p.documents.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 font-semibold">{d.name}</td>
                      <td className="px-4 py-3"><Badge tone={DOC_KIND[d.kind].tone}>{d.kind}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted">{describeCondition(d.showIf, p)}</td>
                      <td className="px-4 py-3 text-muted">{d.alternatives?.length ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "sources" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">Official links shown to users, with last-checked status.</p>
              <Button size="sm" variant="outline" onClick={checkLinks} disabled={checking}>
                {checking ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} {checking ? "Checking…" : "Run link check"}
              </Button>
            </div>
            {p.links.map((l) => {
              const st = override?.linkStatus?.[l.id] ?? l.linkStatus ?? "ok";
              return (
                <Card key={l.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{l.label} <span className="text-xs font-normal text-muted">· {l.purpose} · {l.org}</span></p>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-xs text-brand hover:underline">
                      {l.url} <ExternalLink className="size-3" />
                    </a>
                    <p className="text-xs text-subtle">Last checked {override?.linksCheckedAt ? relativeTime(override.linksCheckedAt) : formatDate(l.lastChecked)}</p>
                  </div>
                  <div className="flex gap-1" role="radiogroup" aria-label={`Status for ${l.label}`}>
                    {(["ok", "redirected", "unreachable", "broken"] as const).map((s) => (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={st === s}
                        disabled={!canEdit && !canReview}
                        onClick={() => setOverride(slug, { linkStatus: { ...override?.linkStatus, [l.id]: s } }, `Link “${l.label}” marked ${s}`)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize transition",
                          st === s ? (s === "ok" ? "border-success bg-success-soft text-success" : s === "broken" ? "border-danger bg-danger-soft text-danger" : "border-warning bg-warning-soft text-warning") : "border-line text-muted hover:bg-surface-2",
                        )}
                      >
                        {s === "ok" ? <Check className="mr-1 inline size-3" /> : s === "broken" ? <CircleSlash className="mr-1 inline size-3" /> : null}
                        {s}
                      </button>
                    ))}
                  </div>
                </Card>
              );
            })}
            <Card className="p-4">
              <p className="font-semibold">Source documents</p>
              <ul className="mt-2 space-y-1 text-sm">
                {p.sources.map((s) => (
                  <li key={s.url + s.title}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{s.title}</a> <span className="text-muted">— {s.org}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {tab === "history" && (
          <Card className="p-5">
            {history.length ? (
              <ol className="relative space-y-4 border-l border-line pl-5">
                {history.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-brand" aria-hidden />
                    <p className="text-sm font-semibold">{a.action}</p>
                    <p className="text-xs text-muted">{a.actor} · {relativeTime(a.at)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">No recorded changes yet.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
