// Copies .data/sources/*.json snapshots into the key-value store.
// Upstash Redis if KV_REST_API_URL/TOKEN (or UPSTASH_REDIS_REST_*) are set, else .data/kv.json.
//   node --env-file=.env scripts/migrate-snapshots.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = process.env.FORMEASE_DATA_DIR ?? ".data";
const dir = path.join(dataDir, "sources");
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith(".json"));
const key = (id) => `source:${id.replace(/[^a-z0-9-]/gi, "_")}`;

let kvFile = {};
if (!url) kvFile = JSON.parse(await readFile(path.join(dataDir, "kv.json"), "utf8").catch(() => "{}"));

for (const f of files) {
  const snap = JSON.parse(await readFile(path.join(dir, f), "utf8"));
  const k = key(snap.sourceId ?? f.replace(/\.json$/, ""));
  const v = JSON.stringify(snap);
  if (url) {
    const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(["SET", k, v]) });
    if (!r.ok) throw new Error(`${k}: ${r.status} ${await r.text()}`);
  } else kvFile[k] = { v };
  console.log("copied", k);
}
if (!url) await writeFile(path.join(dataDir, "kv.json"), JSON.stringify(kvFile));
console.log(`${files.length} snapshot(s) → ${url ? "Upstash Redis" : ".data/kv.json"}`);
