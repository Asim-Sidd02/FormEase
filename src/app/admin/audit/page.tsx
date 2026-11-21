"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { getProcess } from "@/content/processes";
import { Card, cn, inputClass } from "@/components/ui";

export default function AuditLog() {
  const audit = useStore((s) => s.audit);
  const [q, setQ] = useState("");
  const list = audit.filter((a) => !q || `${a.action} ${a.actor} ${a.target}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Audit log</h1>
      <p className="mt-1 text-muted">Every content and moderation change, newest first.</p>
      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by action, person or guide" aria-label="Filter audit log" className={cn(inputClass, "py-2 pl-9")} />
      </div>
      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-left text-xs uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">{new Date(a.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-3">{a.actor}</td>
                  <td className="px-4 py-3 font-semibold">{a.action}</td>
                  <td className="px-4 py-3 text-muted">{getProcess(a.target)?.shortTitle ?? a.target}</td>
                </tr>
              ))}
              {!list.length && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No entries.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
