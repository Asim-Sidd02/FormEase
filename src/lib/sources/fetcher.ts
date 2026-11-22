import "server-only";
import dns from "node:dns";
import { Agent, fetch as undiciFetch } from "undici";

// Several government hosts publish AAAA records that do not answer; prefer IPv4 so fetches do not stall.
dns.setDefaultResultOrder("ipv4first");

/* Polite, allow-listed fetching of official pages. Never used as an open proxy. */

const ALLOWED_HOSTS = [/\.gov\.in$/i, /\.nic\.in$/i, /(^|\.)utiitsl\.com$/i, /(^|\.)proteantech\.in$/i];
/** Standard crawler format — honest about who we are, and accepted by government WAFs that reject non-browser UAs. */
export const USER_AGENT = "Mozilla/5.0 (compatible; FormEaseSourceSync/1.0; +https://formease.example/how-we-verify)";
const TIMEOUT_MS = Number(process.env.FORMEASE_FETCH_TIMEOUT_MS ?? 45000);

/** Some government servers take >10s to accept a TCP connection (Node fetch gives up at 10s). */
const agent = new Agent({ connect: { timeout: 30_000 }, headersTimeout: 30_000, bodyTimeout: 30_000 });

export function isAllowedUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ALLOWED_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

/* ---------------------------- robots.txt ---------------------------- */

const robotsCache = new Map<string, { at: number; disallow: string[] }>();

async function disallowedPaths(origin: string): Promise<string[]> {
  const hit = robotsCache.get(origin);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit.disallow;
  let disallow: string[] = [];
  try {
    const res = await undiciFetch(`${origin}/robots.txt`, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(35000), dispatcher: agent });
    if (res.ok) {
      let applies = false;
      for (const raw of (await res.text()).split(/\r?\n/)) {
        const line = raw.replace(/#.*/, "").trim();
        const [k, ...rest] = line.split(":");
        const v = rest.join(":").trim();
        if (/^user-agent$/i.test(k)) applies = v === "*" || /formease/i.test(v);
        else if (applies && /^disallow$/i.test(k) && v) disallow.push(v);
      }
    }
  } catch {
    disallow = []; // robots unreachable → treat as allowed, as crawlers conventionally do
  }
  robotsCache.set(origin, { at: Date.now(), disallow });
  return disallow;
}

export async function robotsAllows(url: string) {
  const u = new URL(url);
  const rules = await disallowedPaths(u.origin);
  return !rules.some((p) => p === "/" || u.pathname.startsWith(p));
}

/* ---------------------------- fetch ---------------------------- */

export interface FetchResult {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType: string;
  lastModified?: string;
  body?: Buffer;
  error?: string;
}

export async function fetchOfficial(url: string): Promise<FetchResult> {
  if (!isAllowedUrl(url)) return { ok: false, status: 0, finalUrl: url, contentType: "", error: "Domain is not on the official allow-list" };
  if (!(await robotsAllows(url))) return { ok: false, status: 0, finalUrl: url, contentType: "", error: "Blocked by the site's robots.txt" };
  try {
    const res = await undiciFetch(url, {
      dispatcher: agent,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5", "Accept-Language": "en-IN,en;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const finalUrl = res.url || url;
    if (!isAllowedUrl(finalUrl)) return { ok: false, status: res.status, finalUrl, contentType: "", error: "Redirected outside official domains" };
    if (res.status === 403 || res.status === 429) return { ok: false, status: res.status, finalUrl, contentType: "", error: "The site blocks automated access — we respect that and do not work around it" };
    const body = Buffer.from(await res.arrayBuffer());
    return {
      ok: res.ok,
      status: res.status,
      finalUrl,
      contentType: res.headers.get("content-type") ?? "",
      lastModified: res.headers.get("last-modified") ?? undefined,
      body,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const reason = err.name === "TimeoutError" ? "Timed out" : err.cause?.code ?? err.message;
    return { ok: false, status: 0, finalUrl: url, contentType: "", error: `Couldn't reach the site (${reason})` };
  }
}

/* ---------------------------- headless render (optional) ---------------------------- */

/**
 * JavaScript-only portals (e.g. Passport Seva, myAadhaar, ECI) return an empty shell to plain HTTP.
 * If a browser is configured we render them; otherwise the source is reported as `needs_browser`.
 *   FORMEASE_BROWSER_CHANNEL=chrome|msedge   or   FORMEASE_BROWSER_PATH=/path/to/chromium
 */
export function browserConfigured() {
  return !!(process.env.FORMEASE_BROWSER_CHANNEL || process.env.FORMEASE_BROWSER_PATH);
}

export async function renderWithBrowser(url: string): Promise<FetchResult> {
  if (!isAllowedUrl(url)) return { ok: false, status: 0, finalUrl: url, contentType: "", error: "Domain is not on the official allow-list" };
  if (!(await robotsAllows(url))) return { ok: false, status: 0, finalUrl: url, contentType: "", error: "Blocked by the site's robots.txt" };
  let pw: typeof import("playwright-core");
  try {
    pw = await import("playwright-core");
  } catch {
    return { ok: false, status: 0, finalUrl: url, contentType: "", error: "playwright-core is not installed" };
  }
  const browser = await pw.chromium.launch({
    headless: true,
    channel: process.env.FORMEASE_BROWSER_CHANNEL || undefined,
    executablePath: process.env.FORMEASE_BROWSER_PATH || undefined,
  });
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
    // JavaScript apps keep rendering after "network idle": wait until the visible text stops growing.
    let last = -1;
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(800);
      const len = await page.evaluate(() => document.body?.innerText.length ?? 0);
      if (len > 200 && len === last) break;
      last = len;
    }
    const html = await page.content();
    return { ok: true, status: res?.status() ?? 200, finalUrl: page.url(), contentType: "text/html", body: Buffer.from(html) };
  } catch (e) {
    return { ok: false, status: 0, finalUrl: url, contentType: "", error: `Browser render failed (${(e as Error).message.slice(0, 80)})` };
  } finally {
    await browser.close();
  }
}
