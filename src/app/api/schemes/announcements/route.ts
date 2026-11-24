import { NextResponse } from "next/server";
import { adminAllowed } from "@/lib/sources/auth";
import { getAnnouncements } from "@/lib/schemes/server";

export const dynamic = "force-dynamic";

/** Recent PIB releases that mention a scheme. Cached for 3 hours; `?refresh=1` (admin) re-reads now. */
export async function GET(req: Request) {
  const force = new URL(req.url).searchParams.get("refresh") === "1" && adminAllowed(req);
  try {
    return NextResponse.json(await getAnnouncements(force));
  } catch (e) {
    console.error("[schemes] announcements failed", e);
    return NextResponse.json({ items: [], fetchedAt: null, error: "Announcements are temporarily unavailable." }, { status: 500 });
  }
}
