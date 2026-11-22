import "server-only";
import { parse, type HTMLElement } from "node-html-parser";
import { createHash } from "node:crypto";
import type { ExtractedFact, OfficialLinkFound, OfficialSection } from "./types";

/* ------------------------------------------------------------------ */
/*  Turns an official page into clean text blocks, sections and facts. */
/*  Facts always keep the official sentence verbatim (no paraphrase).  */
/* ------------------------------------------------------------------ */

export interface Extraction {
  title?: string;
  blocks: string[];
  sections: { heading: string; blocks: string[] }[];
  links: OfficialLinkFound[];
}

const NOISE = /(skip to (main )?content|screen reader|visitor(s)? (count|no)|last (updated|reviewed)|website (content )?(managed|designed|hosted)|copyright|©|all rights reserved|font size|a\+|a-|toggle navigation|javascript|cookie|hit counter|sitemap|feedback form)/i;
const BLOCK_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,tr,dt,dd,caption,blockquote,summary,label";
const STRIP_SELECTOR = "script,style,noscript,svg,iframe,nav,header,footer,form,select,button,[role=navigation],[role=banner],[role=contentinfo],[aria-hidden=true],.navbar,.menu,.breadcrumb,.footer,.header,#header,#footer,.skip-link,.social,.share," +
  // sidebars, carousels and tickers rotate on every load and would trigger false "changed" alerts
  "aside,marquee,[aria-roledescription=slide],[aria-roledescription=carousel],[class*=carousel],[class*=swiper],[class*=slick],[class*=marquee],[class*=ticker],[class*=owl-]";

const clean = (s: string) =>
  s
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8377;|&#x20b9;/gi, "₹")
    .replace(/\s+/g, " ")
    .trim();

export function extractHtml(html: string, baseUrl: string): Extraction {
  const root = parse(html, { comment: false, blockTextElements: { script: false, style: false, noscript: false, pre: true } });
  const title = clean(root.querySelector("title")?.text ?? "") || undefined;
  const links = collectLinks(root, baseUrl);

  root.querySelectorAll(STRIP_SELECTOR).forEach((el) => el.remove());
  const main =
    root.querySelector("main") ?? root.querySelector("article") ?? root.querySelector("#main-content") ?? root.querySelector("#content") ?? root.querySelector(".content") ?? root.querySelector("#main") ?? root.querySelector("body") ?? root;

  const seen = new Set<string>();
  const sections: Extraction["sections"] = [{ heading: title ?? "Overview", blocks: [] }];
  const blocks: string[] = [];

  for (const el of main.querySelectorAll(BLOCK_SELECTOR)) {
    const tag = el.tagName.toLowerCase();
    // avoid double counting: skip containers whose children are blocks themselves
    if ((tag === "li" || tag === "dd" || tag === "blockquote") && el.querySelector("p,li,tr,table")) continue;
    let text = tag === "tr" ? clean(el.querySelectorAll("th,td").map((c) => clean(c.text)).filter(Boolean).join(" | ")) : clean(el.text);
    if (!text || text.length < 3 || text.length > 2000 || NOISE.test(text) && text.length < 160) continue;
    if (/^h[1-6]$/.test(tag)) {
      if (text.length <= 140) sections.push({ heading: text, blocks: [] });
      continue;
    }
    if (tag === "label" && text.length < 25) continue;
    text = text.slice(0, 1200);
    if (seen.has(text)) continue;
    seen.add(text);
    blocks.push(text);
    sections[sections.length - 1].blocks.push(text);
  }

  // Div-heavy pages with few semantic tags: fall back to text lines
  if (blocks.join(" ").length < 300) {
    for (const line of main.structuredText.split(/\n+/).map(clean)) {
      if (line.length < 12 || line.length > 1200 || NOISE.test(line) || seen.has(line)) continue;
      seen.add(line);
      blocks.push(line);
      sections[sections.length - 1].blocks.push(line);
    }
  }

  return { title, blocks, sections: sections.filter((s) => s.blocks.length), links };
}

