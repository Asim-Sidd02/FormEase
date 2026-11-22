import { commonStatusTerms, glossary, rejectionPatterns } from "@/content/glossary";
import { publicProcesses } from "@/content/processes";
import { applicableDocuments, applicableSteps, buildJourneyView } from "./engine";
import { searchProcesses, tokenize } from "./search";
import type { Journey, Process } from "./types";

/* ------------------------------------------------------------------ */
/*  Retrieval-grounded assistant (spec §6.7, §20).                     */
/*  Answers are composed ONLY from curated FormEase content. When the  */
/*  content does not cover a question it says so instead of guessing.  */
/*  Swap `answer()` for an LLM call constrained to the same retrieved  */
/*  context to add free-form generation.                               */
/* ------------------------------------------------------------------ */

export type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "note"; text: string }
  /** Verbatim passage from a live official page. */
  | { type: "quote"; text: string; org: string; url: string; fetchedAt?: string; heading?: string };

export interface AssistantReply {
  blocks: Block[];
  sources: { label: string; url: string }[];
  grounding: "verified" | "official" | "general" | "not_found";
  /** The process the answer was resolved against (used to look up live official passages). */
  processSlug?: string;
  redacted?: boolean;
  suggestions?: string[];
}

const SENSITIVE: { re: RegExp; label: string }[] = [
  { re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: "[Aadhaar-like number removed]" },
  { re: /\b[A-Z]{5}\d{4}[A-Z]\b/gi, label: "[PAN-like number removed]" },
  { re: /\b[A-Z]\d{7}\b/g, label: "[passport-like number removed]" },
  { re: /\b(otp|one[- ]time password|pin|password)\b[^.\n]{0,20}?\b\d{4,8}\b/gi, label: "[OTP/password removed]" },
  { re: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g, label: "[phone number removed]" },
];

export function redact(text: string): { text: string; changed: boolean } {
  let out = text;
  for (const s of SENSITIVE) out = out.replace(s.re, s.label);
  return { text: out, changed: out !== text };
}

const has = (q: string, re: RegExp) => re.test(q.toLowerCase());
/** Redaction placeholders must never influence retrieval (e.g. "[Aadhaar-like number removed]"). */
const stripPlaceholders = (s: string) => s.replace(/\[[^\]]*removed\]/gi, " ");

function srcs(p: Process, linkPurposes?: string[]) {
  const links = p.links.filter((l) => !linkPurposes || linkPurposes.includes(l.purpose));
  const list = (links.length ? links : p.links)
    .slice(0, 2)
    .map((l) => ({ label: l.label === l.org ? l.label : `${l.label} — ${l.org}`, url: l.url }));
  const fp = { label: `FormEase guide: ${p.title} (verified ${p.lastVerified})`, url: `/process/${p.slug}` };
  return [fp, ...list];
}

export function suggestionsFor(p?: Process, j?: Journey): string[] {
  if (!p) return ["How do I apply for a new passport?", "I moved house — how do I update my Aadhaar address?", "What is a self-attested copy?"];
  const base = ["Which document should I prepare first?", "Do I need to visit an office?", "How much does it cost?"];
  if (j) return ["What should I do next?", ...base.slice(0, 2), "My application was returned. What now?"];
  return [...base, "How long does it take?"];
}

export function answer(question: string, opts: { process?: Process; journey?: Journey }): AssistantReply {
  let process = opts.process;
  if (!process) {
    const hit = searchProcesses(stripPlaceholders(redact(question).text).toLowerCase(), publicProcesses)[0];
    if (hit && hit.score >= 4) process = hit.process;
  }
  return { ...answerFromGuide(question, { ...opts, process }), processSlug: process?.slug };
}

