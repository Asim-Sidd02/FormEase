import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  CircleDot,
  ClipboardCheck,
  Compass,
  EyeOff,
  FileCheck2,
  Footprints,
  LifeBuoy,
  Link2,
  ListChecks,
  MessageCircleQuestion,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { ProcessCard } from "@/components/process-card";
import { Icon } from "@/components/icon";
import { SectionTitle } from "@/components/ui";
import { buttonClass } from "@/components/styles";
import { ContinueBanner } from "@/components/continue-banner";
import { categories } from "@/content/categories";
import { getProcess, POPULAR, publicProcesses } from "@/content/processes";

export default function Home() {
  const popular = POPULAR.map(getProcess).filter(Boolean).slice(0, 6) as NonNullable<ReturnType<typeof getProcess>>[];
  return (
    <>
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative overflow-hidden">
        <div className="dotgrid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="container-page relative grid items-center gap-12 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-20">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[13px] font-semibold text-muted shadow-soft backdrop-blur">
              <span className="flex size-2 rounded-full bg-brand" aria-hidden />
              Independent · Plain-language · Source-backed
            </p>
            <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[56px] lg:text-[64px]">
              What do you need help <span className="relative whitespace-nowrap text-brand">
                getting done
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 9 C 80 2, 200 2, 298 7" stroke="var(--accent)" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              ?
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Passports, Aadhaar, PAN, licences, certificates — FormEase turns confusing official processes into a clear, personalised list of steps. You always know what to do next.
            </p>
            <div className="mt-8 max-w-2xl">
              <HeroSearch />
            </div>
            <ContinueBanner />
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* ------------------------------ Popular ------------------------------ */}
      <section className="container-page" aria-labelledby="popular">
        <SectionTitle
          id="popular"
          eyebrow="Popular right now"
          title="Start with the most-asked processes"
          action={
            <Link href="/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              All {publicProcesses.length} guides <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((p, i) => (
            <ProcessCard key={p.slug} p={p} className="animate-fade-up" />
          ))}
        </div>
      </section>

      {/* ------------------------------ How it works ------------------------------ */}
      <section className="container-page mt-24" aria-labelledby="how">
        <SectionTitle id="how" eyebrow="How FormEase works" title="Four steps from confused to confident" desc="No jargon, no guesswork. Answer a few questions and get a roadmap built for your situation." />
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Compass, title: "Find", desc: "Search in your own words — “my passport expired” works just as well as the official name." },
            { icon: SlidersHorizontal, title: "Personalise", desc: "Answer a few quick questions. We only ask what changes your steps — never ID numbers." },
            { icon: ClipboardCheck, title: "Prepare", desc: "Get a checklist of exactly which documents apply to you, with accepted alternatives." },
            { icon: Footprints, title: "Follow", desc: "Work through your roadmap step by step. We highlight the next action and track progress." },
          ].map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-brand text-brand-fg">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <span className="font-display text-4xl font-semibold text-line-strong">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------ Categories ------------------------------ */}
      <section className="container-page mt-24" aria-labelledby="cats">
        <SectionTitle id="cats" eyebrow="Browse" title="Explore by category" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => {
            const count = publicProcesses.filter((p) => p.category === c.slug).length;
            const inner = (
              <>
                <span className={`grid size-11 place-items-center rounded-xl ${c.live ? "bg-brand-soft text-brand" : "bg-surface-2 text-subtle"}`}>
                  <Icon name={c.icon} className="size-5" />
                </span>
                <span className="mt-3 block font-bold leading-snug">{c.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{c.live ? `${count} guide${count === 1 ? "" : "s"}` : "Coming soon"}</span>
              </>
            );
            return c.live ? (
              <Link key={c.slug} href={`/category/${c.slug}`} className="rounded-2xl border border-line bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift">
                {inner}
              </Link>
            ) : (
              <div key={c.slug} className="rounded-2xl border border-dashed border-line-strong bg-surface/50 p-4 opacity-80" aria-label={`${c.name} — coming soon`}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------ Features band ------------------------------ */}
      <section className="mt-24 bg-[#0f1f1a] py-20 text-[#e7eeea] dark:bg-surface" aria-labelledby="features">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6dd6b5]">Built around your next step</p>
              <h2 id="features" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Not another wall of text. A plan you can follow.</h2>
              <p className="mt-4 text-[#a9b8b1]">
                Government sites explain the rules. FormEase turns them into a to-do list for <em>your</em> situation — then stays with you until it&apos;s done.
              </p>
              <Link href="/how-it-works" className={buttonClass("accent", "lg", "mt-8")}>
                See how it works <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: ListChecks, t: "Personal roadmap", d: "Ordered steps with dependencies, so you never skip something that matters." },
                { icon: FileCheck2, t: "Document checklist", d: "Required, conditional and optional documents — with accepted alternatives." },
                { icon: MessageCircleQuestion, t: "“What next?” assistant", d: "Ask questions in plain English. Answers come only from verified content, with sources." },
                { icon: LifeBuoy, t: "Rejection help", d: "Application returned? Understand what it may mean and how to fix it." },
                { icon: Bell, t: "Gentle reminders", d: "For appointments and pending steps you choose. Never spammy." },
                { icon: Link2, t: "Official links only", d: "Clearly labelled portals for applying, paying and tracking." },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <f.icon className="size-5 text-[#f4b357]" aria-hidden />
                  <h3 className="mt-3 font-bold text-white">{f.t}</h3>
                  <p className="mt-1 text-sm text-[#a9b8b1]">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ Trust ------------------------------ */}
      <section className="container-page mt-24" aria-labelledby="trust">
        <SectionTitle id="trust" eyebrow="Why you can trust it" title="Honest about what we know — and what we don't" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: BadgeCheck, t: "Verified against official sources", d: "Every guide is drafted from official material, checked by a reviewer and shows its last-verified date." },
            { icon: ShieldCheck, t: "Independent, never official", d: "We're not a government site. We never take applications or payments — we send you to the official portal." },
            { icon: EyeOff, t: "Your documents stay with you", d: "Track your checklist without uploading anything. We don't ask for Aadhaar, PAN or passport numbers." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-bold">{f.t}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-3xl border border-line bg-gradient-to-br from-brand-soft to-surface p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Ready when you are.</h2>
            <p className="mt-1.5 text-muted">No account needed to start. Sign in only when you want to save your progress.</p>
          </div>
          <Link href="/search" className={buttonClass("primary", "lg")}>
            Find your process <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

/** Product preview that shows the core experience at a glance. */
function HeroPreview() {
  const steps = [
    { t: "Register on Passport Seva", s: "done" },
    { t: "Fill the application form", s: "done" },
    { t: "Pay fee & book appointment", s: "next" },
    { t: "Visit Passport Seva Kendra", s: "todo" },
    { t: "Police verification", s: "todo" },
  ];
  return (
    <div className="relative mx-auto mb-20 hidden w-full max-w-md animate-fade-up [animation-delay:120ms] lg:block" aria-hidden>
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/25 blur-2xl" />
      <div className="relative rounded-3xl border border-line bg-surface p-5 shadow-lift">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#e5eefc] text-[#1f5fd6] dark:bg-[#14213b] dark:text-[#84aefc]">
            <Icon name="Plane" className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted">Your journey</p>
            <p className="font-bold">New passport · Adult · Normal</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold text-brand">40%</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-2/5 rounded-full bg-brand" />
        </div>
        <ol className="mt-5 space-y-1">
          {steps.map((st, i) => (
            <li key={st.t} className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${st.s === "next" ? "bg-brand-soft ring-1 ring-brand/30" : ""}`}>
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  st.s === "done" ? "bg-brand text-brand-fg" : st.s === "next" ? "border-2 border-brand text-brand" : "border-2 border-line-strong text-subtle"
                }`}
              >
                {st.s === "done" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`text-sm ${st.s === "done" ? "text-muted line-through decoration-line-strong" : "font-semibold"}`}>{st.t}</span>
              {st.s === "next" && <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-brand-fg">Next</span>}
            </li>
          ))}
        </ol>
      </div>
      <div className="absolute -bottom-24 -left-12 w-60 -rotate-2 rounded-2xl border border-line bg-surface p-4 shadow-lift">
        <p className="flex items-center gap-2 text-xs font-bold text-muted">
          <ClipboardCheck className="size-4 text-brand" /> Documents · 3 of 4 ready
        </p>
        <ul className="mt-2.5 space-y-1.5 text-[13px]">
          {["Proof of address", "Proof of date of birth", "Class 10 certificate"].map((d) => (
            <li key={d} className="flex items-center gap-2">
              <span className="grid size-4 place-items-center rounded bg-brand text-brand-fg">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {d}
            </li>
          ))}
          <li className="flex items-center gap-2 text-muted">
            <CircleDot className="size-4 text-accent" /> Appointment receipt
          </li>
        </ul>
      </div>
    </div>
  );
}