export async function extractPdf(buf: Buffer, url: string): Promise<Extraction> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  const lines = String(text)
    .split(/\n|(?<=[.;:])\s{2,}/)
    .map(clean)
    .filter((l) => l.length >= 4 && !NOISE.test(l));
  // merge short wrapped lines into readable blocks
  const blocks: string[] = [];
  for (const l of lines) {
    const last = blocks[blocks.length - 1];
    if (last && last.length < 160 && !/[.:;]$/.test(last) && !/^(\d+[.)]|[•\-–])/.test(l)) blocks[blocks.length - 1] = `${last} ${l}`;
    else blocks.push(l);
  }
  const uniq = [...new Set(blocks)].slice(0, 600);
  return { title: decodeURIComponent(url.split(/[/=]/).pop() ?? "Official document"), blocks: uniq, sections: [{ heading: "Document", blocks: uniq }], links: [] };
}

/** Links that are about the department, not the citizen process. */
const LINK_NOISE = /vacanc|tender|recruit|rfp|ldce|cadre|circular for the post|office order|policy|survey|forms.gle|annual report|budget|rti|award|banner/i;
const GENERIC_LABEL = /^(know more|click here|download|view|read more|here|more|pdf)$/i;

function fileLabel(url: string) {
  const name = decodeURIComponent(url.split(/[/=]/).pop() ?? "").replace(/.(pdf|docx?)$/i, "").replace(/[_-]+/g, " ").trim();
  return name.length > 3 ? name : undefined;
}

function collectLinks(root: HTMLElement, baseUrl: string): OfficialLinkFound[] {
  const out = new Map<string, OfficialLinkFound>();
  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    if (!href || href.startsWith("#") || /^(javascript|mailto|tel):/i.test(href)) continue;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    let label = clean(a.text || a.getAttribute("title") || "");
    if (GENERIC_LABEL.test(label)) label = fileLabel(abs) ?? label;
    if (label.length < 3 || label.length > 200 || LINK_NOISE.test(`${label} ${abs}`)) continue;
    const kind: OfficialLinkFound["kind"] = /\.pdf($|\?)|downloadfile/i.test(abs) ? "pdf" : /\b(form|annexure|application|proforma|affidavit|declaration)\b/i.test(label) ? "form" : "page";
    if (kind === "page") continue; // keep only downloadable documents and forms
    const key = `${abs}|${label}`;
    if (!out.has(key)) out.set(key, { label, url: abs, kind });
  }
  return [...out.values()].slice(0, 25);
}

/* ---------------------------- hashing & diff ---------------------------- */

/** Ignore volatile lines (dates, counters) so cosmetic changes don't trigger review. */
const VOLATILE =
  /(visitor|hits?:|last (updated|modified|reviewed)|updated on|uploaded on|as on \d|\b\d{1,2}[:.]\d{2}(:\d{2})?\s?(am|pm)\b|(monday|tuesday|wednesday|thursday|friday|saturday|sunday), \w+ \d{1,2}, \d{4}|copyright|©|statistics from)/i;

export function contentHash(blocks: string[]) {
  const normalised = blocks.filter((b) => !VOLATILE.test(b)).map((b) => b.toLowerCase()).join("\n");
  return createHash("sha256").update(normalised).digest("hex").slice(0, 32);
}

export function diffBlocks(before: string[] = [], after: string[] = []) {
  const a = new Set(before.filter((b) => !VOLATILE.test(b)));
  const b = new Set(after.filter((x) => !VOLATILE.test(x)));
  return {
    added: [...b].filter((x) => !a.has(x)).slice(0, 25),
    removed: [...a].filter((x) => !b.has(x)).slice(0, 25),
  };
}

/* ---------------------------- facts ---------------------------- */

