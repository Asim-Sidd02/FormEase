"use client";

import { useCallback, useEffect, useState } from "react";
import type { OfficialPassage, SourceSnapshot } from "./types";

export interface OfficialData {
  sources: SourceSnapshot[];
  refreshing: string[];
  browser: boolean;
  ttlHours: number;
}

/** Live official snapshots for a process (fetched from our server, which reads the official sites). */
export function useOfficialData(slug: string | undefined) {
  const [data, setData] = useState<OfficialData | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!slug) return;
      refresh ? setRefreshing(true) : setLoading(true);
      try {
        const res = await fetch(`/api/official/${slug}${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        setData(await res.json());
        setError(null);
      } catch {
        setError("We couldn't load the live official data right now.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refreshing, error, refresh: () => load(true) };
}

export async function searchOfficialPassages(slug: string, q: string): Promise<OfficialPassage[]> {
  try {
    const res = await fetch(`/api/official/${slug}/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()).passages ?? [];
  } catch {
    return [];
  }
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
