"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CircleSlash,
  Clock3,
  FileDown,
  FileText,
  Globe,
  Loader2,
  MapPinned,
  MonitorSmartphone,
  Quote,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useOfficialData, hostOf } from "@/lib/sources/client";
import type { ExtractedFact, FactType, SourceSnapshot, SyncStatus } from "@/lib/sources/types";
import { relativeTime, formatDate } from "@/lib/reminders";
import { Badge, Button, cn, Disclosure, Skeleton, Tabs } from "./ui";
import type { Tone } from "@/lib/engine";

export const SYNC_META: Record<SyncStatus, { label: string; tone: Tone; icon: typeof BadgeCheck }> = {
  ok: { label: "Matches our review", tone: "success", icon: BadgeCheck },
  changed: { label: "Changed since our review", tone: "warning", icon: AlertTriangle },
  unreachable: { label: "Couldn't reach", tone: "neutral", icon: CircleSlash },
  needs_browser: { label: "App-only portal", tone: "neutral", icon: MonitorSmartphone },
  error: { label: "No readable text", tone: "neutral", icon: CircleSlash },
};

type Tab = "fees" | "documents" | "time" | "forms" | "text";
const TAB_FOR: Record<FactType, Tab> = { fee: "fees", document: "documents", time: "time", form: "forms" };

interface FactWithSource extends ExtractedFact {
  source: SourceSnapshot;
}

