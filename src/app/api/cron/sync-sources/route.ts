import { NextResponse } from "next/server";
import { cronAllowed } from "@/lib/sources/auth";
import { syncAll } from "@/lib/sources/sync";
import { getAnnouncements } from "@/lib/schemes/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Scheduled re-sync of every official source. Point a daily cron at this URL. */
export async function GET(req: Request) {
  if (!cronAllowed(req)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const [results, pib] = await Promise.all([syncAll(), getAnnouncements(true)]);
  const count = (st: string) => results.filter((r) => r.status === st).length;
  return NextResponse.json({ synced: results.length, ok: count("ok"), changed: count("changed"), unreachable: count("unreachable"), needsBrowser: count("needs_browser"), errors: count("error"), announcements: pib.items.length });
}
