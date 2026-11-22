import "server-only";
import { getProcess } from "@/content/processes";
import { getSource, sourcesFor, trackedSources } from "@/content/sources";
import { browserConfigured, fetchOfficial, renderWithBrowser, type FetchResult } from "./fetcher";
import { contentHash, diffBlocks, extractFacts, extractHtml, extractPdf, topSections, type Extraction } from "./extract";
import { loadSnapshot, saveSnapshot } from "./store";
import type { OfficialPassage, SourceSnapshot, StoredSnapshot, TrackedSource } from "./types";

export const TTL_MS = Number(process.env.FORMEASE_SOURCE_TTL_HOURS ?? 12) * 3600_000;
const inflight = new Map<string, Promise<StoredSnapshot>>();

const now = () => new Date().toISOString();

function emptySnapshot(src: TrackedSource): StoredSnapshot {
  return { sourceId: src.id, url: src.url, title: src.title, org: src.org, kind: src.kind, status: "unreachable", sections: [], facts: [], links: [], blocks: [], history: [] };
}

function focusTerms(src: TrackedSource) {
  const terms = new Set<string>(src.focus ?? []);
  for (const slug of src.processes) getProcess(slug)?.keywords.forEach((k) => terms.add(k));
  ["fee", "document", "proof", "apply", "update", "required", "process", "days"].forEach((t) => terms.add(t));
  return [...terms];
}

/** Fetch → extract → compare with the reviewed baseline → persist. */
export function syncSource(id: string): Promise<StoredSnapshot> {
  const running = inflight.get(id);
  if (running) return running;
  const p = doSync(id).finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

async function doSync(id: string): Promise<StoredSnapshot> {
  const src = getSource(id);
  if (!src) throw new Error(`Unknown source ${id}`);
  const prev = (await loadSnapshot(id)) ?? emptySnapshot(src);
  const attemptedAt = now();

  // 1. Fetch (plain HTTP first; JavaScript apps need a browser)
  let res: FetchResult;
  let method: SourceSnapshot["method"] = "http";
  if (src.kind === "spa") {
    if (!browserConfigured()) {
      const s: StoredSnapshot = { ...prev, url: src.url, org: src.org, kind: src.kind, status: "needs_browser", attemptedAt, error: "This official portal is a JavaScript app. Configure FORMEASE_BROWSER_CHANNEL or FORMEASE_BROWSER_PATH to read it." };
      await saveSnapshot(s);
      return s;
    }
    res = await renderWithBrowser(src.url);
    method = "browser";
  } else {
    res = await fetchOfficial(src.url);
    // Some servers send malformed responses that browsers tolerate; retry with the renderer when available.
    if (!res.ok && res.status !== 403 && res.status !== 429 && res.status !== 404 && src.kind === "html" && browserConfigured()) {
      const rendered = await renderWithBrowser(src.url);
      if (rendered.ok) {
        res = rendered;
        method = "browser";
      }
    }
  }

  if (!res.ok || !res.body) {
    // Keep the last good copy so users still see something — clearly marked as not refreshed.
    const s: StoredSnapshot = { ...prev, url: src.url, org: src.org, kind: src.kind, status: "unreachable", httpStatus: res.status || undefined, attemptedAt, error: res.error };
    await saveSnapshot(s);
    return s;
  }

  // 2. Extract
  let ex: Extraction;
  try {
    const isPdf = src.kind === "pdf" || /application\/pdf/i.test(res.contentType) || res.body.subarray(0, 5).toString() === "%PDF-";
    if (isPdf) method = "pdf";
    ex = isPdf ? await extractPdf(res.body, res.finalUrl) : extractHtml(res.body.toString("utf8"), res.finalUrl);
  } catch (e) {
    const s: StoredSnapshot = { ...prev, status: "error", attemptedAt, error: `Couldn't read the page (${(e as Error).message.slice(0, 80)})` };
    await saveSnapshot(s);
    return s;
  }

  if (ex.blocks.join(" ").length < 120) {
    const s: StoredSnapshot = {
      ...prev,
      status: src.kind === "html" && /enable javascript|<div id="root"|ng-version|__next/i.test(res.body.toString("utf8")) ? "needs_browser" : "error",
      httpStatus: res.status,
      attemptedAt,
      error: "The official page returned almost no readable text.",
    };
    await saveSnapshot(s);
    return s;
  }

  // A browser render much shorter than the last good one is almost always incomplete — keep the last copy.
  const textLength = ex.blocks.join(" ").length;
  if (method === "browser" && prev.textLength && textLength < prev.textLength * 0.5) {
    const s: StoredSnapshot = { ...prev, attemptedAt, error: "The portal didn't finish loading; showing the last complete copy." };
    await saveSnapshot(s);
    return s;
  }

  // 3. Compare with the version editors last reviewed
  const baselineBlocks = prev.baselineBlocks ?? ex.blocks; // first successful sync establishes the baseline

  // Learn rotating content (carousels, "did you know" tickers): a block that comes back after
  // disappearing, or vanishes right after appearing, is volatile and excluded from comparison.
  const volatile = new Set(prev.volatileBlocks ?? []);
  if (prev.blocks?.length) {
    const base = new Set(baselineBlocks);
    const last = new Set(prev.blocks);
    const now = new Set(ex.blocks);
    for (const b of ex.blocks) if (base.has(b) && !last.has(b)) volatile.add(b); // returned
    for (const b of prev.blocks) if (!base.has(b) && !now.has(b)) volatile.add(b); // appeared then vanished
  }
  const stable = (list: string[]) => list.filter((b) => !volatile.has(b));
  const hash = contentHash(stable(ex.blocks));
  const baselineHash = contentHash(stable(baselineBlocks));
  const differs = hash !== baselineHash;
  // Only flag a change once it has persisted across two consecutive syncs.
  const changed = differs && (prev.pendingHash === hash || prev.status === "changed");

  const s: StoredSnapshot = {
    sourceId: id,
    url: src.url,
    finalUrl: res.finalUrl,
    title: src.title,
    pageTitle: ex.title,
    org: src.org,
    kind: src.kind,
    method,
    status: changed ? "changed" : "ok",
    httpStatus: res.status,
    fetchedAt: attemptedAt,
    attemptedAt,
    lastModified: res.lastModified,
    contentHash: hash,
    baselineHash,
    baselineAt: prev.baselineAt ?? attemptedAt,
    baselineBy: prev.baselineBy ?? "First sync (automatic)",
    changedAt: changed ? (prev.status === "changed" && prev.changedAt ? prev.changedAt : attemptedAt) : undefined,
    textLength,
    sections: topSections(ex, focusTerms(src)),
    facts: extractFacts(ex, res.finalUrl),
    links: ex.links,
    diff: changed ? diffBlocks(stable(baselineBlocks), stable(ex.blocks)) : undefined,
    pendingHash: differs && !changed ? hash : undefined,
    blocks: ex.blocks.slice(0, 800),
    baselineBlocks: baselineBlocks.slice(0, 800),
    volatileBlocks: [...volatile].slice(-200),
    history: prev.history.at(-1)?.hash === hash ? prev.history : [...prev.history, { at: attemptedAt, hash }].slice(-30),
  };
  await saveSnapshot(s);
  return s;
}

/** An editor confirms the current official page has been reviewed (and the guide updated if needed). */
export async function acceptBaseline(id: string, by: string) {
  const s = await loadSnapshot(id);
  if (!s || !s.contentHash) throw new Error("Nothing synced yet for this source");
  const next: StoredSnapshot = { ...s, baselineHash: s.contentHash, baselineBlocks: s.blocks, baselineAt: now(), baselineBy: by, status: "ok", changedAt: undefined, diff: undefined, pendingHash: undefined };
  await saveSnapshot(next);
  return next;
}

export function toPublic(s: StoredSnapshot): SourceSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { blocks, baselineBlocks, history, volatileBlocks, pendingHash, ...pub } = s;
  return { ...pub, title: getSource(s.sourceId)?.title ?? pub.title };
}

