"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Globe2,
  Lightbulb,
  ListOrdered,
  MapPinned,
  MessageCircleQuestion,
  Printer,
  Sparkles,
  Split,
  Users,
  Wallet,
} from "lucide-react";
import { useProcess, useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { getProcess, PUBLIC_STATUSES } from "@/content/processes";
import { IconTile } from "@/components/icon";
import { Badge, buttonClass, Card, cn, Disclosure } from "@/components/ui";
import { COMPLEXITY_TONE, ProcessCard, VerifiedPill } from "@/components/process-card";
import { OfficialLinkCard } from "@/components/official-link";
import { ReportIssueButton } from "@/components/report-issue";
import { AssistantDrawer } from "@/components/assistant";
import { formatDate } from "@/lib/reminders";
import type { DocKind, Process } from "@/lib/types";
import { DOC_KIND, MODE } from "@/lib/labels";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "steps", label: "Steps" },
  { id: "fees", label: "Fees & time" },
  { id: "tips", label: "Mistakes & tips" },
  { id: "links", label: "Official links" },
  { id: "faqs", label: "FAQs" },
  { id: "sources", label: "Sources" },
];

export function ProcessDetail({ slug }: { slug: string }) {
  const p = useProcess(slug)!;
  const hydrated = useHydrated();
  const addRecent = useStore((s) => s.addRecent);
  const journeys = useStore((s) => s.journeys);
  const [assistant, setAssistant] = useState(false);
  const [active, setActive] = useState("overview");

  useEffect(() => addRecent(slug), [slug, addRecent]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const existing = hydrated ? journeys.find((j) => j.processSlug === slug && !j.archived) : undefined;

  if (!PUBLIC_STATUSES.has(p.status)) {
    return (
      <div className="container-page flex min-h-[50vh] max-w-lg flex-col items-center justify-center py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-warning-soft text-warning">
          <CalendarClock className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">This guide is temporarily unavailable</h1>
        <p className="mt-2 text-muted">We&apos;re re-verifying it against official sources. Meanwhile, please use the official portal directly.</p>
        <div className="mt-6 w-full space-y-2 text-left">
          {p.links.slice(0, 2).map((l) => (
            <OfficialLinkCard key={l.id} link={l} compact />
          ))}
        </div>
      </div>
    );
  }
  const due = p.status === "review_due" || p.status === "needs_update";
  const feeFrom = p.fees.length ? p.fees[0].amount : "Varies";

  return (
    <div className="container-page pt-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/" className="hover:text-fg">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={`/category/${p.category}`} className="capitalize hover:text-fg">{p.category}</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-semibold text-fg" aria-current="page">{p.shortTitle}</span>
      </nav>

      {/* ------------------------------ Header ------------------------------ */}
      <header className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="animate-fade-up">
          <div className="flex items-start gap-4">
            <IconTile name={p.icon} category={p.category} size="lg" />
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold leading-tight sm:text-[42px]">{p.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <VerifiedPill p={p} />
                <Badge tone={COMPLEXITY_TONE[p.complexity]}>{p.complexity}</Badge>
                <Badge tone="neutral" icon={p.scope === "National" ? <Globe2 className="size-3" /> : <MapPinned className="size-3" />}>
                  {p.scope === "National" ? "Nationwide" : "Varies by state"}
                </Badge>
              </div>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-lg text-muted">{p.summary}</p>

          {due && (
            <div role="status" className="mt-5 flex max-w-2xl gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm">
              <CalendarClock className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
              <p>
                <strong>This guide is due for re-verification.</strong> It was last checked on {formatDate(p.lastVerified)}. It&apos;s probably still useful, but double-check fees and documents on the official portal before you apply.
              </p>
            </div>
          )}
          {p.scope === "State-specific" && (
            <div className="mt-4 flex max-w-2xl gap-3 rounded-2xl border border-info/25 bg-info-soft p-4 text-sm">
              <MapPinned className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
              <p>
                <strong>Rules differ by state.</strong> {p.scopeNote ?? "We'll ask your state in the guided journey and flag anything that may differ. Nothing here should be read as a nationwide rule."}
              </p>
            </div>
          )}
        </div>

        {/* Action card */}
        <Card className="h-fit animate-fade-up p-5 [animation-delay:80ms] lg:sticky lg:top-24">
          <p className="text-sm font-semibold">Get your personalised roadmap</p>
          <p className="mt-1 text-[13px] text-muted">Answer {p.questions.length > 4 ? "a few" : p.questions.length} quick questions. Takes about 2 minutes. No ID numbers needed.</p>
          {existing ? (
            <>
              <Link href={`/journey/${existing.id}`} className={buttonClass("primary", "lg", "mt-4 w-full")}>
                Continue your journey <ArrowRight className="size-4" />
              </Link>
              <Link href={`/process/${p.slug}/start`} className={buttonClass("ghost", "md", "mt-2 w-full")}>
                Start a new one
              </Link>
            </>
          ) : (
            <Link href={`/process/${p.slug}/start`} className={buttonClass("primary", "lg", "mt-4 w-full")}>
              Start guided journey <ArrowRight className="size-4" />
            </Link>
          )}
          <button onClick={() => setAssistant(true)} className={buttonClass("outline", "md", "mt-2 w-full")}>
            <Sparkles className="size-4 text-brand" /> Ask a question
          </button>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <Fact icon={<Clock3 className="size-4" />} label="Typical time" value={p.times[0]?.value.split(",")[0] ?? "Varies"} />
            <Fact icon={<Wallet className="size-4" />} label="Govt. fee from" value={feeFrom} />
            <Fact icon={<Building2 className="size-4" />} label="Office visit" value={/^yes/i.test(p.inPerson) ? "Required" : /^no/i.test(p.inPerson) ? "Not usually" : "Sometimes"} />
            <Fact icon={<ListOrdered className="size-4" />} label="Steps" value={`${p.steps.length} steps`} />
          </dl>
        </Card>
      </header>

      {/* ------------------------------ Body ------------------------------ */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5 border-l border-line">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn("-ml-px block border-l-2 py-1.5 pl-4 text-sm font-medium transition", active === s.id ? "border-brand font-semibold text-brand" : "border-transparent text-muted hover:text-fg")}
                >
                  {s.label}
                </a>
              </li>
            ))}
            <li className="pl-4 pt-4">
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-fg">
                <Printer className="size-3.5" /> Print summary
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0 space-y-14">
          <Section id="overview" title="Overview">
            <p className="text-[17px] leading-relaxed">{p.description}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <InfoList icon={<Users className="size-4" />} title="Who it's for" items={p.forWho} />
              <InfoList icon={<Split className="size-4" />} title="Situations covered" items={p.situations} />
              <InfoList icon={<CircleAlert className="size-4" />} title="Before you start" items={p.prerequisites} />
            </div>
            <div className="mt-4 flex gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
              <Building2 className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
              <p>
                <strong>Will I need to visit an office?</strong> <span className="text-muted">{p.inPerson}</span>
              </p>
            </div>
          </Section>

          <Section id="documents" title="Documents commonly needed" desc="Your guided journey narrows this down to exactly what applies to you.">
            <DocGroups p={p} />
          </Section>

          <Section id="steps" title="Step-by-step overview">
            <ol className="relative space-y-3">
              {p.steps.map((s, i) => {
                const M = MODE[s.mode];
                return (
                  <li key={s.id} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 border-brand bg-surface text-sm font-bold text-brand">{i + 1}</span>
                      {i < p.steps.length - 1 && <span className="w-0.5 flex-1 bg-line" aria-hidden />}
                    </div>
                    <div className="mb-2 flex-1 rounded-2xl border border-line bg-surface p-4 shadow-soft">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{s.title}</h3>
                        <Badge tone="neutral" icon={<M.icon className="size-3" />}>{M.label}</Badge>
                        {s.showIf && <Badge tone="info">Depends on your situation</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted">{s.summary}</p>
                      {(s.fee || s.time) && (
                        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
                          {s.time && <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {s.time}</span>}
                          {s.fee && <span className="inline-flex items-center gap-1"><Wallet className="size-3.5" /> {s.fee}</span>}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Section>

          <Section id="fees" title="Fees & time">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                  <Wallet className="size-4 text-brand" aria-hidden />
                  <h3 className="font-bold">Government fees</h3>
                </div>
                {p.fees.length ? (
                  <table className="w-full text-sm">
                    <caption className="sr-only">Government fees</caption>
                    <tbody>
                      {p.fees.map((f) => (
                        <tr key={f.label} className="border-b border-line last:border-0">
                          <th scope="row" className="px-4 py-2.5 text-left font-medium">
                            {f.label}
                            {f.note && <span className="block text-xs font-normal text-muted">{f.note}</span>}
                          </th>
                          <td className="px-4 py-2.5 text-right font-bold tabular-nums">{f.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-muted">No verified fee on record.</p>
                )}
                {p.feeNote && <p className="border-t border-line bg-surface-2/50 px-4 py-3 text-xs text-muted">{p.feeNote}</p>}
              </Card>
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                  <Clock3 className="size-4 text-brand" aria-hidden />
                  <h3 className="font-bold">How long it may take</h3>
                </div>
                <ul>
                  {p.times.map((t) => (
                    <li key={t.label} className="border-b border-line px-4 py-3 text-sm last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium">{t.label}</span>
                        <Badge tone={t.kind === "official" ? "brand" : "warning"}>{t.kind === "official" ? "Official" : "Estimate"}</Badge>
                      </div>
                      <p className="mt-0.5 text-muted">{t.value}</p>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-line bg-surface-2/50 px-4 py-3 text-xs text-muted">
                  Estimates come from FormEase research and are not official commitments. Nobody can guarantee processing times.
                </p>
              </Card>
            </div>
            <p className="mt-3 text-xs text-muted">
              Government fees are paid only on official portals or at official counters. Optional agent or service charges are never part of the government fee.
            </p>
          </Section>

          <Section id="tips" title="Common mistakes & practical tips">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <h3 className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="size-4 text-danger" aria-hidden /> Avoid these mistakes
                </h3>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {p.mistakes.map((m) => (
                    <li key={m} className="flex gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-danger" aria-hidden />
                      {m}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-5">
                <h3 className="flex items-center gap-2 font-bold">
                  <Lightbulb className="size-4 text-accent" aria-hidden /> Practical tips
                </h3>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {p.tips.map((m) => (
                    <li key={m} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                      {m}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-subtle">Tips are general practical advice, not official requirements.</p>
              </Card>
            </div>
          </Section>

          <Section id="links" title="Official links" desc="Apply, pay and track only on these official sites.">
            <div className="grid gap-3 md:grid-cols-2">
              {p.links.map((l) => (
                <OfficialLinkCard key={l.id} link={l} />
              ))}
            </div>
          </Section>

          <Section id="faqs" title="Frequently asked questions">
            <div className="space-y-2">
              {p.faqs.map((f) => (
                <Disclosure key={f.q} summary={f.q}>
                  {f.a}
                </Disclosure>
              ))}
            </div>
            <button onClick={() => setAssistant(true)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
              <MessageCircleQuestion className="size-4" /> Have a different question? Ask the assistant
            </button>
          </Section>

          <Section id="sources" title="Sources & verification">
            <Card className="p-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-4">
                <Meta label="Last verified" value={formatDate(p.lastVerified)} />
                <Meta label="Next review" value={formatDate(p.reviewDue)} />
                <Meta label="Maintained by" value={p.owner} />
                <Meta label="Version" value={`v${p.version}`} />
              </dl>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-sm font-semibold">Official sources used</p>
                <ul className="mt-2 space-y-1.5">
                  {p.sources.map((s) => (
                    <li key={s.url + s.title} className="flex items-start gap-2 text-sm">
                      <FileText className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
                      <span>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
                          {s.title}
                        </a>{" "}
                        <span className="text-muted">— {s.org}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {p.limitations && (
                <p className="mt-4 rounded-xl bg-surface-2 p-3 text-[13px] text-muted">
                  <strong className="text-fg">Limitations:</strong> {p.limitations}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="flex items-center gap-2 text-[13px] text-muted">
                  <BadgeCheck className="size-4 text-brand" aria-hidden /> Rules can change. The official portal is always the final authority.
                </p>
                <ReportIssueButton
                  processSlug={p.slug}
                  variant="button"
                  targets={["General", "Fees", "Documents", "Time estimates", ...p.steps.map((s) => `Step: ${s.title}`), ...p.links.map((l) => `Link: ${l.label}`)]}
                />
              </div>
            </Card>
          </Section>

          {p.related.length > 0 && (
            <section aria-labelledby="related">
              <h2 id="related" className="mb-4 font-display text-2xl font-semibold">Related processes</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {p.related
                  .map(getProcess)
                  .filter(Boolean)
                  .map((r) => (
                    <ProcessCard key={r!.slug} p={r!} />
                  ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-surface/95 p-3 backdrop-blur md:hidden">
        <div className="flex gap-2">
          <button onClick={() => setAssistant(true)} className={buttonClass("outline", "lg", "px-3.5")} aria-label="Ask a question">
            <Sparkles className="size-5 text-brand" />
          </button>
          <Link href={existing ? `/journey/${existing.id}` : `/process/${p.slug}/start`} className={buttonClass("primary", "lg", "flex-1")}>
            {existing ? "Continue journey" : "Start guided journey"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <AssistantDrawer open={assistant} onClose={() => setAssistant(false)} process={p} />
    </div>
  );
}

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <h2 id={`${id}-h`} className="font-display text-2xl font-semibold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        <span className="text-brand">{icon}</span> {label}
      </dt>
      <dd className="mt-0.5 font-bold">{value}</dd>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

function InfoList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <span className="text-brand">{icon}</span> {title}
      </h3>
      <ul className="mt-2.5 space-y-1.5 text-sm text-muted">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-subtle" aria-hidden />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocGroups({ p }: { p: Process }) {
  return (
    <div className="space-y-6">
      {(["required", "conditional", "optional"] as DocKind[]).map((k) => {
        const list = p.documents.filter((d) => d.kind === k);
        if (!list.length) return null;
        return (
          <div key={k}>
            <div className="mb-2.5 flex items-center gap-2">
              <Badge tone={DOC_KIND[k].tone}>{DOC_KIND[k].label}</Badge>
              <span className="text-xs text-muted">{DOC_KIND[k].desc}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((d) => (
                <div key={d.id} className="rounded-2xl border border-line bg-surface p-4">
                  <h3 className="font-bold">{d.name}</h3>
                  <p className="mt-1 text-sm text-muted">{d.why}</p>
                  {d.conditionNote && <p className="mt-2 text-xs font-medium text-info">{d.conditionNote.replace(/^Shown because/, "Applies when")}</p>}
                  {d.alternatives && (
                    <details className="group mt-2.5">
                      <summary className="cursor-pointer list-none text-[13px] font-semibold text-brand">
                        <span className="group-open:hidden">Show {d.alternatives.length} accepted options</span>
                        <span className="hidden group-open:inline">Any one of:</span>
                      </summary>
                      <ul className="mt-1.5 space-y-1 text-[13px] text-muted">
                        {d.alternatives.map((a) => (
                          <li key={a} className="flex gap-2">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden /> {a}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {d.format && <p className="mt-2.5 border-t border-line pt-2.5 text-xs text-subtle">{d.format}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
