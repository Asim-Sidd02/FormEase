"use client";

import { useState } from "react";
import { Check, ChevronDown, Info, Plus, ShieldCheck, StickyNote, Trash2 } from "lucide-react";
import type { DocKind, DocumentRequirement, Journey, ProcessStep } from "@/lib/types";
import { stepDocsReady, stepState } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { Badge, Button, cn, inputClass, ProgressBar } from "@/components/ui";
import { DOC_KIND } from "@/lib/labels";

export function Checklist({ journey, docs, steps }: { journey: Journey; docs: DocumentRequirement[]; steps: ProcessStep[] }) {
  const addCustomItem = useStore((s) => s.addCustomItem);
  const toggleCustomItem = useStore((s) => s.toggleCustomItem);
  const removeCustomItem = useStore((s) => s.removeCustomItem);
  const [label, setLabel] = useState("");

  const total = docs.length + journey.customItems.length;
  const ready = docs.filter((d) => journey.checklist[d.id]?.ready).length + journey.customItems.filter((c) => c.ready).length;
  const pct = total ? Math.round((ready / total) * 100) : 0;
  const readySteps = steps.filter((s) => (s.documents?.length ?? 0) > 0 && !["completed", "skipped"].includes(stepState(journey, s.id)) && stepDocsReady(s, journey, docs));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted">Documents ready</p>
            <p className="font-display text-3xl font-semibold">
              {ready}
              <span className="text-lg text-subtle"> / {total}</span>
            </p>
          </div>
          <p className="text-sm font-bold text-brand">{pct}%</p>
        </div>
        <ProgressBar value={pct} className="mt-3" label="Checklist completion" />
        {readySteps.length > 0 && (
          <p className="mt-4 flex gap-2 rounded-xl bg-brand-soft/60 p-3 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={3} />
            <span>
              You have everything for: <strong>{readySteps.map((s) => s.title).join(", ")}</strong>
            </span>
          </p>
        )}
        <p className="mt-3 flex gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 shrink-0 text-brand" /> Just tick what you have. You never upload documents to FormEase.
        </p>
      </div>

      {(["required", "conditional", "optional"] as DocKind[]).map((k) => {
        const list = docs.filter((d) => d.kind === k);
        if (!list.length) return null;
        return (
          <section key={k} aria-label={DOC_KIND[k].label}>
            <div className="mb-2.5 flex items-center gap-2">
              <Badge tone={DOC_KIND[k].tone}>{k === "conditional" ? "Because of your answers" : DOC_KIND[k].label}</Badge>
              <span className="text-xs text-muted">
                {list.filter((d) => journey.checklist[d.id]?.ready).length} of {list.length} ready
              </span>
            </div>
            <ul className="space-y-2">
              {list.map((d) => (
                <DocRow key={d.id} d={d} journey={journey} steps={steps} />
              ))}
            </ul>
          </section>
        );
      })}

      <section aria-label="Your own items">
        <div className="mb-2.5">
          <Badge tone="brand">Your own items</Badge>
        </div>
        <ul className="space-y-2">
          {journey.customItems.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
              <CheckBox checked={c.ready} onChange={() => toggleCustomItem(journey.id, c.id)} label={c.label} />
              <span className={cn("flex-1 text-[15px] font-semibold", c.ready && "text-muted line-through decoration-line-strong")}>{c.label}</span>
              <button onClick={() => removeCustomItem(journey.id, c.id)} className="rounded-lg p-1.5 text-subtle hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${c.label}`}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (label.trim()) {
              addCustomItem(journey.id, label.trim());
              setLabel("");
            }
          }}
          className="mt-2 flex gap-2"
        >
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add an item, e.g. “2 extra photocopies”" aria-label="New checklist item" className={inputClass} maxLength={80} />
          <Button type="submit" variant="outline" disabled={!label.trim()}>
            <Plus className="size-4" /> Add
          </Button>
        </form>
      </section>
    </div>
  );
}

function CheckBox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={`${label} — ${checked ? "ready" : "not ready"}`}
      onClick={onChange}
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-lg border-2 transition active:scale-90",
        checked ? "border-brand bg-brand text-brand-fg" : "border-line-strong hover:border-brand",
      )}
    >
      {checked && <Check className="size-4 animate-scale-in" strokeWidth={3} />}
    </button>
  );
}

function DocRow({ d, journey, steps }: { d: DocumentRequirement; journey: Journey; steps: ProcessStep[] }) {
  const toggleDoc = useStore((s) => s.toggleDoc);
  const setDocNote = useStore((s) => s.setDocNote);
  const [open, setOpen] = useState(false);
  const state = journey.checklist[d.id];
  const usedIn = steps.filter((s) => s.documents?.includes(d.id));
  return (
    <li className={cn("rounded-2xl border bg-surface transition", state?.ready ? "border-brand/30" : "border-line")}>
      <div className="flex items-start gap-3 p-3.5">
        <div className="pt-0.5">
          <CheckBox checked={!!state?.ready} onChange={() => toggleDoc(journey.id, d.id)} label={d.name} />
        </div>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className={cn("block text-[15px] font-semibold", state?.ready && "text-muted")}>{d.name}</span>
          <span className="mt-0.5 block text-[13px] text-muted">{d.why}</span>
          {d.alternatives && <span className="mt-1 block text-xs font-semibold text-brand">Any one of {d.alternatives.length} accepted options</span>}
        </button>
        {state?.note && <StickyNote className="mt-1 size-4 shrink-0 text-accent" aria-label="Has note" />}
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-1 text-subtle hover:bg-surface-2" aria-label={open ? "Hide details" : "Show details"}>
          <ChevronDown className={cn("size-5 transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <div className="animate-fade-in space-y-3 border-t border-line px-3.5 py-3.5 text-sm sm:pl-[52px]">
          {d.conditionNote && (
            <p className="flex gap-2 text-info">
              <Info className="mt-0.5 size-4 shrink-0" /> {d.conditionNote}
            </p>
          )}
          {d.alternatives && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-subtle">Accepted — any one of</p>
              <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                {d.alternatives.map((a) => (
                  <li key={a} className="flex gap-2 text-muted">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-brand" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {d.format && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-subtle">Format & copies</p>
              <p className="mt-1 text-muted">{d.format}</p>
            </div>
          )}
          {usedIn.length > 0 && (
            <p className="text-muted">
              <span className="font-semibold text-fg">Used in:</span> {usedIn.map((s) => s.title).join(" · ")}
            </p>
          )}
          <div>
            <label htmlFor={`dn-${d.id}`} className="text-xs font-bold uppercase tracking-wider text-subtle">
              Note
            </label>
            <input
              id={`dn-${d.id}`}
              defaultValue={state?.note ?? ""}
              onBlur={(e) => e.target.value !== (state?.note ?? "") && setDocNote(journey.id, d.id, e.target.value)}
              placeholder="e.g. Using electricity bill — get Oct copy"
              className={cn(inputClass, "mt-1.5 py-2 text-sm")}
            />
          </div>
        </div>
      )}
    </li>
  );
}
