import { NextResponse } from "next/server";
import { createSessionToken, normalizeEmail, sessionCookie, verifyCode } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, code, name } = (await req.json().catch(() => ({}))) as { email?: string; code?: string; name?: string };
  const e = normalizeEmail(email ?? "");
  if (!e || !/^\d{6}$/.test(code ?? "")) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  const r = await verifyCode(e, code!, (name ?? "").trim().slice(0, 40));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 401 });
  const res = NextResponse.json({ user: r.user });
  res.cookies.set(sessionCookie(createSessionToken(r.user.email)));
  return res;
}