// Indian grouping (1,00,000) needs at least one comma group; otherwise take all digits (so "Rs.1017" ≠ "₹101").
const FEE_RE = /(?:₹|\bRs\.?|\bINR)\s?((?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{1,2})?)\s*(?:\/-)?/gi;
const FEE_CONTEXT = /\b(fee|fees|charge|charges|cost|payable|amount|paid|pay|price|application|apply|card)\b/i;
const TIME_RE = /\b(\d{1,3})(?:\s*(?:to|-|–)\s*(\d{1,3}))?\s*(working\s+|business\s+|calendar\s+)?(days?|weeks?|months?)\b/i;
const TIME_CONTEXT = /\b(within|process|processed|issued|issue|deliver|dispatch|valid|validity|takes?|completed|disposal|timeline|time limit)\b/i;
const DOC_TERMS = /\b(proof of (identity|address|date of birth|birth|residence)|poi|poa|certificate|passbook|bill|affidavit|photograph|photo|aadhaar|pan card|passport|ration card|voter (id|identity)|driving licen[cs]e|marksheet|matriculation|rent agreement|documents?)\b/i;
const DOC_CONTEXT = /\b(required|accepted|valid|submit|upload|attach|following|any one|list of|supporting|enclose|furnish|original|self[- ]attested|copy|copies)\b/i;

function excerpt(text: string, max = 260) {
  return text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export function extractFacts(ex: Extraction, url: string): ExtractedFact[] {
  const fees: ExtractedFact[] = [];
  const times: ExtractedFact[] = [];
  const docs: ExtractedFact[] = [];
  const docHeading = /document|proof|supporting|annexure|checklist/i;

  for (const s of ex.sections) {
    const underDocHeading = docHeading.test(s.heading);
    for (const b of s.blocks) {
      const feeMatches = [...b.matchAll(FEE_RE)];
      if (feeMatches.length && (FEE_CONTEXT.test(b) || FEE_CONTEXT.test(s.heading))) {
        const value = feeMatches.map((m) => `₹${m[1]}`).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4).join(" / ");
        fees.push({ type: "fee", value, text: excerpt(b, 300) });
      }
      const t = b.match(TIME_RE);
      if (t && TIME_CONTEXT.test(b) && !FEE_RE.test(b)) times.push({ type: "time", value: t[0], text: excerpt(b) });
      FEE_RE.lastIndex = 0;
      if (b.length >= 12 && b.length <= 320 && !/\?\s*$/.test(b) && DOC_TERMS.test(b) && (underDocHeading || DOC_CONTEXT.test(b))) docs.push({ type: "document", text: b });
    }
  }
  for (const l of ex.links) {
    const m = [...l.label.matchAll(FEE_RE)];
    if (m.length && FEE_CONTEXT.test(l.label)) fees.push({ type: "fee", value: m.map((x) => `₹${x[1]}`).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).join(" / "), text: excerpt(l.label, 300), url: l.url });
  }
  const forms: ExtractedFact[] = ex.links.map((l) => ({ type: "form", value: l.kind === "pdf" ? "PDF" : "Form", text: l.label, url: l.url }));
  const uniq = (list: ExtractedFact[], n: number) => list.filter((f, i) => list.findIndex((x) => x.text === f.text) === i).slice(0, n);
  return [...uniq(fees, 12), ...uniq(times, 8), ...uniq(docs, 15), ...uniq(forms, 12)].map((f) => ({ ...f, url: f.url ?? url }));
}

/* ---------------------------- relevance ---------------------------- */

export function topSections(ex: Extraction, terms: string[], limit = 6): OfficialSection[] {
  const t = terms.map((x) => x.toLowerCase()).filter((x) => x.length > 2);
  const scored = ex.sections.map((s, i) => {
    const text = s.blocks.join(" ");
    const lower = `${s.heading} ${text}`.toLowerCase();
    const score = t.reduce((acc, term) => acc + (lower.includes(term) ? (s.heading.toLowerCase().includes(term) ? 3 : 1) : 0), 0) + (FEE_RE.test(text) ? 1 : 0);
    FEE_RE.lastIndex = 0;
    return { i, heading: s.heading, text: excerpt(text, 900), score };
  });
  return scored
    .filter((s) => s.score > 0 && s.text.length > 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .sort((a, b) => a.i - b.i)
    .map(({ heading, text }) => ({ heading, text }));
}