export function isStale(s: StoredSnapshot | null) {
  if (!s) return true;
  const last = s.attemptedAt ?? s.fetchedAt;
  return !last || Date.now() - new Date(last).getTime() > TTL_MS;
}

/** Snapshots for a process; missing ones are fetched now, stale ones are refreshed by the caller in the background. */
export async function snapshotsForProcess(slug: string) {
  const srcs = sourcesFor(slug);
  const stale: string[] = [];
  const snaps = await Promise.all(
    srcs.map(async (src) => {
      const s = await loadSnapshot(src.id);
      if (!s) return syncSource(src.id).catch(() => emptySnapshot(src));
      if (isStale(s)) stale.push(src.id);
      return s;
    }),
  );
  return { snaps, stale };
}

export async function syncAll(filter?: (s: TrackedSource) => boolean) {
  const list = trackedSources.filter(filter ?? (() => true));
  const out: StoredSnapshot[] = [];
  // small concurrency to stay polite to government servers
  for (let i = 0; i < list.length; i += 3) {
    out.push(...(await Promise.all(list.slice(i, i + 3).map((s) => syncSource(s.id).catch(() => emptySnapshot(s))))));
  }
  return out;
}

/* ---------------------------- retrieval for the assistant ---------------------------- */

const STOP = new Set("the a an to of for and or in on at is are be do does i my me what how can need should with from this that it which when where who will you your".split(" "));

export async function searchOfficial(slug: string, query: string, limit = 4): Promise<OfficialPassage[]> {
  const terms = query
    .toLowerCase()
    .replace(/\[[^\]]*removed\]/g, " ")
    .split(/[^a-z0-9₹]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
  if (!terms.length) return [];
  const out: OfficialPassage[] = [];
  for (const src of sourcesFor(slug)) {
    const s = await loadSnapshot(src.id);
    if (!s?.blocks?.length) continue;
    s.blocks.forEach((b, i) => {
      const lower = b.toLowerCase();
      const hits = terms.filter((t) => lower.includes(t)).length;
      if (!hits) return;
      // include a little neighbouring context for short list items
      const text = b.length < 90 && s.blocks[i + 1] ? `${b} ${s.blocks[i + 1]}` : b;
      out.push({ sourceId: s.sourceId, org: s.org, title: s.title, url: s.finalUrl ?? s.url, fetchedAt: s.fetchedAt, text: text.slice(0, 600), score: hits / terms.length + (b.length > 40 ? 0.1 : 0) });
    });
  }
  return out
    .sort((a, b) => b.score - a.score)
    .filter((p, i, arr) => arr.findIndex((x) => x.text === p.text) === i)
    .filter((p) => p.score >= 0.34)
    .slice(0, limit);
}
