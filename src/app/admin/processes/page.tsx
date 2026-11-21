"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { useAllProcesses } from "@/lib/hooks";
import { isOverdue, STATUS_META } from "@/lib/admin";
import { formatDate } from "@/lib/reminders";
import { categories } from "@/content/categories";
import { Badge, Card, cn, inputClass } from "@/components/ui";
import { IconTile } from "@/components/icon";
import type { ContentStatus } from "@/lib/types";

type Sort = "title" | "reviewDue" | "lastVerified";

export default function AdminProcesses() {
  const processes = useAllProcesses();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [owner, setOwner] = useState("");
  const [sort, setSort] = useState<Sort>("reviewDue");

  const owners = [...new Set(processes.map((p) => p.owner))];
  const list = useMemo(
    () =>
      processes
        .filter((p) => (!q || p.title.toLowerCase().includes(q.toLowerCase())) && (!cat || p.category === cat) && (!status || p.status === status) && (!owner || p.owner === owner))
        .sort((a, b) => (a[sort] as string).localeCompare(b[sort] as string)),
    [processes, q, cat, status, owner, sort],
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Processes</h1>
      <p className="mt-1 text-muted">Every guide, its verification status and review schedule.</p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides" aria-label="Search guides" className={cn(inputClass, "py-2 pl-9")} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className={cn(inputClass, "py-2")}>
          <option value="">All categories</option>
          {categories.filter((c) => c.live).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus | "")} aria-label="Status" className={cn(inputClass, "py-2")}>
          <option value="">All statuses</option>
          {(Object.keys(STATUS_META) as ContentStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner" className={cn(inputClass, "py-2")}>
          <option value="">All owners</option>
          {owners.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-left text-xs uppercase tracking-wider text-subtle">
              <tr>
                <Th onClick={() => setSort("title")} active={sort === "title"}>Guide</Th>
                <th className="px-4 py-3 font-bold">Status</th>
                <Th onClick={() => setSort("lastVerified")} active={sort === "lastVerified"}>Last verified</Th>
                <Th onClick={() => setSort("reviewDue")} active={sort === "reviewDue"}>Review due</Th>
                <th className="px-4 py-3 font-bold">Owner</th>
                <th className="px-4 py-3 font-bold">Ver.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => (
                <tr key={p.slug} className="transition hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/processes/${p.slug}`} className="flex items-center gap-3 font-semibold hover:text-brand">
                      <IconTile name={p.icon} category={p.category} size="sm" />
                      <span>
                        {p.title}
                        <span className="block text-xs font-normal capitalize text-muted">{p.category} · {p.scope}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><Badge tone={STATUS_META[p.status].tone}>{STATUS_META[p.status].label}</Badge></td>
                  <td className="px-4 py-3 tabular-nums text-muted">{formatDate(p.lastVerified)}</td>
                  <td className={cn("px-4 py-3 tabular-nums", isOverdue(p) ? "font-semibold text-danger" : "text-muted")}>{formatDate(p.reviewDue)}</td>
                  <td className="px-4 py-3 text-muted">{p.owner}</td>
                  <td className="px-4 py-3 text-muted">v{p.version}</td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">No guides match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Th({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active: boolean }) {
  return (
    <th className="px-4 py-3 font-bold" aria-sort={active ? "ascending" : "none"}>
      <button onClick={onClick} className={cn("inline-flex items-center gap-1 uppercase", active && "text-brand")}>
        {children} <ArrowUpDown className="size-3" />
      </button>
    </th>
  );
}
