import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoredSnapshot } from "./types";

/*
 * File-backed snapshot store (one JSON file per source under FORMEASE_DATA_DIR, default ./.data).
 * Works for `next start` on a VM/container. For serverless deployments, swap these two functions
 * for a database table (e.g. Postgres `source_snapshots`) — nothing else depends on the storage.
 */
const DIR = path.join(process.env.FORMEASE_DATA_DIR ?? path.join(process.cwd(), ".data"), "sources");

const file = (id: string) => path.join(DIR, `${id.replace(/[^a-z0-9-]/gi, "_")}.json`);

export async function loadSnapshot(id: string): Promise<StoredSnapshot | null> {
  try {
    return JSON.parse(await readFile(file(id), "utf8")) as StoredSnapshot;
  } catch {
    return null;
  }
}

export async function saveSnapshot(s: StoredSnapshot) {
  await mkdir(DIR, { recursive: true });
  const tmp = `${file(s.sourceId)}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(s), "utf8");
  await rename(tmp, file(s.sourceId)); // atomic replace
}
