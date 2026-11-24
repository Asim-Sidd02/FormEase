import "server-only";
import { kvGet, kvIncr, kvSet, kvDel } from "@/lib/kv";
import type { Announcement, Scheme, SchemeRequest } from "./types";

/*
 * Government schemes written up by FormEase editors, plus visitor requests and a
 * filtered feed of PIB press releases. Everything lives in the key-value store (lib/kv.ts).
 */

const K = {
  index: "schemes:index",
  scheme: (slug: string) => `scheme:${slug}`,
  requests: "schemes:requests",
  reqIp: (ip: string) => `schemes:req-ip:${ip}`,
  pib: "schemes:pib",
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/* ---------- schemes ---------- */

export async function listSchemes(includeDrafts = false): Promise<Scheme[]> {
  const slugs = (await kvGet<string[]>(K.index)) ?? [];
  const all = (await Promise.all(slugs.map((s) => kvGet<Scheme>(K.scheme(s))))).filter((s): s is Scheme => !!s);
  return all
    .filter((s) => includeDrafts || s.status === "published")
    .sort((a, b) => (b.launchedOn ?? b.updatedAt).localeCompare(a.launchedOn ?? a.updatedAt));
}

export async function getScheme(slug: string): Promise<Scheme | null> {
  return kvGet<Scheme>(K.scheme(slug));
}

const clean = (s: unknown, max = 2000) => (typeof s === "string" ? s.trim().slice(0, max) : "");
const cleanList = (v: unknown, max = 40) =>
  (Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : [])
    .map((x) => clean(x, 600))
    .filter(Boolean)
    .slice(0, max);
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Validates editor input. Returns the scheme or a list of problems. */
export function validateScheme(input: Record<string, unknown>, existing?: Scheme | null): { scheme?: Scheme; errors: string[] } {
  const errors: string[] = [];
  const name = clean(input.name, 160);
  const officialUrl = clean(input.officialUrl, 500);
  const launchedOn = clean(input.launchedOn, 10);
  const deadline = clean(input.deadline, 10);
  if (!name) errors.push("Name is required.");
  if (!/^https:\/\/[^\s]+$/.test(officialUrl)) errors.push("Official link must be an https:// URL.");
  else if (!/\.(gov\.in|nic\.in)(\/|$|:)/.test(new URL(officialUrl).hostname + "/")) errors.push("Official link must be a .gov.in or .nic.in site.");
  if (launchedOn && !isDate(launchedOn)) errors.push("Launch date must be YYYY-MM-DD.");
  if (deadline && !isDate(deadline)) errors.push("Deadline must be YYYY-MM-DD.");
  const slug = existing?.slug ?? (slugify(clean(input.slug, 80) || name) || "");
  if (!slug) errors.push("Could not make a URL from the name.");
  if (errors.length) return { errors };

  const now = new Date().toISOString();
  return {
    errors,
    scheme: {
      slug,
      name,
      ministry: clean(input.ministry, 200),
      summary: clean(input.summary, 800),
      launchedOn: launchedOn || undefined,
      deadline: deadline || undefined,
      benefits: cleanList(input.benefits),
      eligibility: cleanList(input.eligibility),
      documents: cleanList(input.documents),
      steps: cleanList(input.steps),
      fees: clean(input.fees, 400) || undefined,
      officialUrl,
      applyUrl: /^https:\/\//.test(clean(input.applyUrl, 500)) ? clean(input.applyUrl, 500) : undefined,
      helpline: clean(input.helpline, 200) || undefined,
      status: input.status === "published" ? "published" : "draft",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      verifiedOn: input.status === "published" ? now.slice(0, 10) : existing?.verifiedOn,
    },
  };
}

export async function saveScheme(scheme: Scheme) {
  await kvSet(K.scheme(scheme.slug), scheme);
  const slugs = (await kvGet<string[]>(K.index)) ?? [];
  if (!slugs.includes(scheme.slug)) await kvSet(K.index, [...slugs, scheme.slug]);
}

export async function deleteScheme(slug: string) {
  await kvDel(K.scheme(slug));
  const slugs = (await kvGet<string[]>(K.index)) ?? [];
  await kvSet(
    K.index,
    slugs.filter((s) => s !== slug),
  );
}

/* ---------- visitor requests ---------- */

export async function listRequests(): Promise<SchemeRequest[]> {
  return (await kvGet<SchemeRequest[]>(K.requests)) ?? [];
}

export async function addRequest(name: string, note: string, ip: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((await kvIncr(K.reqIp(ip), 3600)) > 5) return { ok: false, error: "Too many requests. Please try again in an hour." };
  const list = await listRequests();
  const key = slugify(name);
  const existing = list.find((r) => slugify(r.name) === key && r.status === "open");
  if (existing) {
    existing.count += 1;
    existing.lastAt = new Date().toISOString();
    if (note && !existing.notes.includes(note)) existing.notes = [...existing.notes, note].slice(-5);
  } else {
    const now = new Date().toISOString();
    list.unshift({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, notes: note ? [note] : [], count: 1, status: "open", firstAt: now, lastAt: now });
  }
  await kvSet(K.requests, list.slice(0, 300));
  return { ok: true };
}

export async function updateRequest(id: string, status: SchemeRequest["status"]) {
  const list = await listRequests();
  const r = list.find((x) => x.id === id);
  if (!r) return false;
  r.status = status;
  await kvSet(K.requests, list);
  return true;
}

/* ---------- PIB announcements ---------- */

const PIB_RSS = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3";
/** PIB's feed holds only its latest ~20 releases, so it is re-read often and matches are kept between reads. */
const PIB_REFRESH_SEC = 60 * 60;
const KEEP_DAYS = 45;
const KEEP_MAX = 60;
/** Words that suggest a release is about a scheme, portal or programme for citizens (Hindi + English). */
const SCHEME_WORDS = /योजना|मिशन|अभियान|पोर्टल|पंजीकरण|आवेदन|लाभार्थ|सब्सिडी|छात्रवृत्ति|पेंशन|बीमा|ऋण|शुभारंभ|scheme|yojana|mission|abhiyan|portal|subsidy|scholarship|registration|beneficiar|pension|insurance|launch/i;

type PibStore = { items: Announcement[]; fetchedAt: string; nextAt: number };

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

export async function getAnnouncements(force = false): Promise<{ items: Announcement[]; fetchedAt: string | null; error?: string }> {
  const stored = await kvGet<PibStore>(K.pib);
  if (stored && !force && stored.nextAt > Date.now()) return stored;
  try {
    const res = await fetch(PIB_RSS, {
      // PIB rejects user agents containing "bot"; this still names the app honestly.
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FormEase/1.0)" },
      signal: AbortSignal.timeout(Number(process.env.FORMEASE_FETCH_TIMEOUT_MS ?? 20000)),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`PIB returned ${res.status}`);
    const xml = await res.text();
    const now = new Date().toISOString();
    const known = new Map((stored?.items ?? []).map((a) => [a.url, a]));
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const title = decode(m[1].match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const url = decode(m[1].match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
      if (!title || !/^https:\/\/(www\.)?pib\.gov\.in\//.test(url) || !SCHEME_WORDS.test(title)) continue;
      if (!known.has(url)) known.set(url, { title, url, seenAt: now });
    }
    const cutoff = Date.now() - KEEP_DAYS * 86_400_000;
    const items = [...known.values()]
      .filter((a) => Date.parse(a.seenAt) > cutoff)
      .sort((a, b) => b.seenAt.localeCompare(a.seenAt))
      .slice(0, KEEP_MAX);
    const fresh: PibStore = { items, fetchedAt: now, nextAt: Date.now() + PIB_REFRESH_SEC * 1000 };
    await kvSet(K.pib, fresh);
    return fresh;
  } catch (e) {
    console.error("[schemes] PIB feed failed", e);
    // Serve the saved list rather than nothing, and try again in 10 minutes.
    if (stored) {
      await kvSet(K.pib, { ...stored, nextAt: Date.now() + 10 * 60_000 }).catch(() => undefined);
      return { ...stored, error: "PIB could not be reached just now — showing the saved list." };
    }
    return { items: [], fetchedAt: null, error: "PIB could not be reached right now." };
  }
}
