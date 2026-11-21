"use client";

import Link from "next/link";
import { useState } from "react";
import { AlarmClockOff, Bell, BellPlus, BellRing, Mail, MoreVertical, Pencil, Smartphone, Trash2 } from "lucide-react";
import { useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { dueReminders, REMINDER_KIND_LABEL, reminderDate, upcomingReminders } from "@/lib/reminders";
import { getProcess } from "@/content/processes";
import { Badge, Button, cn, EmptyState, Skeleton } from "@/components/ui";
import { ReminderDialog } from "@/components/reminder-dialog";
import { toast } from "@/components/toast";
import type { Reminder } from "@/lib/types";

export function RemindersView() {
  const hydrated = useHydrated();
  const reminders = useStore((s) => s.reminders);
  const journeys = useStore((s) => s.journeys);
  const [dialog, setDialog] = useState<{ open: boolean; editing?: Reminder }>({ open: false });

  if (!hydrated) return <div className="container-page pt-10"><Skeleton className="h-64" /></div>;

  const due = dueReminders(reminders);
  const upcoming = upcomingReminders(reminders);
  const off = reminders.filter((r) => !r.enabled || (r.snoozedUntil && new Date(r.snoozedUntil) > new Date() && !due.includes(r)));
  const shown = new Set([...due, ...upcoming, ...off].map((r) => r.id));
  const past = reminders.filter((r) => !shown.has(r.id));

  return (
    <div className="container-page max-w-3xl pt-8 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Reminders</h1>
          <p className="mt-1.5 text-muted">Gentle nudges for dates you choose. You&apos;re always in control.</p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <BellPlus className="size-4" /> New reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Bell className="size-6" />}
            title="No reminders yet"
            desc="Add one for an appointment, a document expiry date or a step you're waiting on. You can also set reminders from inside any journey."
            action={<Button onClick={() => setDialog({ open: true })}><BellPlus className="size-4" /> Add a reminder</Button>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {due.length > 0 && <Group title="Due now" tone="due" items={due} journeys={journeys} onEdit={(r) => setDialog({ open: true, editing: r })} />}
          {upcoming.length > 0 && <Group title="Upcoming" items={upcoming} journeys={journeys} onEdit={(r) => setDialog({ open: true, editing: r })} />}
          {off.length > 0 && <Group title="Snoozed or paused" items={off} journeys={journeys} onEdit={(r) => setDialog({ open: true, editing: r })} />}
          {past.length > 0 && <Group title="Past" items={past} journeys={journeys} onEdit={(r) => setDialog({ open: true, editing: r })} />}
        </div>
      )}

      <p className="mt-10 rounded-2xl bg-surface-2/70 p-4 text-[13px] text-muted">
        Reminders are based on dates <strong>you</strong> enter — they aren&apos;t official deadlines, and FormEase can&apos;t see your application status on government systems. Email delivery uses the address on your account.
      </p>

      <ReminderDialog open={dialog.open} editing={dialog.editing} onClose={() => setDialog({ open: false })} />
    </div>
  );
}

function Group({ title, items, journeys, onEdit, tone }: { title: string; items: Reminder[]; journeys: { id: string; title: string; processSlug: string }[]; onEdit: (r: Reminder) => void; tone?: "due" }) {
  return (
    <section aria-label={title}>
      <h2 className={cn("mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider", tone === "due" ? "text-warning" : "text-subtle")}>
        {tone === "due" && <BellRing className="size-4" />} {title} <span className="font-semibold">({items.length})</span>
      </h2>
      <ul className="space-y-2">
        {items.map((r) => (
          <ReminderRow key={r.id} r={r} journey={journeys.find((j) => j.id === r.journeyId)} onEdit={() => onEdit(r)} due={tone === "due"} />
        ))}
      </ul>
    </section>
  );
}

function ReminderRow({ r, journey, onEdit, due }: { r: Reminder; journey?: { id: string; title: string; processSlug: string }; onEdit: () => void; due?: boolean }) {
  const update = useStore((s) => s.updateReminder);
  const remove = useStore((s) => s.deleteReminder);
  const [menu, setMenu] = useState(false);
  const d = reminderDate(r);
  const p = journey ? getProcess(journey.processSlug) : undefined;
  const snooze = (days: number) => {
    const t = new Date();
    t.setDate(t.getDate() + days);
    t.setHours(9, 0, 0, 0);
    update(r.id, { snoozedUntil: t.toISOString() });
    toast(`Snoozed until ${t.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`, { tone: "info" });
    setMenu(false);
  };
  return (
    <li className={cn("flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-soft", due ? "border-warning/40" : "border-line", !r.enabled && "opacity-60")}>
      <div className="grid w-12 shrink-0 place-items-center rounded-xl border border-line bg-surface py-1.5 text-center">
        <span className="text-[10px] font-bold uppercase text-danger">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
        <span className="text-lg font-bold leading-none">{d.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{r.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <span>{d.toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
          <Badge tone="neutral">{REMINDER_KIND_LABEL[r.kind]}</Badge>
          <span className="inline-flex items-center gap-1">{r.channel === "email" ? <Mail className="size-3.5" /> : <Smartphone className="size-3.5" />}{r.channel === "email" ? "Email" : "In-app"}</span>
        </p>
        {journey && (
          <Link href={`/journey/${journey.id}`} className="mt-1 inline-block text-[13px] font-semibold text-brand hover:underline">
            {journey.title}{p ? ` · ${p.shortTitle}` : ""} →
          </Link>
        )}
      </div>
      <label className="relative inline-flex cursor-pointer items-center" title={r.enabled ? "Turn off" : "Turn on"}>
        <input type="checkbox" className="peer sr-only" checked={r.enabled} onChange={(e) => update(r.id, { enabled: e.target.checked, snoozedUntil: undefined })} aria-label={`${r.title} enabled`} />
        <span className="h-6 w-11 rounded-full bg-surface-3 transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </label>
      <div className="relative">
        <button onClick={() => setMenu((m) => !m)} className="rounded-lg p-1.5 text-subtle hover:bg-surface-2 hover:text-fg" aria-label="Reminder options" aria-expanded={menu}>
          <MoreVertical className="size-5" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} aria-hidden />
            <div role="menu" className="absolute right-0 top-9 z-20 w-48 animate-scale-in rounded-xl border border-line bg-surface p-1 shadow-lift">
              <MI onClick={() => { onEdit(); setMenu(false); }} icon={<Pencil className="size-4" />}>Edit</MI>
              <MI onClick={() => snooze(1)} icon={<AlarmClockOff className="size-4" />}>Snooze 1 day</MI>
              <MI onClick={() => snooze(7)} icon={<AlarmClockOff className="size-4" />}>Snooze 1 week</MI>
              <MI onClick={() => { remove(r.id); toast("Reminder deleted", { tone: "info" }); }} icon={<Trash2 className="size-4" />} danger>Delete</MI>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function MI({ onClick, icon, children, danger }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
  return (
    <button role="menuitem" onClick={onClick} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-surface-2", danger ? "text-danger" : "text-muted hover:text-fg")}>
      {icon} {children}
    </button>
  );
}
