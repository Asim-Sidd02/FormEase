import { NextResponse } from "next/server";
import { adminAllowed } from "@/lib/sources/auth";
import { redact } from "@/lib/assistant";
import { addRequest, listRequests, updateRequest } from "@/lib/schemes/server";

export const dynamic = "force-dynamic";

/** A visitor asks for a scheme to be covered. */
export async function POST(req: Request) {
  const { name, note } = (await req.json().catch(() => ({}))) as { name?: string; note?: string };
  const n = redact((name ?? "").trim().slice(0, 120)).text;
  if (n.length < 3) return NextResponse.json({ error: "Enter the scheme's name." }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  try {
    const r = await addRequest(n, redact((note ?? "").trim().slice(0, 300)).text, ip);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 429 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[schemes] request failed", e);
    return NextResponse.json({ error: "Could not send your request. Please try again later." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Admin token required" }, { status: 403 });
  return NextResponse.json({ requests: await listRequests() });
}

export async function PATCH(req: Request) {
  if (!adminAllowed(req)) return NextResponse.json({ error: "Admin token required" }, { status: 403 });
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || !["open", "done", "dismissed"].includes(status ?? "")) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const ok = await updateRequest(id, status as "open" | "done" | "dismissed");
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
