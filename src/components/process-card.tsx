import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Clock3, Gauge, Globe2, MapPinned } from "lucide-react";
import type { Process } from "@/lib/types";
import { IconTile } from "./icon";
import { Badge } from "./ui";
import { cn } from "./styles";
import { formatDate } from "@/lib/reminders";

export const COMPLEXITY_TONE = { Easy: "success", Moderate: "info", Involved: "warning" } as const;

export function ProcessCard({ p, className }: { p: Process; className?: string }) {
  return (
    <Link
      href={`/process/${p.slug}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <IconTile name={p.icon} category={p.category} />
        <ArrowRight className="size-5 text-subtle transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
      </div>
      <h3 className="mt-4 text-[17px] font-bold leading-snug">{p.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{p.summary}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        <Badge tone={COMPLEXITY_TONE[p.complexity]} icon={<Gauge className="size-3" />}>
          {p.complexity}
        </Badge>
        <Badge tone="neutral" icon={p.scope === "National" ? <Globe2 className="size-3" /> : <MapPinned className="size-3" />}>
          {p.scope === "National" ? "Nationwide" : "Varies by state"}
        </Badge>
      </div>
    </Link>
  );
}

export function ProcessRow({ p, matched }: { p: Process; matched?: string[] }) {
  return (
    <Link
      href={`/process/${p.slug}`}
      className="group flex gap-4 rounded-2xl border border-line bg-surface p-4 shadow-soft transition hover:border-brand/40 hover:shadow-lift sm:p-5"
    >
      <IconTile name={p.icon} category={p.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] font-bold leading-snug group-hover:text-brand">{p.title}</h3>
          <ArrowRight className="mt-1 hidden size-5 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-brand sm:block" aria-hidden />
        </div>
        <p className="mt-1 text-sm text-muted">{p.summary}</p>
        <p className="mt-2 text-[13px] text-muted">
          <span className="font-semibold text-fg">For:</span> {p.forWho.join(" · ")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge tone={COMPLEXITY_TONE[p.complexity]} icon={<Gauge className="size-3" />}>{p.complexity}</Badge>
          <Badge tone="neutral" icon={p.scope === "National" ? <Globe2 className="size-3" /> : <MapPinned className="size-3" />}>
            {p.scope === "National" ? "Nationwide" : "Varies by state"}
          </Badge>
          <Badge tone="neutral" icon={<Building2 className="size-3" />}>{/^yes/i.test(p.inPerson) ? "Office visit" : "Mostly online"}</Badge>
          <span className="ml-1 inline-flex items-center gap-1 text-xs text-subtle">
            <BadgeCheck className="size-3.5 text-brand" aria-hidden /> Verified {formatDate(p.lastVerified)}
          </span>
          {matched && matched.length > 0 && <span className="hidden text-xs text-subtle sm:inline">· matched “{matched.slice(0, 3).join("”, “")}”</span>}
        </div>
      </div>
    </Link>
  );
}

export function VerifiedPill({ p }: { p: Process }) {
  const due = p.status === "review_due" || p.status === "needs_update";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", due ? "bg-warning-soft text-warning" : "bg-brand-soft text-brand")}>
      {due ? <Clock3 className="size-3.5" aria-hidden /> : <BadgeCheck className="size-3.5" aria-hidden />}
      {due ? `Review due · last verified ${formatDate(p.lastVerified)}` : `Verified ${formatDate(p.lastVerified)}`}
    </span>
  );
}
