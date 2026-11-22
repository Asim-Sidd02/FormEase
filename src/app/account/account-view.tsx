"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Download, KeyRound, LogOut, Lock, MapPin, ShieldCheck, Trash2, User as UserIcon, UserCog } from "lucide-react";
import { useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { STATES } from "@/content/states";
import { Button, buttonClass, Card, cn, Dialog, Field, inputClass, Skeleton } from "@/components/ui";
import { toast } from "@/components/toast";
import type { Role } from "@/lib/types";

export function AccountView() {
  const hydrated = useHydrated();
  const router = useRouter();
  const s = useStore();
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");

  if (!hydrated) return <div className="container-page pt-10"><Skeleton className="h-96" /></div>;

  if (!s.user) {
    return (
      <div className="container-page max-w-xl pt-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <UserIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold">You&apos;re browsing as a guest</h1>
        <p className="mt-2 text-muted">
          Everything works without an account. Sign in to save journeys to your account, sync across devices and get email reminders.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/sign-in?next=/account" className={buttonClass("primary", "lg")}>Sign in</Link>
          <Link href="/journeys" className={buttonClass("outline", "lg")}>My journeys</Link>
        </div>
        <Card className="mt-10 p-5 text-left">
          <h2 className="font-bold">Data on this device</h2>
          <p className="mt-1 text-sm text-muted">{s.journeys.length} journeys and {s.reminders.length} reminders are stored in this browser.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportData()}>
              <Download className="size-4" /> Export
            </Button>
            <Button variant="outline" size="sm" className="text-danger" onClick={() => setConfirm(true)}>
              <Trash2 className="size-4" /> Clear all
            </Button>
          </div>
        </Card>
        <DeleteDialog open={confirm} onClose={() => setConfirm(false)} typed={typed} setTyped={setTyped} onConfirm={() => { s.deleteAllData(); toast("All data deleted", { tone: "info" }); router.push("/"); }} guest />
      </div>
    );
  }

  const u = s.user;
  return (
    <div className="container-page max-w-3xl pt-8 sm:pt-12">
      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-brand font-display text-2xl font-semibold text-brand-fg">{u.name[0]?.toUpperCase()}</span>
        <div>
          <h1 className="font-display text-3xl font-semibold">{u.name}</h1>
          <p className="text-muted">{u.email} · member since {new Date(u.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <Section icon={<UserIcon className="size-5" />} title="Profile">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="ac-name">
              <input id="ac-name" defaultValue={u.name} onBlur={(e) => e.target.value.trim() && e.target.value !== u.name && (s.updateUser({ name: e.target.value.trim() }), toast("Name updated"))} className={inputClass} maxLength={40} />
            </Field>
            <Field label="Your state / UT (optional)" htmlFor="ac-state" hint="Pre-fills location questions for state-specific guides.">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                <select id="ac-state" value={u.state ?? ""} onChange={(e) => { s.updateUser({ state: e.target.value || undefined }); toast("Preference saved"); }} className={cn(inputClass, "pl-9")}>
                  <option value="">Not set</option>
                  {STATES.map((st) => <option key={st}>{st}</option>)}
                </select>
              </div>
            </Field>
          </div>
        </Section>

        <Section icon={<Bell className="size-5" />} title="Notifications">
          <Toggle
            label="Email reminders"
            desc="Send reminders you create to your email. We never send marketing or unsolicited reminders."
            checked={u.emailReminders}
            onChange={(v) => s.updateUser({ emailReminders: v })}
          />
          <p className="mt-3 text-xs text-muted">More channels (like WhatsApp) may come later — only with your explicit consent.</p>
        </Section>

        <Section icon={<Lock className="size-5" />} title="Privacy">
          <Toggle
            label="Let the assistant use my journey context"
            desc="When on, the assistant can see your wizard answers and step progress for the journey you're viewing. It never sees other journeys."
            checked={s.assistantContext}
            onChange={(v) => s.setAssistantContext(v)}
          />
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-brand" /> We don&apos;t ask for or store Aadhaar, PAN, passport numbers, OTPs or passwords.</li>
            <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-brand" /> Checklists record only that a document is ready — never the document itself.</li>
          </ul>
        </Section>

        <Section icon={<UserCog className="size-5" />} title="Team access (preview)">
          <p className="text-sm text-muted">Switch roles to explore the content console used by FormEase authors, reviewers and administrators.</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Role">
            {(["user", "author", "reviewer", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={u.role === r}
                onClick={() => { s.setRole(r); toast(`Role switched to ${r}`, { tone: "info" }); }}
                className={cn("rounded-xl border px-3.5 py-2 text-sm font-semibold capitalize transition", u.role === r ? "border-brand bg-brand-soft text-brand" : "border-line-strong hover:bg-surface-2")}
              >
                {r === "user" ? "Regular user" : r}
              </button>
            ))}
          </div>
          {u.role !== "user" && (
            <Link href="/admin" className={buttonClass("outline", "sm", "mt-4")}>
              <KeyRound className="size-4" /> Open content console
            </Link>
          )}
        </Section>

        <Section icon={<Download className="size-5" />} title="Your data">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportData()}>
              <Download className="size-4" /> Export my data (JSON)
            </Button>
            <Button variant="outline" onClick={() => { s.signOut(); router.push("/"); }}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
          <div className="mt-6 rounded-2xl border border-danger/30 p-4">
            <p className="font-bold text-danger">Delete account</p>
            <p className="mt-1 text-sm text-muted">Permanently removes your account, journeys, notes and reminders. This can&apos;t be undone.</p>
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirm(true)}>
              <Trash2 className="size-4" /> Delete my account
            </Button>
          </div>
        </Section>
      </div>
      <DeleteDialog open={confirm} onClose={() => setConfirm(false)} typed={typed} setTyped={setTyped} onConfirm={() => { s.deleteAllData(); toast("Account deleted", { tone: "info" }); router.push("/"); }} />
    </div>
  );
}

function exportData() {
  const { user, journeys, reminders, reports } = useStore.getState();
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), user, journeys, reminders, reports: reports.filter((r) => !r.id.startsWith("r-seed")) }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "formease-data.json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Data exported");
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold">
        <span className="text-brand">{icon}</span> {title}
      </h2>
      {children}
    </Card>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="mt-0.5 block text-sm text-muted">{desc}</span>
      </span>
      <span className="relative mt-1 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-surface-3 transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function DeleteDialog({ open, onClose, typed, setTyped, onConfirm, guest }: { open: boolean; onClose: () => void; typed: string; setTyped: (s: string) => void; onConfirm: () => void; guest?: boolean }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={guest ? "Clear all data on this device?" : "Delete your account?"}
      description="All journeys, notes and reminders will be permanently removed."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={typed !== "DELETE"} onClick={() => { onConfirm(); onClose(); setTyped(""); }}>
            Delete permanently
          </Button>
        </>
      }
    >
      <Field label='Type "DELETE" to confirm' htmlFor="del-confirm">
        <input id="del-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} className={inputClass} autoComplete="off" />
      </Field>
    </Dialog>
  );
}
