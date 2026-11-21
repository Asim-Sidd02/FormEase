import type { Reminder } from "./types";

export function reminderDate(r: Reminder) {
  return new Date(`${r.date}T${r.time || "09:00"}`);
}

/** Reminders whose time has passed (or is today) and are not snoozed/disabled. */
export function dueReminders(list: Reminder[], at = new Date()) {
  return list.filter((r) => {
    if (!r.enabled) return false;
    if (r.snoozedUntil && new Date(r.snoozedUntil) > at) return false;
    const d = reminderDate(r);
    return d.toDateString() === at.toDateString() || d < at;
  });
}

export function upcomingReminders(list: Reminder[], at = new Date()) {
  return list.filter((r) => r.enabled && reminderDate(r) > at && !dueReminders([r], at).length).sort((a, b) => +reminderDate(a) - +reminderDate(b));
}

export const REMINDER_KIND_LABEL: Record<Reminder["kind"], string> = {
  appointment: "Appointment",
  continue: "Continue journey",
  expiry: "Document expiry",
  step: "Pending step",
  custom: "Custom",
};

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString("en-IN", opts);
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

export function daysUntil(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((+d - +t) / 86400000);
}
