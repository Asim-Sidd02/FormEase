import "server-only";
import { kvGet, kvSet } from "@/lib/kv";
import type { StoredSnapshot } from "./types";

/*
 * Snapshot store: one key per source in Upstash Redis on Vercel (see lib/kv.ts),
 * or a local JSON file in development.
 */
const key = (id: string) => `source:${id.replace(/[^a-z0-9-]/gi, "_")}`;

export async function loadSnapshot(id: string): Promise<StoredSnapshot | null> {
  return kvGet<StoredSnapshot>(key(id));
}

export async function saveSnapshot(s: StoredSnapshot) {
  await kvSet(key(s.sourceId), s);
}