/** Merge verbatim passages from live official pages into a guide-based reply. */
export function withOfficial(reply: AssistantReply, passages: { text: string; org: string; url: string; fetchedAt?: string; heading?: string }[]): AssistantReply {
  if (!passages.length || reply.blocks.some((b) => b.type === "p" && /can't help create/.test(b.text))) return reply;
  const quotes: Block[] = passages.slice(0, 3).map((p) => ({ type: "quote", text: p.text, org: p.org, url: p.url, fetchedAt: p.fetchedAt, heading: p.heading }));
  if (reply.grounding === "not_found") {
    return {
      ...reply,
      grounding: "official",
      blocks: [
        { type: "p", text: "Our guide doesn't cover that, but the official page says:" },
        ...quotes,
        { type: "note", text: "Quoted word-for-word from the official source. If it doesn't answer your exact situation, contact the issuing office." },
      ],
    };
  }
  return { ...reply, blocks: [...reply.blocks, { type: "p", text: "**What the official page says right now:**" }, ...quotes] };
}

function answerFromGuide(question: string, opts: { process?: Process; journey?: Journey }): AssistantReply {
  const { text: q, changed: redacted } = redact(question);
  const lower = stripPlaceholders(q).toLowerCase();
  let { process } = opts;
  const { journey } = opts;

  // 1. Refuse fabrication / forgery requests
  if (has(lower, /\b(fake|forge|forged|backdate|edit (my|the) (certificate|document)|photoshop|duplicate stamp|bypass verification)\b/)) {
    return {
      grounding: "general",
      redacted,
      blocks: [
        { type: "p", text: "I can't help create, alter or fake documents or get around official checks. Doing so can lead to rejection and legal consequences." },
        { type: "p", text: "If a document has a genuine mistake, the right route is an official correction. I can explain how that works for your process." },
      ],
      sources: [],
    };
  }

  // 2. Resolve which process we're talking about
  if (!process) {
    const hit = searchProcesses(lower, publicProcesses)[0];
    if (hit && hit.score >= 4) process = hit.process;
  }

  // 3. Generic glossary questions work without a process
  const term = Object.keys(glossary).find((t) => lower.includes(t));
  if (term && has(lower, /\b(mean|meaning|what is|what's|what are|explain|define)\b/)) {
    return {
      grounding: "verified",
      redacted,
      blocks: [
        { type: "p", text: `**${cap(term)}** — ${glossary[term]}` },
        ...(process ? [{ type: "note" as const, text: `For exact requirements in “${process.title}”, check the official source below.` }] : []),
      ],
      sources: process ? srcs(process) : [],
      suggestions: suggestionsFor(process, journey),
    };
  }

  if (!process) {
    return {
      grounding: "not_found",
      redacted,
      blocks: [
        { type: "p", text: "I couldn't match that to a process I have verified guidance for." },
        { type: "p", text: "Try naming the document or service — for example “passport renewal”, “Aadhaar address” or “income certificate”. You can also browse all guides." },
      ],
      sources: [{ label: "Browse all FormEase guides", url: "/search" }],
      suggestions: suggestionsFor(),
    };
  }

  const answers = journey?.answers ?? {};
  const steps = journey ? applicableSteps(process, answers) : process.steps;
  const docs = journey ? applicableDocuments(process, answers) : process.documents;
  const personal = journey ? " (based on your answers)" : "";
  const base = { redacted, suggestions: suggestionsFor(process, journey) };

  // 4. Rejection / returned application help
  if (has(lower, /\b(reject|rejected|returned|sent back|objection|on hold|adverse|deficien|not approved|refused)\b/) || q.length > 180) {
    const matches = rejectionPatterns.filter((r) => r.match.test(q));
    const blocks: Block[] = [];
    if (matches.length) {
      blocks.push({ type: "p", text: `From what you've shared, this **may** relate to: ${matches.map((m) => m.label.toLowerCase()).join("; ")}. Only the issuing office can confirm the exact reason.` });
      for (const m of matches.slice(0, 2)) {
        blocks.push({ type: "p", text: `**${m.label}.** ${m.explain}` });
        blocks.push({ type: "ul", items: m.fix });
      }
    } else {
      blocks.push({ type: "p", text: "I couldn't identify a specific reason from the message. Look for words like “mismatch”, “missing”, “not clear” or “address” in the official notice — or paste the reason line (remove any ID numbers first)." });
    }
    const grievance = process.links.find((l) => l.purpose === "grievance" || l.purpose === "status");
    blocks.push({ type: "note", text: `Next: fix the issue, then resubmit through the official channel${grievance ? ` (${grievance.label})` : ""}. ${journey ? "You can mark this journey as “Needs attention” from the Status help panel." : ""}` });
    return { ...base, grounding: matches.length ? "verified" : "general", blocks, sources: srcs(process, ["status", "grievance", "apply"]) };
  }

  // 5. Guarantees
  if (has(lower, /\b(guarantee|guaranteed|will (it|i|my) .* (approved|accepted)|definitely|for sure)\b/)) {
    return {
      ...base,
      grounding: "general",
      blocks: [
        { type: "p", text: "Nobody outside the issuing office can guarantee approval or an exact processing time — including FormEase." },
        { type: "p", text: "What you *can* control: submit every required document, make sure details match across documents, and respond quickly to any request." },
      ],
      sources: srcs(process),
    };
  }

  // 6. What next?
  if (has(lower, /\b(next|now what|what (should|do) i do|after (this|that)|i('ve| have)? (completed|finished|done)|then what|where do i start|first step)\b/)) {
    if (journey) {
      const view = buildJourneyView(process, journey);
      const n = view.nextStep;
      if (!n) {
        return { ...base, grounding: "verified", blocks: [{ type: "p", text: "You've completed every step in this journey. 🎉 Keep your reference numbers and received documents safe." }], sources: srcs(process) };
      }
      return {
        ...base,
        grounding: "verified",
        blocks: [
          { type: "p", text: `Your next step is **${n.title}**${personal}.` },
          { type: "p", text: n.action },
          ...(n.details?.length ? [{ type: "ul" as const, items: n.details }] : []),
          ...(n.warnings?.length ? [{ type: "note" as const, text: n.warnings[0] }] : []),
        ],
        sources: srcs(process, n.linkIds?.length ? undefined : ["apply"]),
      };
    }
    return {
      ...base,
      grounding: "verified",
      blocks: [
        { type: "p", text: `Here's the overall order for **${process.title}**:` },
        { type: "ul", items: steps.map((s, i) => `${i + 1}. ${s.title} — ${s.summary}`) },
        { type: "note", text: "Start a guided journey to get a roadmap personalised to your situation." },
      ],
      sources: srcs(process),
    };
  }

  // 7. Alternatives / can I use X
  if (has(lower, /\b(instead|alternative|other proof|different proof|can i use|is .* accepted|accept)\b/)) {
    const withAlts = docs.filter((d) => d.alternatives?.length);
    const tokens = tokenize(stripPlaceholders(q)).filter((t) => t.length > 3 && !["instead", "accepted", "accept", "alternative", "different", "other", "proof", "document"].includes(t));
    const hits = (text: string) => tokens.filter((t) => text.toLowerCase().includes(t)).length;
    // Prefer the document whose alternatives best match what the user named, then by document name.
    const scored = withAlts
      .map((d) => ({ d, alt: Math.max(0, ...d.alternatives!.map(hits)), name: hits(d.name) }))
      .sort((a, b) => b.alt - a.alt || b.name - a.name);
    const target = scored[0]?.d;
    if (target) {
      const best = target.alternatives!.map((a) => ({ a, s: hits(a) })).sort((x, y) => y.s - x.s)[0];
      const named = best && best.s > 0 ? best.a : undefined;
      return {
        ...base,
        grounding: "verified",
        blocks: [
          named
            ? { type: "p", text: `Yes — **${named}** is on the verified list for “${target.name}”.` }
            : { type: "p", text: `For **${target.name}**, the verified list includes any one of:` },
          { type: "ul", items: target.alternatives! },
          { type: "note", text: named ? "Make sure it is in your name and current." : "If your document isn't listed, I can't confirm it's accepted — check the official list or ask the office." },
        ],
        sources: srcs(process, ["info", "apply"]),
      };
    }
  }

  // 8. Documents
  if (has(lower, /\b(document|documents|papers|proof|prepare|bring|carry|checklist|need to submit)\b/)) {
    const required = docs.filter((d) => d.kind !== "optional");
    const firstStepDocs = steps.flatMap((s) => s.documents ?? []);
    const first = required.slice().sort((a, b) => idx(firstStepDocs, a.id) - idx(firstStepDocs, b.id))[0];
    return {
      ...base,
      grounding: "verified",
      blocks: [
        ...(first && has(lower, /\bfirst\b/) ? [{ type: "p" as const, text: `Start with **${first.name}** — it's needed earliest in the process. ${first.why}` }] : []),
        { type: "p", text: `Documents you'll need${personal}:` },
        { type: "ul", items: required.map((d) => `${d.name}${d.kind === "conditional" ? " (applies to your situation)" : ""} — ${d.why}`) },
        ...(docs.some((d) => d.kind === "optional") ? [{ type: "note" as const, text: `Optional: ${docs.filter((d) => d.kind === "optional").map((d) => d.name).join(", ")}.` }] : []),
      ],
      sources: srcs(process),
    };
  }

  // 9. Office visit
  if (has(lower, /\b(visit|office|in person|in-person|go to|physically|kendra|centre|center|rto|tehsil)\b/)) {
    const offline = steps.filter((s) => s.mode !== "online");
    return {
      ...base,
      grounding: "verified",
      blocks: [
        { type: "p", text: process.inPerson },
        ...(offline.length ? [{ type: "p" as const, text: "Steps that may involve a visit:" }, { type: "ul" as const, items: offline.map((s) => `${s.title}${s.mode === "either" ? " (online or in person)" : ""}`) }] : []),
      ],
      sources: srcs(process, ["locate", "appointment", "apply"]),
    };
  }

  // 10. Fees
  if (has(lower, /\b(fee|fees|cost|costs|charge|charges|price|pay|how much|amount|rupees|rs|₹)\b/)) {
    return {
      ...base,
      grounding: process.fees.length ? "verified" : "not_found",
      blocks: process.fees.length
        ? [
            { type: "p", text: "Government fees on record:" },
            { type: "ul", items: process.fees.map((f) => `${f.label}: ${f.amount}${f.note ? ` — ${f.note}` : ""}`) },
            ...(process.feeNote ? [{ type: "note" as const, text: process.feeNote }] : []),
          ]
        : [{ type: "p", text: "I don't have a verified fee for this process. Check the official portal before paying." }],
      sources: srcs(process, ["fees", "apply"]),
    };
  }

  // 11. Time
  if (has(lower, /\b(how long|time|days|weeks|months|when will|processing|delay|delayed)\b/)) {
    return {
      ...base,
      grounding: process.times.length ? "verified" : "not_found",
      blocks: [
        ...(process.times.length
          ? [{ type: "ul" as const, items: process.times.map((t) => `${t.label}: ${t.value} (${t.kind === "official" ? "official" : "FormEase estimate"})`) }]
          : [{ type: "p" as const, text: "There's no verified time estimate for this process." }]),
        { type: "note", text: "Estimates are not commitments. Actual time depends on the office, verification and your documents." },
      ],
      sources: srcs(process, ["status", "apply"]),
    };
  }

  // 12. Status term meaning
  const statusTerms = [...(process.statusTerms ?? []), ...commonStatusTerms];
  const st = statusTerms.find((s) => s.term.toLowerCase().split(/[\/—-]/).some((part) => part.trim().length > 3 && lower.includes(part.trim())));
  if (st) {
    return {
      ...base,
      grounding: "verified",
      blocks: [
        { type: "p", text: `**${st.term}** — ${st.meaning}` },
        { type: "p", text: `What to do: ${st.next}` },
      ],
      sources: srcs(process, ["status"]),
    };
  }

  // 13. Best-match retrieval across the complete curated guide.
  const tokens = tokenize(lower);
  type Chunk = { text: string; title: string; score: number };
  const chunks: Chunk[] = [
    ...process.faqs.map((f) => ({ title: f.q, text: f.a, score: 0 })),
    ...steps.map((s) => ({ title: s.title, text: `${s.summary} ${s.action} ${(s.details ?? []).join(" ")} ${(s.warnings ?? []).join(" ")}`, score: 0 })),
    ...docs.map((d) => ({ title: d.name, text: `${d.why} ${d.format ?? ""}`, score: 0 })),
    ...process.prerequisites.map((text) => ({ title: "Before you start", text, score: 0 })),
    ...process.mistakes.map((text) => ({ title: "Common mistake to avoid", text, score: 0 })),
    ...process.tips.map((text) => ({ title: "Practical tip", text, score: 0 })),
  ];
  for (const c of chunks) {
    const hay = `${c.title} ${c.text}`.toLowerCase();
    c.score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? (c.title.toLowerCase().includes(t) ? 2 : 1) : 0), 0);
  }
  const best = chunks.sort((a, b) => b.score - a.score)[0];
  if (best && best.score >= 2) {
    return {
      ...base,
      grounding: "verified",
      blocks: [
        { type: "p", text: `**${best.title}**` },
        { type: "p", text: best.text },
      ],
      sources: srcs(process),
    };
  }

  return {
    ...base,
    grounding: "not_found",
    blocks: [
      { type: "p", text: `I can't verify an answer to that from FormEase's checked content for “${process.title}”, so I won't guess.` },
      { type: "p", text: "The official source below is the authority. For legal or high-stakes situations, consider asking the issuing office directly or a qualified professional." },
    ],
    sources: srcs(process),
  };
}

const idx = (arr: string[], id: string) => {
  const i = arr.indexOf(id);
  return i === -1 ? 999 : i;
};
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
