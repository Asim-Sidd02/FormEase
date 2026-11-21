"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { getProcess } from "@/content/processes";
import { buildJourneyView } from "@/lib/engine";
import { IconTile } from "./icon";

/** "Pick up where you left off" — resumes the most recently touched journey. */
export function ContinueBanner() {
  const hydrated = useHydrated();
  const journeys = useStore((s) => s.journeys);
  if (!hydrated) return null;
  const j = [...journeys].filter((x) => !x.archived).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (!j) return null;
  const p = getProcess(j.processSlug);
  if (!p) return null;
  const v = buildJourneyView(p, j);
  if (v.status === "completed") return null;
  return (
    <Link
      href={`/journey/${j.id}`}
      className="mt-6 flex max-w-2xl animate-fade-up items-center gap-3 rounded-2xl border border-brand/30 bg-surface p-3 pr-4 shadow-soft transition hover:shadow-lift"
    >
      <IconTile name={p.icon} category={p.category} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-brand">Pick up where you left off · {v.progress}% done</p>
        <p className="truncate text-sm font-semibold">
          {j.title}
          {v.nextStep && <span className="font-normal text-muted"> — next: {v.nextStep.title}</span>}
        </p>
      </div>
      <ArrowRight className="size-5 shrink-0 text-brand" aria-hidden />
    </Link>
  );
}
