"use client";

import { useState } from "react";
import { AlertTriangle, ArrowUpRight, BadgeCheck, CalendarCheck, ExternalLink, FileDown, Info, MapPin, MessageSquareWarning, Search, Send, Wallet } from "lucide-react";
import type { LinkPurpose, OfficialLink as OL } from "@/lib/types";
import { Badge, Button, cn, Dialog } from "./ui";
import { formatDate } from "@/lib/reminders";

export const PURPOSE: Record<LinkPurpose, { label: string; icon: typeof Send }> = {
  apply: { label: "Apply", icon: Send },
  status: { label: "Check status", icon: Search },
  appointment: { label: "Book appointment", icon: CalendarCheck },
  info: { label: "Read requirements", icon: Info },
  form: { label: "Download form", icon: FileDown },
  fees: { label: "Fees", icon: Wallet },
  grievance: { label: "Grievance", icon: MessageSquareWarning },
  locate: { label: "Find an office", icon: MapPin },
};

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Opens official links via a short "you're leaving FormEase" confirmation (spec §6.8). */
export function OfficialLinkCard({ link, compact }: { link: OL; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const P = PURPOSE[link.purpose];
  const broken = link.linkStatus === "broken";
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface text-left transition hover:border-brand/40 hover:shadow-soft",
          compact ? "p-3" : "p-4",
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <P.icon className="size-[18px]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{link.label}</span>
            <Badge tone="brand" icon={<BadgeCheck className="size-3" />}>Official</Badge>
            {broken && <Badge tone="danger">Reported issue</Badge>}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">
            {P.label} · {link.org}
          </span>
          {!compact && <span className="mt-0.5 block text-xs text-subtle">{host(link.url)} · checked {formatDate(link.lastChecked)}</span>}
        </span>
        <ArrowUpRight className="size-5 shrink-0 text-subtle transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
      </button>
      <LeaveDialog open={open} onClose={() => setOpen(false)} link={link} />
    </>
  );
}

export function OfficialLinkInline({ link }: { link: OL }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
        {link.label}
        <ExternalLink className="size-3.5" aria-hidden />
      </button>
      <LeaveDialog open={open} onClose={() => setOpen(false)} link={link} />
    </>
  );
}

function LeaveDialog({ open, onClose, link }: { open: boolean; onClose: () => void; link: OL }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="You're leaving FormEase"
      description={`Opening ${link.org}'s official site in a new tab.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Stay here
          </Button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            data-autofocus
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand-strong"
          >
            Continue to {host(link.url)} <ArrowUpRight className="size-4" />
          </a>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-xl border border-line bg-surface-2/60 p-3">
          <p className="font-semibold">{link.label}</p>
          <p className="mt-0.5 break-all text-muted">{link.url}</p>
        </div>
        <ul className="space-y-2 text-muted">
          <li className="flex gap-2">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" /> Check the address bar shows <strong className="text-fg">{host(link.url)}</strong> before entering details.
          </li>
          <li className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> Never share OTPs or passwords with anyone who contacts you about your application.
          </li>
        </ul>
      </div>
    </Dialog>
  );
}
