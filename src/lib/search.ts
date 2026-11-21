import type { Process } from "./types";

const STOP = new Set(
  "i me my we our you your a an the to of for and or in on at is am are was be been do does did need needs want wants how what which can could should would get getting make apply applying with from have has had it this that new just please help".split(
    " ",
  ),
);

/** Everyday phrases → canonical terms that appear in process keywords. */
const SYNONYMS: Record<string, string[]> = {
  moved: ["address", "shift"],
  moving: ["address", "shift"],
  shifted: ["address", "shift"],
  house: ["address"],
  home: ["address"],
  relocate: ["address", "shift"],
  aadhar: ["aadhaar"],
  adhaar: ["aadhaar"],
  adhar: ["aadhaar"],
  uid: ["aadhaar"],
  license: ["licence"],
  licence: ["licence", "driving"],
  dl: ["driving", "licence"],
  drive: ["driving"],
  bike: ["driving", "two-wheeler"],
  scooter: ["driving", "two-wheeler"],
  car: ["driving"],
  llr: ["learner"],
  ll: ["learner"],
  abroad: ["passport"],
  travel: ["passport"],
  visa: ["passport"],
  expired: ["renewal", "reissue"],
  expiring: ["renewal", "reissue"],
  expire: ["renewal", "reissue"],
  renew: ["renewal", "reissue"],
  lost: ["lost", "reissue"],
  damaged: ["damaged", "reissue"],
  correction: ["correction", "change"],
  correct: ["correction", "change"],
  mistake: ["correction"],
  wrong: ["correction"],
  change: ["change", "correction", "update"],
  update: ["update", "change"],
  tax: ["pan"],
  epic: ["voter"],
  election: ["voter"],
  vote: ["voter"],
  voting: ["voter"],
  baby: ["birth", "child"],
  newborn: ["birth", "child"],
  born: ["birth"],
  janam: ["birth"],
  salary: ["income"],
  earnings: ["income"],
  aay: ["income"],
  scholarship: ["income", "caste"],
  jati: ["caste"],
  sc: ["caste"],
  st: ["caste"],
  obc: ["caste"],
  reservation: ["caste"],
  niwas: ["domicile", "residence"],
  resident: ["domicile", "residence"],
  residence: ["domicile", "residence"],
  native: ["domicile"],
  certificate: ["certificate"],
  child: ["child", "minor"],
  kid: ["child", "minor"],
  son: ["child", "minor"],
  daughter: ["child", "minor"],
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function expand(tokens: string[]): string[] {
  const out = new Set<string>();
  for (const t of tokens) {
    out.add(t);
    if (t.endsWith("s") && t.length > 3) out.add(t.slice(0, -1));
    SYNONYMS[t]?.forEach((s) => out.add(s));
  }
  return [...out];
}

export interface SearchHit {
  process: Process;
  score: number;
  matched: string[];
}

export function searchProcesses(query: string, list: Process[]): SearchHit[] {
  const raw = tokenize(query);
  if (!raw.length) return [];
  const terms = expand(raw);

  const hits: SearchHit[] = [];
  for (const p of list) {
    const title = p.title.toLowerCase();
    const kw = p.keywords.join(" ").toLowerCase();
    const body = [p.summary, p.situations.join(" "), p.forWho.join(" ")].join(" ").toLowerCase();
    let score = 0;
    const matched = new Set<string>();
    for (const t of terms) {
      const original = raw.includes(t);
      const w = original ? 1 : 0.6;
      if (title.includes(t)) {
        score += 6 * w;
        matched.add(t);
      }
      if (new RegExp(`\\b${escape(t)}`).test(kw)) {
        score += 4 * w;
        matched.add(t);
      }
      if (body.includes(t)) {
        score += 1.5 * w;
        matched.add(t);
      }
    }
    if (title.includes(query.trim().toLowerCase())) score += 8;
    if (score > 0) hits.push({ process: p, score, matched: [...matched] });
  }
  return hits.sort((a, b) => b.score - a.score);
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Lightweight autocomplete suggestions. */
export function suggest(query: string, list: Process[], limit = 6): Process[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const prefix = list.filter(
    (p) => p.title.toLowerCase().includes(q) || p.keywords.some((k) => k.startsWith(q)),
  );
  const rest = searchProcesses(query, list)
    .map((h) => h.process)
    .filter((p) => !prefix.includes(p));
  return [...prefix, ...rest].slice(0, limit);
}

export const EXAMPLE_QUERIES = [
  "I moved to a new house and need to change my address",
  "My passport expires next month",
  "Get a driving licence for my scooter",
  "Birth certificate for my newborn",
  "Income certificate for a scholarship",
  "I need a PAN card quickly",
];
