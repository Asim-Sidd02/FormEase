import { NextResponse } from "next/server";
import { getSource } from "@/content/sources";
import { adminAllowed } from "@/lib/sources/auth";
import { syncAll, syncSource, toPublic } from "@/lib/sources/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Sync now: { sourceId } for one page, { slug } for one process, or {} for everything. */
export async function POST(req: Request) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { sourceId?: string; slug?: string };
  if (body.sourceId) {
    if (!getSource(body.sourceId)) return NextResponse.json({ error: "Unknown source" }, { status: 404 });
    return NextResponse.json({ results: [toPublic(await syncSource(body.sourceId))] });
  }
  const results = await syncAll(body.slug ? (s) => s.processes.includes(body.slug!) : undefined);
  return NextResponse.json({ results: results.map(toPublic) });
}
