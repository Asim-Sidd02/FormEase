import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, CalendarClock, Megaphone, Sparkles } from "lucide-react";
import { PageHero } from "@/components/prose-page";
import { Badge, Card, EmptyState } from "@/components/ui";
import { getAnnouncements, listSchemes } from "@/lib/schemes/server";
import type { Scheme } from "@/lib/schemes/types";
import { RequestScheme } from "./request-scheme";
import { deadlineInfo, formatDate } from "./format";

export const metadata: Metadata = { title: "New government schemes" };
export const dynamic = "force-dynamic";

export default async function SchemesPage() {
  const [schemes, pib] = await Promise.all([
    listSchemes().catch(() => [] as Scheme[]),
    getAnnouncements().catch(() => ({ items: [], fetchedAt: null, error: "Announcements are unavailable right now." })),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Government schemes"
        title="New schemes, explained"
        desc="Who can apply, what you need and how to apply — written up by our editors from the official scheme pages, with a link to the official site for every step."
      />

      <div className="container-page grid max-w-6xl gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="schemes-h">
          <h2 id="schemes-h" className="font-display text-2xl font-semibold">Scheme guides</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {schemes.length === 0 && (
              <div className="sm:col-span-2">
                <EmptyState icon={<Sparkles className="size-6" />} title="No scheme guides yet" desc="Our editors are working on the first ones. Ask for a scheme below and we'll prioritise it." />
              </div>
            )}
            {schemes.map((s) => {
              const dl = deadlineInfo(s.deadline);
              return (
                <Link key={s.slug} href={`/schemes/${s.slug}`} className="group">
                  <Card className="flex h-full flex-col p-5 transition group-hover:border-brand/50 group-hover:shadow-soft">
                    <div className="flex flex-wrap gap-1.5">
                      {s.launchedOn && <Badge tone="info">Launched {formatDate(s.launchedOn)}</Badge>}
                      {dl && <Badge tone={dl.tone} icon={<CalendarClock className="size-3" />}>{dl.label}</Badge>}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-snug group-hover:text-brand">{s.name}</h3>
                    {s.ministry && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <Building2 className="size-3.5 shrink-0" /> {s.ministry}
                      </p>
                    )}
                    {s.summary && <p className="mt-3 line-clamp-3 text-sm text-muted">{s.summary}</p>}
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand">
                      See eligibility and steps <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-10">
            <RequestScheme />
          </div>
        </section>

        <aside aria-labelledby="pib-h" className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <h2 id="pib-h" className="flex items-center gap-2 font-display text-lg font-semibold">
              <Megaphone className="size-5 text-brand" /> Latest announcements
            </h2>
            <p className="mt-1 text-xs text-muted">
              Recent Press Information Bureau releases that mention a scheme, portal or programme. Not yet reviewed by FormEase — open the release for details.
            </p>
            {pib.error && <p className="mt-3 rounded-lg bg-warning-soft px-2.5 py-1.5 text-xs text-warning">{pib.error}</p>}
            {pib.items.length === 0 && !pib.error && <p className="mt-4 text-sm text-muted">No scheme-related releases right now. Check back later.</p>}
            <ul className="mt-4 space-y-3">
              {pib.items.slice(0, 15).map((a) => (
                <li key={a.url}>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" lang="hi" className="group block rounded-lg -mx-2 px-2 py-1.5 hover:bg-surface-2">
                    <span className="text-sm leading-6 group-hover:text-brand">{a.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      pib.gov.in · {formatDate(a.seenAt)} <ArrowUpRight className="size-3" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
