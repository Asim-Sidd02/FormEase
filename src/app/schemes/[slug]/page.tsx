import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowUpRight, BadgeCheck, Building2, CalendarClock, Check, FileText, Gift, IndianRupee, ListOrdered, Phone, UserCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { buttonClass } from "@/components/styles";
import { getScheme } from "@/lib/schemes/server";
import { deadlineInfo, formatDate } from "../format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const s = await getScheme(slug).catch(() => null);
  return s && s.status === "published" ? s : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await load((await params).slug);
  return s ? { title: s.name, description: s.summary || undefined } : { title: "Scheme not found" };
}

function Section({ icon: Icon, title, items, ordered }: { icon: typeof Check; title: string; items: string[]; ordered?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
        <Icon className="size-5 text-brand" /> {title}
      </h2>
      {ordered ? (
        <ol className="mt-4 space-y-3">
          {items.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">{i + 1}</span>
              <span className="pt-0.5 leading-7">{t}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2.5 leading-7">
              <Check className="mt-1.5 size-4 shrink-0 text-brand" /> <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function SchemePage({ params }: Props) {
  const s = await load((await params).slug);
  if (!s) notFound();
  const dl = deadlineInfo(s.deadline);
  const host = new URL(s.officialUrl).hostname.replace(/^www\./, "");

  return (
    <div className="container-page max-w-5xl py-8 sm:py-10">
      <Link href="/schemes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> All schemes
      </Link>

      <header className="mt-5">
        <div className="flex flex-wrap gap-1.5">
          {s.launchedOn && <Badge tone="info">Launched {formatDate(s.launchedOn)}</Badge>}
          {dl && (
            <Badge tone={dl.tone} icon={<CalendarClock className="size-3" />}>
              {dl.label}
            </Badge>
          )}
          {s.verifiedOn && (
            <Badge tone="success" icon={<BadgeCheck className="size-3" />}>
              Checked {formatDate(s.verifiedOn)}
            </Badge>
          )}
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">{s.name}</h1>
        {s.ministry && (
          <p className="mt-2 flex items-center gap-1.5 text-muted">
            <Building2 className="size-4 shrink-0" /> {s.ministry}
          </p>
        )}
        {s.summary && <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{s.summary}</p>}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article>
          {dl?.closed && (
            <p className="mb-8 flex gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Applications closed on {formatDate(s.deadline!)}. Check the official site in case the date was extended.
            </p>
          )}
          <Section icon={Gift} title="What you get" items={s.benefits} />
          <Section icon={UserCheck} title="Who can apply" items={s.eligibility} />
          <Section icon={FileText} title="Documents you'll need" items={s.documents} />
          <Section icon={ListOrdered} title="How to apply" items={s.steps} ordered />
          {s.fees && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                <IndianRupee className="size-5 text-brand" /> Fees
              </h2>
              <p className="mt-3 leading-7">{s.fees}</p>
            </section>
          )}
          <p className="mt-10 rounded-xl bg-surface-2 p-4 text-sm text-muted">
            FormEase is not a government website. Eligibility and benefits are decided by the scheme authority — the official site is the final word. Never pay anyone to apply on your behalf.
          </p>
        </article>

        <aside className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <p className="text-sm font-semibold">Apply on the official site</p>
            <div className="mt-3 flex flex-col gap-2">
              {s.applyUrl && (
                <a href={s.applyUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md", "w-full")}>
                  Start application <ArrowUpRight className="size-4" />
                </a>
              )}
              <a href={s.officialUrl} target="_blank" rel="noopener noreferrer" className={buttonClass(s.applyUrl ? "outline" : "primary", "md", "w-full")}>
                Official scheme page <ArrowUpRight className="size-4" />
              </a>
            </div>
            <p className="mt-2 text-xs text-muted">Opens {host}</p>
            {s.helpline && (
              <p className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-sm">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand" /> <span>Helpline: {s.helpline}</span>
              </p>
            )}
            <p className="mt-4 border-t border-line pt-4 text-xs text-muted">
              Spotted something out of date?{" "}
              <Link href="/report" className="font-semibold text-brand hover:underline">
                Report it
              </Link>
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
