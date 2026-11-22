"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Check, Clock3, KeyRound, Loader2, MonitorSmartphone, RefreshCw, Radio } from "lucide-react";
import { useStore } from "@/lib/store";
import { getProcess } from "@/content/processes";
import { relativeTime } from "@/lib/reminders";
import { hostOf } from "@/lib/sources/client";
import type { SourceSnapshot, SyncStatus, TrackedSource } from "@/lib/sources/types";
import { SYNC_META } from "@/components/official-live";
import { Badge, Button, Card, cn, EmptyState, inputClass, Skeleton, Tabs } from "@/components/ui";
import { toast } from "@/components/toast";
import { ROLE_CAN } from "../admin-shell";

interface Row {
  source: TrackedSource;
  snapshot: SourceSnapshot | null;
}
type Filter = "all" | SyncStatus;

const tokenHeader = (): Record<string, string> => {
  try {
    const t = sessionStorage.getItem("fe-admin-token");
    return t ? { "x-formease-admin-token": t } : {};
  } catch {
    return {};
  }
};

export default function SourcesPage() {
  const user = useStore((s) => s.user)!;
  const log = useStore((s) => s.log);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [browser, setBrowser] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [needToken, setNeedToken] = useState(false);
  const [token, setToken] = useState("");
  const canReview = ROLE_CAN.review(user.role);

  const load = useCallback(async () => {
    const res = await fetch("/api/sources", { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows);
    setBrowser(data.browser);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...tokenHeader() }, body: JSON.stringify(body) });
    if (res.status === 403) {
      setNeedToken(true);
      throw new Error("Admin token required");
    }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
    return res.json();
  };

  const sync = async (sourceId?: string) => {
    setBusy(sourceId ?? "all");
    try {
      const { results } = (await post("/api/sources/sync", sourceId ? { sourceId } : {})) as { results: SourceSnapshot[] };
      const changed = results.filter((r) => r.status === "changed").length;
      log(sourceId ? `Synced official source` : `Synced all official sources (${changed} changed)`, sourceId ?? "official-sources");
      toast(sourceId ? "Source re-read" : "All official sources re-read", { tone: changed ? "warning" : "success", desc: changed ? `${changed} page${changed > 1 ? "s" : ""} changed since review.` : "No unreviewed changes." });
      await load();
    } catch (e) {
      toast("Sync failed", { tone: "warning", desc: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const accept = async (r: Row) => {
    setBusy(r.source.id);
    try {
      await post("/api/sources/baseline", { sourceId: r.source.id, by: `${user.name} (${user.role})` });
      log(`Reviewed official change: ${r.source.title}`, r.source.processes[0]);
      toast("Marked as reviewed", { desc: "Users will no longer see the change warning for this page." });
      await load();
    } catch (e) {
      toast("Couldn't save", { tone: "warning", desc: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  if (!rows)
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );

  const count = (f: Filter) => (f === "all" ? rows.length : rows.filter((r) => (r.snapshot?.status ?? "unreachable") === f).length);
  const list = rows.filter((r) => filter === "all" || (r.snapshot?.status ?? "unreachable") === filter).sort((a, b) => (a.snapshot?.status === "changed" ? -1 : 0) - (b.snapshot?.status === "changed" ? -1 : 0));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-semibold">
            <Radio className="size-6 text-brand" /> Official sources
          </h1>
          <p className="mt-1 max-w-2xl text-muted">
            Official pages FormEase reads automatically. When one changes after your last review, users see a warning and the official wording until you re-verify the guide and mark the change reviewed.
          </p>
        </div>
        <Button onClick={() => sync()} loading={busy === "all"}>
          {busy !== "all" && <RefreshCw className="size-4" />} Re-read all
        </Button>
      </div>

      {!browser && (
        <p className="mt-4 flex gap-2 rounded-xl border border-info/25 bg-info-soft px-3 py-2 text-sm text-info">
          <MonitorSmartphone className="mt-0.5 size-4 shrink-0" /> No headless browser is configured, so app-only portals (Passport Seva, myAadhaar, ECI) can&apos;t be read. Set FORMEASE_BROWSER_CHANNEL or FORMEASE_BROWSER_PATH on the server.
        </p>
      )}
      {needToken && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              sessionStorage.setItem("fe-admin-token", token);
            } catch {}
            setNeedToken(false);
            toast("Token saved for this session", { tone: "info" });
          }}
          className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3"
        >
          <KeyRound className="size-4 text-warning" />
          <span className="text-sm">This server requires the admin token.</span>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} className={cn(inputClass, "w-56 py-1.5")} aria-label="Admin token" />
          <Button size="sm" type="submit">Save</Button>
        </form>
      )}

      <Tabs<Filter>
        className="mt-6 w-fit max-w-full"
        value={filter}
        onChange={setFilter}
        tabs={(["all", "changed", "ok", "unreachable", "needs_browser", "error"] as Filter[])
          .filter((f) => f === "all" || count(f) > 0)
          .map((f) => ({ value: f, label: f === "all" ? "All" : SYNC_META[f as SyncStatus].label, count: count(f) }))}
      />

      <div className="mt-4 space-y-3">
        {list.length === 0 && <EmptyState icon={<Radio className="size-6" />} title="Nothing here" />}
        {list.map((r) => {
          const s = r.snapshot;
          const st = s?.status ?? "unreachable";
          const m = SYNC_META[st];
          const facts = s ? { fee: s.facts.filter((f) => f.type === "fee").length, doc: s.facts.filter((f) => f.type === "document").length, form: s.facts.filter((f) => f.type === "form").length } : null;
          return (
            <Card key={r.source.id} className={cn("p-4 sm:p-5", st === "changed" && "border-warning/50")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={r.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold hover:text-brand">
                      {r.source.title} <ArrowUpRight className="size-3.5" />
                    </a>
                    <Badge tone={m.tone} icon={<m.icon className="size-3" />}>{m.label}</Badge>
                    <Badge tone="neutral">{r.source.kind === "spa" ? "App (browser)" : r.source.kind.toUpperCase()}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {r.source.org} · {hostOf(r.source.url)} · used by{" "}
                    {r.source.processes.map((p, i) => (
                      <span key={p}>
                        {i > 0 && ", "}
                        <Link href={`/admin/processes/${p}`} className="font-semibold text-brand hover:underline">{getProcess(p)?.shortTitle ?? p}</Link>
                      </span>
                    ))}
                  </p>
                  <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {s?.fetchedAt ? `Read ${relativeTime(s.fetchedAt)}` : "Never read successfully"}{s?.attemptedAt && s.attemptedAt !== s.fetchedAt ? ` · last attempt ${relativeTime(s.attemptedAt)}` : ""}</span>
                    {s?.baselineAt && <span>Reviewed baseline: {relativeTime(s.baselineAt)} by {s.baselineBy}</span>}
                    {facts && <span>Found {facts.fee} fee · {facts.doc} document · {facts.form} form mentions</span>}
                  </p>
                  {s?.error && st !== "ok" && st !== "changed" && <p className="mt-1.5 text-xs text-danger">{s.error}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => sync(r.source.id)} loading={busy === r.source.id} disabled={!!busy && busy !== r.source.id}>
                    {busy !== r.source.id && <RefreshCw className="size-3.5" />} Re-read
                  </Button>
                  {st === "changed" && canReview && (
                    <Button size="sm" onClick={() => accept(r)} disabled={!!busy}>
                      <Check className="size-4" /> Mark reviewed
                    </Button>
                  )}
                </div>
              </div>
              {st === "changed" && s?.diff && (
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-success">Added on the official page</p>
                    <ul className="space-y-1 text-[13px]">
                      {s.diff.added.length ? s.diff.added.map((a) => <li key={a} className="rounded-lg bg-success-soft px-2 py-1">{a}</li>) : <li className="text-muted">Nothing added</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-danger">Removed from the official page</p>
                    <ul className="space-y-1 text-[13px]">
                      {s.diff.removed.length ? s.diff.removed.map((a) => <li key={a} className="rounded-lg bg-danger-soft px-2 py-1 text-muted line-through decoration-danger/30">{a}</li>) : <li className="text-muted">Nothing removed</li>}
                    </ul>
                  </div>
                  <p className="text-xs text-muted md:col-span-2">
                    Update the guide if the requirement changed, then mark reviewed. Changes are never applied to guides automatically.
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
