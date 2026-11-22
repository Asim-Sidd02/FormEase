import "server-only";

/**
 * Admin endpoints (sync, accept baseline) are protected by FORMEASE_ADMIN_TOKEN when it is set.
 * Replace with real session auth (e.g. Auth.js roles) when accounts move server-side.
 */
export function adminAllowed(req: Request) {
  const token = process.env.FORMEASE_ADMIN_TOKEN;
  if (!token) return true;
  return req.headers.get("x-formease-admin-token") === token;
}

/** Scheduler endpoint: Vercel Cron and most schedulers send `Authorization: Bearer <CRON_SECRET>`. */
export function cronAllowed(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
