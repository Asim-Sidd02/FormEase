#!/usr/bin/env node
/**
 * Re-read every tracked official page via a running FormEase server.
 *   npm run sync:sources                       (defaults to http://localhost:3000)
 *   FORMEASE_URL=https://your.site FORMEASE_ADMIN_TOKEN=... npm run sync:sources
 * Schedule it daily (cron, Task Scheduler, GitHub Actions) — or point a scheduler at GET /api/cron/sync-sources.
 */
const base = process.env.FORMEASE_URL ?? "http://localhost:3000";
const headers = { "Content-Type": "application/json" };
if (process.env.FORMEASE_ADMIN_TOKEN) headers["x-formease-admin-token"] = process.env.FORMEASE_ADMIN_TOKEN;

const res = await fetch(`${base}/api/sources/sync`, { method: "POST", headers, body: "{}" });
if (!res.ok) {
  console.error(`Sync failed: HTTP ${res.status}`, await res.text());
  process.exit(1);
}
const { results } = await res.json();
for (const s of results) console.log(`${s.status.padEnd(14)} ${s.sourceId.padEnd(24)} ${s.error ?? ""}`);
const changed = results.filter((s) => s.status === "changed");
console.log(`\n${results.length} sources · ${changed.length} changed since review${changed.length ? " → review them in /admin/sources" : ""}`);
process.exit(changed.length ? 2 : 0); // non-zero so schedulers can alert editors
