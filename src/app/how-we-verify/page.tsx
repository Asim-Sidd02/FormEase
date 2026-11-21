import type { Metadata } from "next";
import { BadgeCheck, CalendarClock, FileSearch, Flag, History, Link2, PenLine, Send, ShieldCheck } from "lucide-react";
import { PageHero, Prose } from "@/components/prose-page";
import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "How we verify information" };

const flow = [
  { icon: PenLine, t: "Drafted from official sources", d: "An author writes each guide using official portals, notifications and forms — never forums or hearsay." },
  { icon: FileSearch, t: "Independently reviewed", d: "A second person checks accuracy, completeness and whether rules apply nationwide or only in some states." },
  { icon: Link2, t: "Links & key details tested", d: "Every official link is opened, and fees, timelines and conditional requirements are checked against the source." },
  { icon: Send, t: "Approved and published", d: "Only approved guides go live, showing their last-verified date and sources." },
  { icon: CalendarClock, t: "Scheduled re-checks", d: "Each guide gets a review date. Overdue guides are clearly labelled until re-verified." },
  { icon: Flag, t: "Rechecked on reports", d: "User reports and detected official changes trigger review — changes are never auto-published." },
  { icon: History, t: "Every version kept", d: "We retain change history internally so every update is auditable." },
];

export default function HowWeVerify() {
  return (
    <>
      <PageHero eyebrow="Trust & transparency" title="How we verify information" desc="Trust is the whole point. Here's exactly how a guide gets onto FormEase — and how we tell you what we're sure of." />
      <div className="container-page max-w-3xl py-12">
        <ol className="relative space-y-4 border-l-2 border-line pl-8">
          {flow.map((f) => (
            <li key={f.t} className="relative">
              <span className="absolute -left-[49px] grid size-8 place-items-center rounded-full border-2 border-brand bg-surface text-brand">
                <f.icon className="size-4" aria-hidden />
              </span>
              <h2 className="font-bold">{f.t}</h2>
              <p className="mt-0.5 text-sm text-muted">{f.d}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-14 font-display text-2xl font-semibold">How to read our labels</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { b: <Badge tone="brand" icon={<BadgeCheck className="size-3" />}>Verified 28 Oct 2026</Badge>, d: "Checked against official sources on this date." },
            { b: <Badge tone="warning">Review due</Badge>, d: "Past its scheduled re-check. Probably still useful — confirm key details officially." },
            { b: <Badge tone="brand">Official</Badge>, d: "A time or fee published by the issuing authority." },
            { b: <Badge tone="warning">Estimate</Badge>, d: "FormEase's research-based estimate. Not a commitment." },
            { b: <Badge tone="info">Depends on your situation</Badge>, d: "Applies only for certain answers — your journey shows if it applies to you." },
            { b: <Badge tone="neutral">Varies by state</Badge>, d: "Rules differ by state or UT. Never read as a nationwide rule." },
          ].map((x, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-4">
              <dt>{x.b}</dt>
              <dd className="mt-2 text-sm text-muted">{x.d}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Prose>
        <h2>Our assistant follows the same rules</h2>
        <p>
          The FormEase assistant answers only from published, verified guides. It shows sources for factual claims, refuses to invent eligibility rules, fees, documents or links, and tells you plainly when it can&apos;t verify an answer. It will never help create or alter documents.
        </p>
        <h2>When we get it wrong</h2>
        <p>
          Rules change, sometimes overnight. Every page has a <strong>Report an issue</strong> button. Reports go straight to our editorial queue, and we can let you know when it&apos;s fixed.
        </p>
        <p className="flex items-start gap-2 rounded-2xl border border-line bg-surface p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
          <span>Whatever we say, the official portal is always the final authority.</span>
        </p>
      </Prose>
    </>
  );
}
