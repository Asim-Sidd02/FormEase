import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Sparkles } from "lucide-react";
import { PageHero } from "@/components/prose-page";
import { Disclosure } from "@/components/ui";
import { buttonClass } from "@/components/styles";

export const metadata: Metadata = { title: "Help & FAQ" };

const groups = [
  {
    title: "Getting started",
    items: [
      { q: "Do I need an account?", a: "No. You can search, read guides, use the wizard and get a full roadmap as a guest. Sign in only when you want to save your journey to your account, sync across devices or get email reminders." },
      { q: "Is FormEase free?", a: "Yes — process information, roadmaps, checklists and official links are free. Government fees are paid only on official portals and never to FormEase." },
      { q: "Can FormEase submit my application for me?", a: "No. Applications, payments and final submissions happen only on official portals or at official offices. We guide you there." },
    ],
  },
  {
    title: "Accuracy & trust",
    items: [
      { q: "How do I know the information is correct?", a: "Each guide is drafted from official sources, reviewed by a second person and shows its last-verified date. Rules can change, so the official portal is always the final authority." },
      { q: "Are you a government website?", a: "No. FormEase is independent and not affiliated with any government body." },
      { q: "Can you guarantee my application will be approved?", a: "No one outside the issuing office can. We help you avoid common mistakes, but approval, eligibility and timelines are decided by the authority." },
      { q: "I found something wrong. What should I do?", a: "Use “Report an issue” on the page, or the report form. Our editorial team reviews every report." },
    ],
  },
  {
    title: "Privacy",
    items: [
      { q: "Do I need to upload my documents?", a: "Never. The checklist lets you mark that a document is ready — we never ask for or store the documents themselves." },
      { q: "What should I avoid sharing with the assistant?", a: "Don't share Aadhaar, PAN, passport or application numbers, bank details, OTPs or passwords. If you paste them by accident, we try to remove ID-like numbers automatically." },
      { q: "How do I delete my data?", a: "Go to Account & privacy → Your data. You can export everything or permanently delete your account." },
    ],
  },
  {
    title: "Journeys & reminders",
    items: [
      { q: "What if my situation changes?", a: "Open your journey and choose “Edit answers”. Your roadmap rebuilds; progress on steps that still apply is kept, and we warn you if something may no longer apply." },
      { q: "Can FormEase see my application status?", a: "No. We don't connect to government systems. You update your step status yourself, and reminders are based on dates you enter." },
      { q: "My application was returned. Can you help?", a: "Yes — open your journey and choose “Application status help”. Paste the reason (without ID numbers) to understand what it may mean and how to prepare a resubmission." },
    ],
  },
];

export default function Help() {
  return (
    <>
      <PageHero eyebrow="Help" title="Help & frequently asked questions" desc="Quick answers about how FormEase works. For questions about a specific process, open its guide or ask the assistant." />
      <div className="container-page max-w-3xl py-12">
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.title} aria-labelledby={`h-${g.title.replace(/\W+/g, "-")}`}>
              <h2 id={`h-${g.title.replace(/\W+/g, "-")}`} className="mb-4 font-display text-2xl font-semibold">{g.title}</h2>
              <div className="space-y-2">
                {g.items.map((i) => (
                  <Disclosure key={i.q} summary={i.q}>{i.a}</Disclosure>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <Sparkles className="size-5 text-brand" />
            <h2 className="mt-2 font-bold">Ask about a process</h2>
            <p className="mt-1 text-sm text-muted">Get plain-language answers from verified guides.</p>
            <Link href="/assistant" className={buttonClass("outline", "sm", "mt-3")}>Open assistant</Link>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <Flag className="size-5 text-brand" />
            <h2 className="mt-2 font-bold">Report a problem</h2>
            <p className="mt-1 text-sm text-muted">Outdated info, broken link or something unclear?</p>
            <Link href="/report" className={buttonClass("outline", "sm", "mt-3")}>Report an issue</Link>
          </div>
        </div>
      </div>
    </>
  );
}
