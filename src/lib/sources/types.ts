/* Types for the official-source sync pipeline (spec §8.2 verification workflow, §20 quality). */

/** html = server-rendered page · pdf = official document · spa = JavaScript app, needs a headless browser */
export type SourceKind = "html" | "pdf" | "spa";
export type SourceTopic = "fees" | "documents" | "steps" | "eligibility" | "timelines" | "forms" | "faq" | "directory";

export interface TrackedSource {
  id: string;
  /** Processes this official page informs. */
  processes: string[];
  url: string;
  title: string;
  org: string;
  kind: SourceKind;
  topics: SourceTopic[];
  /** Extra terms used to pick the relevant passages on a long page. */
  focus?: string[];
}

/**
 * ok            — fetched, matches the version our editors last reviewed
 * changed       — fetched, the official page differs from the reviewed version
 * unreachable   — couldn't fetch (timeout, DNS, blocked); showing the last good copy if any
 * needs_browser — JavaScript-only page and no headless browser is configured
 * error         — fetched but nothing usable could be extracted
 */
export type SyncStatus = "ok" | "changed" | "unreachable" | "needs_browser" | "error";

export type FactType = "fee" | "time" | "document" | "form";

export interface ExtractedFact {
  type: FactType;
  /** Normalised value, e.g. "₹1,500" or "30 days". */
  value?: string;
  /** The official sentence it came from — shown verbatim, never paraphrased. */
  text: string;
  url?: string;
}

export interface OfficialSection {
  heading: string;
  text: string;
}

export interface OfficialLinkFound {
  label: string;
  url: string;
  kind: "pdf" | "form" | "page";
}

/** What the client receives. */
export interface SourceSnapshot {
  sourceId: string;
  url: string;
  finalUrl?: string;
  /** Our readable name for the page (from the registry). */
  title?: string;
  /** The page's own <title>, as published. */
  pageTitle?: string;
  org: string;
  kind: SourceKind;
  method?: "http" | "browser" | "pdf";
  status: SyncStatus;
  httpStatus?: number;
  /** Last successful fetch. */
  fetchedAt?: string;
  /** Last attempt (successful or not). */
  attemptedAt?: string;
  lastModified?: string;
  contentHash?: string;
  baselineHash?: string;
  baselineAt?: string;
  baselineBy?: string;
  changedAt?: string;
  textLength?: number;
  sections: OfficialSection[];
  facts: ExtractedFact[];
  links: OfficialLinkFound[];
  diff?: { added: string[]; removed: string[] };
  error?: string;
}

/** Stored on the server only — includes the full text blocks used for diffing and assistant retrieval. */
export interface StoredSnapshot extends SourceSnapshot {
  blocks: string[];
  baselineBlocks?: string[];
  history: { at: string; hash: string }[];
  /** Blocks learned to rotate (carousels, tickers) — ignored when comparing. */
  volatileBlocks?: string[];
  /** A difference seen once; becomes `changed` only if seen again on the next sync. */
  pendingHash?: string;
}

export interface OfficialPassage {
  sourceId: string;
  org: string;
  title?: string;
  url: string;
  fetchedAt?: string;
  heading?: string;
  text: string;
  score: number;
}
