"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Check, Cloud, Mail, Route, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { LogoMark } from "@/components/logo";
import { Button, Field, inputClass } from "@/components/ui";
import { toast } from "@/components/toast";

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useStore((s) => s.user);
  const journeys = useStore((s) => s.journeys);
  const signIn = useStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [stage, setStage] = useState<"form" | "code">("form");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const guestCount = hydrated ? journeys.filter((j) => !j.saved).length : 0;

  useEffect(() => {
    if (hydrated && user && stage === "form") router.replace(next);
  }, [hydrated, user, next, router, stage]);

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStage("code");
    }, 700);
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    setLoading(true);
    setTimeout(() => {
      signIn(email.trim().toLowerCase(), name.trim());
      toast("You're signed in", { desc: guestCount ? `${guestCount} journey${guestCount > 1 ? "s" : ""} saved to your account.` : undefined });
      router.replace(next);
    }, 500);
  };

  return (
    <div className="container-page grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md animate-fade-up">
        <LogoMark className="size-11" />
        {stage === "form" ? (
          <>
            <h1 className="mt-6 font-display text-3xl font-semibold">Sign in to save your progress</h1>
            <p className="mt-2 text-muted">No password needed — we&apos;ll email you a one-time code. New here? This creates your account.</p>
            <form onSubmit={sendCode} className="mt-8 space-y-4" noValidate>
              <Field label="Email address" htmlFor="si-email" error={error}>
                <input id="si-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" autoFocus aria-invalid={!!error} />
              </Field>
              <Field label="Your first name (optional)" htmlFor="si-name" hint="Only used to greet you.">
                <input id="si-name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={40} />
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                <Mail className="size-4" /> Email me a code
              </Button>
            </form>
          </>
        ) : (
          <>
            <button onClick={() => setStage("form")} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
              <ArrowLeft className="size-4" /> Use a different email
            </button>
            <h1 className="mt-3 font-display text-3xl font-semibold">Check your inbox</h1>
            <p className="mt-2 text-muted">
              We sent a 6-digit code to <strong className="text-fg">{email}</strong>.
            </p>
            <p className="mt-3 rounded-xl border border-info/25 bg-info-soft px-3 py-2 text-[13px] text-info">Preview build: email delivery isn&apos;t connected, so any 6 digits will work.</p>
            <form onSubmit={verify} className="mt-6 space-y-4" noValidate>
              <Field label="Verification code" htmlFor="si-code" error={error}>
                <input
                  id="si-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${inputClass} text-center font-mono text-2xl tracking-[0.5em]`}
                  placeholder="••••••"
                  autoFocus
                />
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Verify and continue
              </Button>
            </form>
          </>
        )}
        <p className="mt-6 flex gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 shrink-0 text-brand" /> By continuing you agree to our terms and privacy policy. We never ask for Aadhaar, PAN or passport numbers.
        </p>
      </div>

      <div className="hidden rounded-3xl border border-line bg-gradient-to-br from-brand-soft via-surface to-accent-soft/40 p-10 lg:block">
        <h2 className="font-display text-2xl font-semibold">Why sign in?</h2>
        <p className="mt-1.5 text-muted">Browsing and planning work without an account. Signing in adds:</p>
        <ul className="mt-8 space-y-5">
          {[
            { icon: Route, t: "Save multiple journeys", d: "Keep track of your passport, your parents' Aadhaar update and more — side by side." },
            { icon: Cloud, t: "Sync across devices", d: "Start on your phone, continue on a laptop." },
            { icon: Bell, t: "Email reminders", d: "For appointments and steps you choose — never spam." },
          ].map((f) => (
            <li key={f.t} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-brand shadow-soft">
                <f.icon className="size-5" />
              </span>
              <div>
                <p className="font-bold">{f.t}</p>
                <p className="text-sm text-muted">{f.d}</p>
              </div>
            </li>
          ))}
        </ul>
        {guestCount > 0 && (
          <p className="mt-8 flex items-center gap-2 rounded-xl bg-surface/80 p-3 text-sm font-medium">
            <Check className="size-4 text-brand" /> Your {guestCount} guest journey{guestCount > 1 ? "s" : ""} will be saved automatically.
          </p>
        )}
      </div>
    </div>
  );
}
