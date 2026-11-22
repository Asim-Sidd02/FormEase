import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Minimal key-value store.
 * - Production / Vercel: Upstash Redis over its REST API (no SDK). Reads the env vars that
 *   Vercel's Upstash integration adds (KV_REST_API_URL / KV_REST_API_TOKEN) or Upstash's own names.
 * - Local development without those vars: a JSON file under FORMEASE_DATA_DIR (default ./.data/kv.json).
 */

/** Finds the env var even when Vercel's integration added a custom prefix (e.g. STORAGE_KV_REST_API_URL). */
function env(...suffixes: string[]): string | undefined {
  for (const s of suffixes) if (process.env[s]) return process.env[s];
  for (const s of suffixes) {
    const k = Object.keys(process.env).find((key) => key.endsWith(`_${s}`) && process.env[key]);
    if (k) return process.env[k];
  }
}
const URL_ = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
const TOKEN = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
export const usingRedis = !!(URL_ && TOKEN);

async function redis<T = unknown>(...cmd: (string | number)[]): Promise<T> {
  const r = await fetch(URL_!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const data = (await r.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!r.ok || data.error) throw new Error(`Redis ${cmd[0]} failed: ${data.error ?? r.status}`);
  return data.result as T;
}

/* ---------- file fallback (dev only) ---------- */

type Entry = { v: string; exp?: number };
const FILE = path.join(process.env.FORMEASE_DATA_DIR ?? path.join(process.cwd(), ".data"), "kv.json");
let queue: Promise<unknown> = Promise.resolve();

function fileOp<T>(fn: (db: Record<string, Entry>) => T): Promise<T> {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return Promise.reject(new Error("No database configured: connect Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN)."));
  }
  const run = queue.then(async () => {
    let db: Record<string, Entry> = {};
    try {
      db = JSON.parse(await fs.readFile(FILE, "utf8"));
    } catch {}
    const now = Date.now();
    for (const [k, e] of Object.entries(db)) if (e.exp && e.exp < now) delete db[k];
    const result = fn(db);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(`${FILE}.tmp`, JSON.stringify(db));
    await fs.rename(`${FILE}.tmp`, FILE);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

/* ---------- API ---------- */

export async function kvGet<T>(key: string): Promise<T | null> {
  const raw = usingRedis ? await redis<string | null>("GET", key) : await fileOp((db) => db[key]?.v ?? null);
  return raw == null ? null : (JSON.parse(raw) as T);
}

/** Set a value. `ttlSec` expires it; `onlyIfAbsent` makes it a no-op when the key exists. Returns whether it was written. */
export async function kvSet(key: string, value: unknown, opts: { ttlSec?: number; onlyIfAbsent?: boolean } = {}): Promise<boolean> {
  const v = JSON.stringify(value);
  if (usingRedis) {
    const cmd: (string | number)[] = ["SET", key, v];
    if (opts.ttlSec) cmd.push("EX", opts.ttlSec);
    if (opts.onlyIfAbsent) cmd.push("NX");
    return (await redis<string | null>(...cmd)) === "OK";
  }
  return fileOp((db) => {
    if (opts.onlyIfAbsent && db[key]) return false;
    db[key] = { v, exp: opts.ttlSec ? Date.now() + opts.ttlSec * 1000 : undefined };
    return true;
  });
}

export async function kvDel(key: string): Promise<void> {
  if (usingRedis) await redis("DEL", key);
  else await fileOp((db) => void delete db[key]);
}

/** Atomically increment a counter; the TTL is applied when the counter is created. */
export async function kvIncr(key: string, ttlSec: number): Promise<number> {
  if (usingRedis) {
    const n = await redis<number>("INCR", key);
    if (n === 1) await redis("EXPIRE", key, ttlSec);
    return n;
  }
  return fileOp((db) => {
    const n = Number(db[key]?.v ?? 0) + 1;
    db[key] = { v: String(n), exp: db[key]?.exp ?? Date.now() + ttlSec * 1000 };
    return n;
  });
}
