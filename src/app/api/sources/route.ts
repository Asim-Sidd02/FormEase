import { NextResponse } from "next/server";
import { trackedSources } from "@/content/sources";
import { browserConfigured } from "@/lib/sources/fetcher";
import { loadSnapshot } from "@/lib/sources/store";
import { toPublic } from "@/lib/sources/sync";

export const dynamic = "force-dynamic";

/** Every tracked official source with its latest snapshot summary (content console). */
export async function GET() {
  const rows = await Promise.all(
    trackedSources.map(async (src) => {
      const s = await loadSnapshot(src.id);
      return { source: src, snapshot: s ? toPublic(s) : null };
    }),
  );
  return NextResponse.json({ rows, browser: browserConfigured() }, { headers: { "Cache-Control": "no-store" } });
}
