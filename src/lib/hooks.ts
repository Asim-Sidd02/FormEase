"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useStore } from "./store";
import { getProcess, processes } from "@/content/processes";
import type { Process } from "./types";

/** True once persisted state has been read on the client (avoids SSR mismatches). */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

/** Process content merged with admin overrides (status, dates, summary). */
export function useProcess(slug: string): Process | undefined {
  const override = useStore((s) => s.overrides[slug]);
  const base = getProcess(slug);
  if (!base) return undefined;
  if (!override) return base;
  return {
    ...base,
    status: override.status ?? base.status,
    lastVerified: override.lastVerified ?? base.lastVerified,
    reviewDue: override.reviewDue ?? base.reviewDue,
    summary: override.summary ?? base.summary,
    owner: override.owner ?? base.owner,
    links: base.links.map((l) => ({ ...l, linkStatus: override.linkStatus?.[l.id] ?? l.linkStatus })),
  };
}

export function useAllProcesses(): Process[] {
  const overrides = useStore((s) => s.overrides);
  return processes.map((p) => {
    const o = overrides[p.slug];
    return o ? { ...p, status: o.status ?? p.status, lastVerified: o.lastVerified ?? p.lastVerified, reviewDue: o.reviewDue ?? p.reviewDue, owner: o.owner ?? p.owner } : p;
  });
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatch(m.matches);
    const fn = () => setMatch(m.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, [query]);
  return match;
}
