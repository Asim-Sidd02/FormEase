import { NextResponse } from "next/server";
import { getSource } from "@/content/sources";
import { adminAllowed } from "@/lib/sources/auth";
import { acceptBaseline, toPublic } from "@/lib/sources/sync";

export const dynamic = "force-dynamic";

/** A reviewer confirms the current official page has been checked and the guide reflects it. */
export async function POST(req: Request) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const { sourceId, by } = (await req.json().catch(() => ({}))) as { sourceId?: string; by?: string };
  if (!sourceId || !getSource(sourceId)) return NextResponse.json({ error: "Unknown source" }, { status: 404 });
  try {
    return NextResponse.json({ snapshot: toPublic(await acceptBaseline(sourceId, (by ?? "Reviewer").slice(0, 80))) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
