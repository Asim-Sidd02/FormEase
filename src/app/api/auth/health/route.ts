import { NextResponse } from "next/server";
import { kvGet, usingRedis } from "@/lib/kv";

export const dynamic = "force-dynamic";

/** Setup check for sign-in. Reports only yes/no — never secret values. */
export async function GET() {
  let database = usingRedis ? "connected" : process.env.VERCEL ? "missing: connect Upstash Redis in Vercel → Storage" : "local file";
  if (usingRedis) {
    try {
      await kvGet("health:ping");
    } catch (e) {
      database = `error: ${(e as Error).message.replace(/https?:\/\/\S+/g, "[url]").slice(0, 200)}`;
    }
  }
  const secret = process.env.AUTH_SECRET ?? "";
  return NextResponse.json({
    database,
    authSecret: secret.length >= 32 ? "ok" : secret ? "too short (needs 32+ chars)" : "missing",
    email: process.env.SMTP_USER && process.env.SMTP_PASS ? "configured" : "missing SMTP_USER / SMTP_PASS",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
