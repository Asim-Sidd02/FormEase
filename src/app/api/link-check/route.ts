import { NextResponse } from "next/server";
import { getProcess } from "@/content/processes";
import type { LinkStatus } from "@/lib/types";

/**
 * Server-side official-link checker for the content console (spec §6.8, §9).
 * Only checks URLs that belong to a known process — it is not an open proxy.
 */
export async function POST(req: Request) {
  let slug: string | undefined;
  try {
    ({ slug } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const p = slug ? getProcess(slug) : undefined;
  if (!p) return NextResponse.json({ error: "Unknown process" }, { status: 404 });

  const results = await Promise.all(
    p.links.map(async (l) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(l.url, { method: "GET", redirect: "manual", signal: ctrl.signal, headers: { "User-Agent": "FormEase-LinkCheck/1.0" }, cache: "no-store" });
        const c = res.status;
        // 401/403/429 usually mean the site blocks automated checks, not that the page is gone.
        const status: LinkStatus = c < 300 ? "ok" : c < 400 ? "redirected" : [401, 403, 429].includes(c) ? "unreachable" : "broken";
        return { id: l.id, status, code: c };
      } catch {
        // Timeouts, DNS and TLS failures: we can't tell — flag for a manual check rather than calling it broken.
        return { id: l.id, status: "unreachable" as LinkStatus, code: 0 };
      } finally {
        clearTimeout(t);
      }
    }),
  );
  return NextResponse.json({ checkedAt: new Date().toISOString(), results });
}
