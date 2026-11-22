import { NextResponse } from "next/server";
import { EMAIL_RE, normalizeEmail, requestCode } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    console.error(`[auth] /api/auth/send-code failed:`, err);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again shortly." }, { status: 500 });
  }
}

async function handle(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const e = normalizeEmail(email ?? "");
  if (!EMAIL_RE.test(e) || e.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const r = await requestCode(e, ip);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true });
}
