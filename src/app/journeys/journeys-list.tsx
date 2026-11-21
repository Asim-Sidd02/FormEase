"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CloudOff, Plus, Route, TriangleAlert } from "lucide-react";
import { useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { getProcess } from "@/content/processes";
import { buildJourneyView, JOURNEY_STATUS_META } from "@/lib/engine";
import { relativeTime } from "@/lib/reminders";
import { IconTile } from "@/components/icon";
import { Badge, buttonClass, EmptyState, ProgressBar, Skeleton, Tabs } from "@/components/ui";
import type { JourneyStatus } from "@/lib/types";

type Filter = "active" | "pending" | "attention" | "completed" | "archived";

export function JourneysList() {
  const hydrated = useHydrated();
  const journeys = useStore((s) => s.journeys);
  const user = useStore((s) => s.user);
  const [filter, setFilter] = useState<Filter>("active");

  if (!hydrated)
    return (
      <div className="container-page space-y-3 pt-10">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );

  const rows = journeys
    .map((j) => {
      const p = getProcess(j.processSlug);
      return p ? { j, p, v: buildJourneyView(p, j) } : null;
    })
    .filter(Boolean) as { j: (typeof journeys)[number]; p: NonNullable<ReturnType<typeof getProcess>>; v: ReturnType<typeof buildJourneyView> }[];

  const bucket = (s: JourneyStatus, archived: boolean): Filter => (archived ? "archived" : s);
  const counts = rows.reduce<Record<Filter, number>>(
    (acc, r) => ({ ...acc, [bucket(r.v.status, r.j.archived)]: acc[bucket(r.v.status, r.j.archived)] + 1 }),
    { active: 0, pending: 0, attention: 0, completed: 0, archived: 0 },
  );
  const list = rows.filter((r) => bucket(r.v.status, r.j.archived) === filter).sort((a, b) => b.j.updatedAt.localeCompare(a.j.updatedAt));

  return (
    <div className="container-page pt-8 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{user ? `Hi ${user.name.split(" ")[0]} 👋` : "My journeys"}</h1>
          <p className="mt-1.5 text-muted">{rows.length ? "Pick up where you left off." : "Your saved processes will appear here."}</p>
        </div>
        <Link href="/search" className={buttonClass("primary")}>
          <Plus className="size-4" /> Start a new process
        </Link>
      </div>

      {!user && rows.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4 sm:flex-row sm:items-center">
          <CloudOff className="size-5 shrink-0 text-warning" />
          <p className="flex-1 text-sm">These journeys are stored only in this browser. Sign in to keep them safe and sync across devices.</p>
          <Link href="/sign-in?next=/journeys" className={buttonClass("primary", "sm")}>Sign in</Link>
        </div>
      )}

      {counts.attention > 0 && filter !== "attention" && (
        <button onClick={() => setFilter("attention")} className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-left text-sm">
          <TriangleAlert className="size-5 shrink-0 text-danger" />
          <span className="flex-1">
            <strong>{counts.attention} journey{counts.attention > 1 ? "s need" : " needs"} your attention.</strong> An application was returned, rejected or is stuck.
          </span>
          <ArrowRight className="size-4" />
        </button>
      )}

      {rows.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Route className="size-6" />}
            title="No journeys yet"
            desc="Pick a process, answer a few questions and we'll build a step-by-step roadmap you can track here."
            action={
              <Link href="/search" className={buttonClass()}>
                Find a process <ArrowRight className="size-4" />
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <Tabs<Filter>
            className="mt-8 w-fit max-w-full"
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: "active", label: "In progress", count: counts.active },
              { value: "pending", label: "Waiting", count: counts.pending },
              { value: "attention", label: "Needs attention", count: counts.attention },
              { value: "completed", label: "Completed", count: counts.completed },
              { value: "archived", label: "Archived", count: counts.archived },
            ]}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {list.map(({ j, p, v }) => {
              const meta = JOURNEY_STATUS_META[v.status];
              return (
                <Link key={j.id} href={`/journey/${j.id}`} className="group animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift">
                  <div className="flex items-start gap-3">
                    <IconTile name={p.icon} category={p.category} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="truncate font-bold">{j.title}</h2>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted">{p.title}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressBar value={v.progress} />
                    <span className="text-sm font-bold tabular-nums">{v.progress}%</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
                    <p className="min-w-0 truncate text-sm">
                      {v.nextStep && v.status !== "completed" ? (
                        <>
                          <span className="text-muted">Next:</span> <span className="font-semibold">{v.nextStep.title}</span>
                        </>
                      ) : (
                        <span className="text-muted">All steps done</span>
                      )}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand">
                      {v.status === "completed" ? "Review" : "Continue"} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-subtle">
                    {v.docsReady}/{v.docsTotal} documents ready · last activity {relativeTime(j.updatedAt)}
                  </p>
                </Link>
              );
            })}
            {list.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-line-strong p-8 text-center text-sm text-muted">Nothing here right now.</p>}
          </div>
        </>
      )}
    </div>
  );
}
