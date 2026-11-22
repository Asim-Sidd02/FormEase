import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { kvDel, kvGet, kvIncr, kvSet } from "@/lib/kv";

/**
 * Email one-time-code auth.
 * - Codes and users live in Upstash Redis (see lib/kv.ts; a local file in development).
 * - Sessions are stateless HMAC-signed cookies (AUTH_SECRET).
 * - Email goes out over SMTP (e.g. Gmail with an app password — free, no domain needed).
 */

export const SESSION_COOKIE = "fe_session";
export const SESSION_DAYS = 30;
const CODE_TTL_SEC = 10 * 60;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 60;
const IP_LIMIT_PER_HOUR = 10;

const K = {
  code: (e: string) => `auth:code:${e}`,
  tries: (e: string) => `auth:tries:${e}`,
  cooldown: (e: string) => `auth:cool:${e}`,
  ip: (ip: string) => `auth:ip:${ip}`,
  user: (e: string) => `auth:user:${e}`,
};

export interface AuthUser {
  email: string;
  name: string;
  createdAt: string;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (32+ characters).");
  return "dev-only-insecure-secret-change-me-please-0000";
}

const hmac = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/* ---------- email ---------- */

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host: SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendCodeEmail(to: string, code: string) {
  const t = transport();
  if (!t) {
    if (process.env.NODE_ENV === "production") throw new Error("Email is not configured.");
    console.log(`\n[auth] SMTP not configured — sign-in code for ${to}: ${code}\n`);
    return;
  }
  const from = process.env.EMAIL_FROM ?? `FormEase <${process.env.SMTP_USER}>`;
  await t.sendMail({
    from,
    to,
    subject: `${code} is your FormEase sign-in code`,
    text: `Your FormEase sign-in code is ${code}.\n\nIt expires in 10 minutes. If you didn't ask for this, you can ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#1a2b25">
      <p>Your FormEase sign-in code is:</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
      <p style="color:#5b6b65">It expires in 10 minutes. If you didn't ask for this, you can ignore this email.</p>
    </div>`,
  });
}

/* ---------- codes ---------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export async function requestCode(
  email: string,
  ip: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if ((await kvIncr(K.ip(ip), 3600)) > IP_LIMIT_PER_HOUR) {
    return { ok: false, error: "Too many requests. Please try again later.", status: 429 };
  }
  if (!(await kvSet(K.cooldown(email), 1, { ttlSec: RESEND_COOLDOWN_SEC, onlyIfAbsent: true }))) {
    return { ok: false, error: "Please wait a minute before requesting another code.", status: 429 };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await kvSet(K.code(email), hmac(`${email}:${code}`), { ttlSec: CODE_TTL_SEC });
  await kvDel(K.tries(email));
  try {
    await sendCodeEmail(email, code);
  } catch (e) {
    console.error("[auth] email send failed", e);
    await Promise.all([kvDel(K.code(email)), kvDel(K.cooldown(email))]);
    return { ok: false, error: "We couldn't send the email. Please try again.", status: 502 };
  }
  return { ok: true };
}

export async function verifyCode(
  email: string,
  code: string,
  name: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const hash = await kvGet<string>(K.code(email));
  if (!hash) return { ok: false, error: "That code has expired. Request a new one." };
  if ((await kvIncr(K.tries(email), CODE_TTL_SEC)) > MAX_ATTEMPTS) {
    await kvDel(K.code(email));
    return { ok: false, error: "Too many wrong attempts. Request a new code." };
  }
  if (!safeEqual(hash, hmac(`${email}:${code}`))) {
    return { ok: false, error: "That code isn't right. Check the email and try again." };
  }
  await Promise.all([kvDel(K.code(email)), kvDel(K.tries(email))]);
  let user = await kvGet<AuthUser>(K.user(email));
  if (!user) {
    user = { email, name: name || email.split("@")[0], createdAt: new Date().toISOString() };
    await kvSet(K.user(email), user);
  }
  return { ok: true, user };
}

export async function getUser(email: string): Promise<AuthUser | null> {
  return kvGet<AuthUser>(K.user(email));
}

/* ---------- sessions ---------- */

export function createSessionToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ e: email, x: Date.now() + SESSION_DAYS * 86_400_000 })).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, hmac(payload))) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; x: number };
    return x > Date.now() ? e : null;
  } catch {
    return null;
  }
}

export const sessionCookie = (token: string) => ({
  name: SESSION_COOKIE,
  value: token,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 86_400,
});
