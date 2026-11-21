"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import type { Reminder, ReminderKind } from "@/lib/types";
import { useStore } from "@/lib/store";
import { REMINDER_KIND_LABEL } from "@/lib/reminders";
import { Button, Dialog, Field, inputClass } from "./ui";
import { toast } from "./toast";

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export function ReminderDialog({
  open,
  onClose,
  journeyId,
  steps,
  defaultStepId,
  defaultKind = "appointment",
  editing,
}: {
  open: boolean;
  onClose: () => void;
  journeyId?: string;
  steps?: { id: string; title: string }[];
  defaultStepId?: string;
  defaultKind?: ReminderKind;
  editing?: Reminder;
}) {
  const user = useStore((s) => s.user);
  const addReminder = useStore((s) => s.addReminder);
  const updateReminder = useStore((s) => s.updateReminder);
  const [kind, setKind] = useState<ReminderKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState("09:00");
  const [stepId, setStepId] = useState(defaultStepId ?? "");
  const [channel, setChannel] = useState<"email" | "in_app">(user ? "email" : "in_app");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setKind(editing.kind);
      setTitle(editing.title);
      setDate(editing.date);
      setTime(editing.time);
      setStepId(editing.stepId ?? "");
      setChannel(editing.channel);
    } else {
      setKind(defaultKind);
      setStepId(defaultStepId ?? "");
      const st = steps?.find((s) => s.id === defaultStepId);
      setTitle(st ? `${defaultKind === "appointment" ? "Appointment" : "Follow up"}: ${st.title}` : "");
      setDate(tomorrow());
      setChannel(user ? "email" : "in_app");
    }
    setError("");
  }, [open, editing, defaultKind, defaultStepId, steps, user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Give your reminder a short name.");
    if (!date) return setError("Pick a date.");
    if (editing) {
      updateReminder(editing.id, { title: title.trim(), kind, date, time, stepId: stepId || undefined, channel });
      toast("Reminder updated");
    } else {
      addReminder({ title: title.trim(), kind, date, time, journeyId, stepId: stepId || undefined, channel });
      toast("Reminder set", { desc: `${new Date(`${date}T${time}`).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={editing ? "Edit reminder" : "Set a reminder"} description="Only you choose when we remind you. We never send reminders you didn't ask for.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="What kind of reminder?" htmlFor="rm-kind">
          <select id="rm-kind" value={kind} onChange={(e) => setKind(e.target.value as ReminderKind)} className={inputClass}>
            {(Object.keys(REMINDER_KIND_LABEL) as ReminderKind[]).map((k) => (
              <option key={k} value={k}>
                {REMINDER_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name" htmlFor="rm-title" error={error && !title.trim() ? error : undefined}>
          <input id="rm-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Passport Kendra appointment" className={inputClass} maxLength={80} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="rm-date">
            <input id="rm-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
          </Field>
          <Field label="Time" htmlFor="rm-time">
            <input id="rm-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          </Field>
        </div>
        {steps && steps.length > 0 && (
          <Field label="Related step (optional)" htmlFor="rm-step">
            <select id="rm-step" value={stepId} onChange={(e) => setStepId(e.target.value)} className={inputClass}>
              <option value="">None</option>
              {steps.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
        )}
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Notify me by</legend>
          <div className="flex gap-2">
            {(["email", "in_app"] as const).map((c) => (
              <label key={c} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand ${c === "email" && !user ? "pointer-events-none opacity-50" : "border-line-strong"}`}>
                <input type="radio" name="channel" className="sr-only" checked={channel === c} onChange={() => setChannel(c)} disabled={c === "email" && !user} />
                {c === "email" ? "Email" : "In-app only"}
              </label>
            ))}
          </div>
          {!user && <p className="mt-1.5 text-xs text-muted">Sign in to get email reminders.</p>}
        </fieldset>
        <p className="flex gap-2 rounded-xl bg-surface-2 p-3 text-xs text-muted">
          <Info className="size-4 shrink-0 text-info" /> This is a date <strong className="contents">you</strong> entered — it isn&apos;t an official deadline. Always confirm dates on the official portal.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{editing ? "Save" : "Set reminder"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
