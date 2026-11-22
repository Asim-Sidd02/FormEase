import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, ClipboardCheck, Compass, Footprints, LifeBuoy, MessageCircleQuestion, SlidersHorizontal } from "lucide-react";
import { PageHero } from "@/components/prose-page";
import { buttonClass } from "@/components/styles";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  { icon: Compass, title: "Find your process", desc: "Search the way you'd ask a friend — “my passport expires next month” or “I moved house”. We match everyday words to the right official process.", detail: ["Natural-language search with synonyms", "Browse by category", "Each guide shows complexity, coverage and last-verified date"] },
  { icon: SlidersHorizontal, title: "Answer a few questions", desc: "A short wizard asks only what changes your steps — who it's for, how urgent, which state. Each question explains why it's asked.", detail: ["One question at a time, easy to go back", "Never asks for ID numbers", "Review all answers before we build your plan"] },
  { icon: ClipboardCheck, title: "Prepare your documents", desc: "Your checklist separates required, situation-specific and optional documents — with every accepted alternative.", detail: ["Tick off what you have — no uploads", "See which steps you're ready for", "Add your own items and notes"] },
  { icon: Footprints, title: "Follow your roadmap", desc: "Work through ordered steps. We highlight the next action, respect dependencies and track progress until you're done.", detail: ["Clear status for every step", "Official links right where you need them", "Save, resume and sync across devices"] },
];

export default function HowItWorks() {
  return (
    <>
      <PageHero eyebrow="How it works" title="From “where do I start?” to done." desc="FormEase turns official rules into a personal plan — then helps you see it through." />
      <div className="container-page max-w-4xl py-12">
        <ol className="space-y-6">
          {steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-1 gap-5 rounded-3xl border border-line bg-surface p-6 shadow-soft sm:grid-cols-[auto_1fr] sm:p-8">
              <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                <span className="grid size-14 place-items-center rounded-2xl bg-brand text-brand-fg">
                  <s.icon className="size-6" aria-hidden />
                </span>
                <span className="font-display text-sm font-semibold text-subtle">Step {i + 1}</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
                <p className="mt-2 text-muted">{s.desc}</p>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {s.detail.map((d) => (
                    <li key={d} className="rounded-xl bg-surface-2/70 px-3 py-2 text-sm font-medium">{d}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-16 font-display text-2xl font-semibold">And when you need a hand</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: MessageCircleQuestion, t: "Ask the assistant", d: "Plain-language answers grounded in verified guides, with sources. It says so when it can't verify something." },
            { icon: LifeBuoy, t: "Status & rejection help", d: "Paste a returned-application reason to understand what it may mean and prepare a resubmission." },
            { icon: Bell, t: "Reminders you control", d: "For appointments, expiry dates or pending steps. Email or in-app, edit or snooze any time." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-line bg-surface p-5">
              <f.icon className="size-5 text-brand" />
              <h3 className="mt-3 font-bold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/search" className={buttonClass("primary", "lg")}>
            Try it now — no sign-up needed <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
