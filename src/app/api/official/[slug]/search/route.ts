import { NextResponse } from "next/server";
import { getProcess } from "@/content/processes";
import { searchOfficial } from "@/lib/sources/sync";

export const dynamic = "force-dynamic";

/** Passages from the latest official snapshots that match a question (used by the assistant). */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProcess(slug)) return NextResponse.json({ error: "Unknown process" }, { status: 404 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 300);
  return NextResponse.json({ passages: q ? await searchOfficial(slug, q) : [] }, { headers: { "Cache-Control": "no-store" } });
}