export function OfficialLive({ slug, scope, compact }: { slug: string; scope: "National" | "State-specific"; compact?: boolean }) {
  const { data, loading, refreshing, error, refresh } = useOfficialData(slug);
  const [tab, setTab] = useState<Tab>("fees");

  const sources = data?.sources ?? [];
  const usable = sources.filter((s) => s.fetchedAt && s.sections.length + s.facts.length > 0);
  const changed = sources.filter((s) => s.status === "changed");
  const lastFetched = usable.map((s) => s.fetchedAt!).sort().at(-1);

  const facts = useMemo(() => {
    const out: Record<Tab, FactWithSource[]> = { fees: [], documents: [], time: [], forms: [], text: [] };
    for (const s of usable) for (const f of s.facts) out[TAB_FOR[f.type]].push({ ...f, source: s });
    return out;
  }, [usable]);

  const tabs = (
    [
      { value: "fees", label: <><Wallet className="size-4" /> Fees</>, count: facts.fees.length },
      { value: "documents", label: <><FileText className="size-4" /> Documents</>, count: facts.documents.length },
      { value: "time", label: <><Clock3 className="size-4" /> Time limits</>, count: facts.time.length },
      { value: "forms", label: <><FileDown className="size-4" /> Forms</>, count: facts.forms.length },
      { value: "text", label: <><Quote className="size-4" /> Official text</>, count: usable.reduce((n, s) => n + s.sections.length, 0) },
    ] as { value: Tab; label: React.ReactNode; count: number }[]
  ).filter((t) => t.count > 0);
  const activeTab = tabs.some((t) => t.value === tab) ? tab : tabs[0]?.value;

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Reading official sources">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin text-brand" /> Reading the official pages…
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!sources.length) {
    return (
      <div className="flex gap-3 rounded-2xl border border-info/25 bg-info-soft p-4 text-sm">
        <MapPinned className="mt-0.5 size-5 shrink-0 text-info" />
        <p>
          {scope === "State-specific" ? (
            <>
              <strong>This is issued by your state government.</strong> There is no single national page we can read automatically — each state publishes its own rules. Use the official links below to reach your state&apos;s portal, and treat it as the authority.
            </>
          ) : (
            <>We don&apos;t read an official page for this process automatically yet. Use the official links below.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface px-4 py-3 shadow-soft">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          LIVE
        </span>
        <p className="order-last min-w-0 basis-full text-sm text-muted sm:order-none sm:basis-auto sm:flex-1">
          Read directly from <strong className="text-fg">{usable.length} official page{usable.length === 1 ? "" : "s"}</strong>
          {lastFetched && <> · last checked {relativeTime(lastFetched)}</>}
          {data?.refreshing.length ? " · updating in the background" : ""}
        </p>
        <Button size="sm" variant="outline" onClick={refresh} loading={refreshing} aria-label="Check official pages again" className="ml-auto sm:ml-0">
          {!refreshing && <RefreshCw className="size-3.5" />} Check again
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {changed.map((s) => (
        <div key={s.sourceId} role="status" className="rounded-2xl border border-warning/35 bg-warning-soft p-4">
          <p className="flex gap-2 text-sm">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
            <span>
              <strong>The official page “{s.title ?? s.org}” changed{s.changedAt ? ` on ${formatDate(s.changedAt)}` : ""}</strong> — after our editors last reviewed this guide. Until we re-verify, follow the official wording shown here.
            </span>
          </p>
          {s.diff && (s.diff.added.length > 0 || s.diff.removed.length > 0) && (
            <details className="mt-2 pl-7 text-[13px]">
              <summary className="cursor-pointer font-semibold text-warning">See what changed</summary>
              <ul className="mt-2 space-y-1">
                {s.diff.added.slice(0, 6).map((a) => (
                  <li key={`a${a}`} className="rounded-lg bg-success-soft px-2 py-1 text-fg"><span className="font-bold text-success">+ </span>{a}</li>
                ))}
                {s.diff.removed.slice(0, 6).map((r) => (
                  <li key={`r${r}`} className="rounded-lg bg-danger-soft px-2 py-1 text-muted line-through decoration-danger/40"><span className="font-bold text-danger no-underline">− </span>{r}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}

      {tabs.length > 0 && activeTab && (
        <>
          <Tabs<Tab> className="w-fit max-w-full" value={activeTab} onChange={setTab} tabs={tabs} />
          <div className="animate-fade-in">
            {activeTab === "text" ? (
              <div className="space-y-2">
                {usable.flatMap((s) =>
                  s.sections.map((sec, i) => (
                    <Disclosure key={`${s.sourceId}${i}`} summary={<span className="flex flex-col"><span>{sec.heading}</span><span className="text-xs font-normal text-muted">{s.title ?? s.org} · {hostOf(s.finalUrl ?? s.url)}</span></span>}>
                      <blockquote className="border-l-2 border-brand/40 pl-3 text-fg/90 [overflow-wrap:anywhere]">{sec.text}</blockquote>
                      <SourceLine s={s} />
                    </Disclosure>
                  )),
                )}
              </div>
            ) : (
              <ul className={cn("grid grid-cols-1 gap-2.5", !compact && "md:grid-cols-2")}>
                {facts[activeTab].slice(0, compact ? 6 : 12).map((f, i) => (
                  <FactCard key={`${f.source.sourceId}${i}`} f={f} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Sources */}
      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
          <span className="flex items-center gap-2"><Globe className="size-4 text-brand" /> Official pages we read ({sources.length})</span>
          <span className="text-xs font-normal text-muted group-open:hidden">Show</span>
        </summary>
        <ul className="divide-y divide-line border-t border-line">
          {sources.map((s) => {
            const m = SYNC_META[s.status];
            return (
              <li key={s.sourceId} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <a href={s.finalUrl ?? s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold hover:text-brand">
                    {s.title ?? s.org} <ArrowUpRight className="size-3.5" />
                  </a>
                  <p className="text-xs text-muted">
                    {s.org} · {hostOf(s.finalUrl ?? s.url)}
                    {s.fetchedAt ? ` · read ${relativeTime(s.fetchedAt)}` : ""}
                    {s.method === "pdf" ? " · PDF" : ""}
                  </p>
                  {s.status !== "ok" && s.status !== "changed" && s.error && <p className="mt-0.5 text-xs text-subtle">{s.status === "needs_browser" ? "This portal only works as an app in your browser — open it directly." : s.error}</p>}
                </div>
                <Badge tone={m.tone} icon={<m.icon className="size-3" />}>{m.label}</Badge>
              </li>
            );
          })}
        </ul>
      </details>

      <p className="text-xs text-muted">
        Quoted word-for-word from official pages by FormEase&apos;s automated reader. Layout and tables may lose formatting — open the source to see the original. The official site is always the authority.
      </p>
    </div>
  );
}

function FactCard({ f }: { f: FactWithSource }) {
  const isForm = f.type === "form";
  return (
    <li className="flex flex-col rounded-2xl border border-line bg-surface p-3.5 shadow-soft">
      {f.value && !isForm && (
        <p className={cn("mb-1.5 font-display text-lg font-semibold", f.type === "fee" ? "text-brand" : "text-fg")}>{f.value}</p>
      )}
      {isForm ? (
        <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm font-semibold hover:text-brand">
          <FileDown className="mt-0.5 size-4 shrink-0 text-brand" /> {f.text} <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" />
        </a>
      ) : (
        <blockquote className="flex-1 text-[13.5px] leading-relaxed text-fg/90 [overflow-wrap:anywhere]">“{f.text}”</blockquote>
      )}
      <SourceLine s={f.source} />
    </li>
  );
}

function SourceLine({ s }: { s: SourceSnapshot }) {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 border-t border-line pt-2 text-[11.5px] text-muted">
      <BadgeCheck className="size-3.5 text-brand" />
      <a href={s.finalUrl ?? s.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-brand hover:underline">
        {s.org}
      </a>
      · {hostOf(s.finalUrl ?? s.url)} {s.fetchedAt && <>· read {relativeTime(s.fetchedAt)}</>}
    </p>
  );
}
