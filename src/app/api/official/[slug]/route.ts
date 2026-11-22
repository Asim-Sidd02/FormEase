import { after, NextResponse } from "next/server";
import { getProcess } from "@/content/processes";
import { browserConfigured } from "@/lib/sources/fetcher";
import { snapshotsForProcess, syncSource, toPublic, TTL_MS } from "@/lib/sources/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MIN_REFRESH_MS = 10 * 60_000; // users can ask for a re-check at most every 10 minutes per page

/**
 * Live official data for a process.
 *  - Missing snapshots are fetched now; stale ones (older than the TTL) refresh after the response.
 *  - `?refresh=1` re-checks pages not attempted in the last 10 minutes and waits for the result.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProcess(slug)) return NextResponse.json({ error: "Unknown process" }, { status: 404 });
  const refresh = new URL(req.url).searchParams.get("refresh") === "1";

  let { snaps, stale } = await snapshotsForProcess(slug);
  if (refresh) {
    const due = snaps.filter((s) => !s.attemptedAt || Date.now() - new Date(s.attemptedAt).getTime() > MIN_REFRESH_MS);
    if (due.length) {
      const fresh = await Promise.all(due.map((s) => syncSource(s.sourceId).catch(() => s)));
      snaps = snaps.map((s) => fresh.find((f) => f.sourceId === s.sourceId) ?? s);
      stale = stale.filter((id) => !due.some((d) => d.sourceId === id));
    }
  }
  if (stale.length) after(() => Promise.allSettled(stale.map((id) => syncSource(id))).then(() => undefined));

  return NextResponse.json(
    { sources: snaps.map(toPublic), refreshing: stale, browser: browserConfigured(), ttlHours: TTL_MS / 3600_000 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
