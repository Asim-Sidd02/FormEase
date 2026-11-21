"use client";

import { create } from "zustand";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "./ui";

type ToastTone = "success" | "info" | "warning";
interface ToastItem {
  id: number;
  title: string;
  desc?: string;
  tone: ToastTone;
}

const useToasts = create<{ items: ToastItem[]; push: (t: Omit<ToastItem, "id">) => void; dismiss: (id: number) => void }>((set) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export function toast(title: string, opts: { desc?: string; tone?: ToastTone } = {}) {
  useToasts.getState().push({ title, desc: opts.desc, tone: opts.tone ?? "success" });
}

const icons = { success: CheckCircle2, info: Info, warning: AlertTriangle };

export function Toaster() {
  const { items, dismiss } = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      {items.map((t) => {
        const I = icons[t.tone];
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-lift">
            <I className={cn("mt-0.5 size-5 shrink-0", t.tone === "success" && "text-success", t.tone === "info" && "text-info", t.tone === "warning" && "text-warning")} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.desc && <p className="mt-0.5 text-[13px] text-muted">{t.desc}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded-md p-1 text-subtle hover:text-fg" aria-label="Dismiss notification">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
