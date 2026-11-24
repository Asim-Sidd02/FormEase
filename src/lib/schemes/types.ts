export interface Scheme {
  slug: string;
  name: string;
  ministry: string;
  summary: string;
  /** YYYY-MM-DD */
  launchedOn?: string;
  /** YYYY-MM-DD — last date to apply, if any. */
  deadline?: string;
  benefits: string[];
  eligibility: string[];
  documents: string[];
  steps: string[];
  fees?: string;
  officialUrl: string;
  applyUrl?: string;
  helpline?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  /** YYYY-MM-DD — when an editor last checked it against the official source. */
  verifiedOn?: string;
}

export interface SchemeRequest {
  id: string;
  name: string;
  notes: string[];
  count: number;
  status: "open" | "done" | "dismissed";
  firstAt: string;
  lastAt: string;
}

export interface Announcement {
  title: string;
  url: string;
  /** When FormEase first saw it in PIB's feed (the feed carries no dates). */
  seenAt: string;
}
