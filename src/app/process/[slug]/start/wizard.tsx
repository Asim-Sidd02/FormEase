"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleHelp, Lock, MapPin, Pencil, Search, Sparkles, X } from "lucide-react";
import { useHydrated, useProcess } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { answerLabel, applicableDocuments, applicableSteps, pruneAnswers, visibleQuestions } from "@/lib/engine";
import { STATES } from "@/content/states";
import { IconTile } from "@/components/icon";
import { Button, cn, ProgressBar } from "@/components/ui";
import type { Answers, WizardQuestion } from "@/lib/types";

type Phase = "questions" | "review" | "building";

export function Wizard({ slug, journeyId }: { slug: string; journeyId?: string }) {
  const p = useProcess(slug)!;
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useStore((s) => s.user);
  const journey = useStore((s) => (journeyId ? s.journeys.find((j) => j.id === journeyId) : undefined));
  const createJourney = useStore((s) => s.createJourney);
  const updateAnswers = useStore((s) => s.updateAnswers);
  const defaultState = user?.state;

  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("questions");
  const [dir, setDir] = useState<1 | -1>(1);
  const loaded = useRef(false);

  // Prefill when editing an existing journey
  useEffect(() => {
    if (!hydrated || loaded.current) return;
    loaded.current = true;
    if (journey) {
      setAnswers(journey.answers);
      setPhase("review");
    }
  }, [hydrated, journey]);

  const visible = useMemo(() => visibleQuestions(p, answers), [p, answers]);
  const q = visible[Math.min(index, visible.length - 1)];
  const progress = phase === "questions" ? Math.round((index / (visible.length + 1)) * 100) : 100;

  const choose = (question: WizardQuestion, value: string) => {
    const next = pruneAnswers(p, { ...answers, [question.id]: value });
    setAnswers(next);
    const vis = visibleQuestions(p, next);
    const pos = vis.findIndex((x) => x.id === question.id);
    setDir(1);
    setTimeout(() => {
      // jump to the first unanswered visible question after this one, else review
      const nextIdx = vis.findIndex((x, i) => i > pos && next[x.id] === undefined);
      if (nextIdx === -1) setPhase("review");
      else setIndex(nextIdx);
    }, 180);
  };

  const back = () => {
    setDir(-1);
    if (phase === "review") {
      setPhase("questions");
      setIndex(visible.length - 1);
    } else if (index > 0) setIndex(index - 1);
    else router.push(`/process/${slug}`);
  };

  const editQuestion = (id: string) => {
    setDir(-1);
    setIndex(visible.findIndex((x) => x.id === id));
    setPhase("questions");
  };

  const complete = visible.every((x) => answers[x.id] !== undefined);
  const hasProgress = journey && Object.values(journey.steps).some((s) => s.status !== "not_started");
  const changed = journey && JSON.stringify(journey.answers) !== JSON.stringify(answers);

  const build = () => {
    setPhase("building");
    setTimeout(() => {
      if (journey) {
        if (changed) updateAnswers(journey.id, answers);
        router.push(`/journey/${journey.id}`);
      } else {
        const id = createJourney(p, answers);
        router.push(`/journey/${id}?new=1`);
      }
    }, 1100);
  };

  if (phase === "building") return <Building process={p.shortTitle} steps={applicableSteps(p, answers).length} docs={applicableDocuments(p, answers).length} />;

  return (
    <div className="container-page max-w-2xl overflow-x-clip pb-16 pt-6 sm:pt-10">
      <div className="flex items-center justify-between gap-3">
        <button onClick={back} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg">
          <ArrowLeft className="size-4" /> Back
        </button>
        <Link href={journey ? `/journey/${journey.id}` : `/process/${slug}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg">
          <X className="size-4" /> Exit
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <IconTile name={p.icon} category={p.category} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{p.title}</p>
          <p className="text-xs text-muted" aria-live="polite">
            {phase === "review" ? "Review your answers" : `Question ${index + 1} of ${visible.length}`}
          </p>
        </div>
      </div>
      <ProgressBar value={progress} className="mt-4" label="Wizard progress" />

      {phase === "questions" && q && (
        <div key={q.id} className={cn("mt-10", dir === 1 ? "animate-slide-left" : "animate-fade-up")}>
          <h1 className="font-display text-[28px] font-semibold leading-tight sm:text-[34px]">{q.question}</h1>
          {q.help && <p className="mt-2 text-muted">{q.help}</p>}
          {q.why && <WhyAsk text={q.why} />}
          <div className="mt-7">
            {q.type === "state" ? (
              <StatePicker value={answers[q.id] ?? defaultState} onChoose={(v) => choose(q, v)} />
            ) : (
              <Options q={q} value={answers[q.id]} onChoose={(v) => choose(q, v)} />
            )}
          </div>
          {answers[q.id] && (
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  const pos = visible.findIndex((x) => x.id === q.id);
                  if (pos === visible.length - 1) setPhase("review");
                  else setIndex(pos + 1);
                }}
              >
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "review" && (
        <div className="mt-10 animate-fade-up">
          <h1 className="font-display text-[28px] font-semibold sm:text-[34px]">Does this look right?</h1>
          <p className="mt-2 text-muted">We&apos;ll build your steps and checklist from these answers. You can change them any time.</p>
          <dl className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
            {visible.map((x) => (
              <div key={x.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1">
                  <dt className="text-[13px] text-muted">{x.question}</dt>
                  <dd className={cn("mt-0.5 font-semibold", !answers[x.id] && "text-danger")}>{answers[x.id] ? answerLabel(x, answers[x.id]) : "Not answered"}</dd>
                </div>
                <button onClick={() => editQuestion(x.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft" aria-label={`Change answer: ${x.question}`}>
                  <Pencil className="size-3.5" /> Change
                </button>
              </div>
            ))}
          </dl>

          {hasProgress && changed && (
            <div role="alert" className="mt-4 flex gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
              <p>
                <strong>Your roadmap will change.</strong> Progress on steps that still apply is kept, but some steps or documents may be added or removed. Please re-check your checklist afterwards.
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-3 rounded-2xl bg-surface-2/70 p-4 text-[13px] text-muted">
            <Lock className="mt-0.5 size-4 shrink-0 text-brand" />
            <p>
              We only store these category-level answers{user ? " with your journey" : " on this device"}. We never ask for ID numbers, and you never upload documents.
            </p>
          </div>

          <Button size="lg" className="mt-6 w-full" disabled={!complete} onClick={build}>
            <Sparkles className="size-4" /> {journey ? (changed ? "Update my roadmap" : "Back to my roadmap") : "Build my roadmap"}
          </Button>
        </div>
      )}
    </div>
  );
}

function WhyAsk({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        <CircleHelp className="size-4" /> Why are we asking?
      </button>
      {open && <p className="mt-2 animate-fade-in rounded-xl border border-brand/20 bg-brand-soft/60 p-3 text-sm">{text}</p>}
    </div>
  );
}

function Options({ q, value, onChoose }: { q: WizardQuestion; value?: string; onChoose: (v: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const i = Math.max(0, q.options!.findIndex((o) => o.value === value));
    refs.current[i]?.focus();
  }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= (q.options?.length ?? 0) && !(e.target as HTMLElement).matches("input,textarea")) onChoose(q.options![n - 1].value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, onChoose]);

  return (
    <div role="radiogroup" aria-label={q.question} className="grid grid-cols-1 gap-3">
      {q.options!.map((o, i) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={on}
            onClick={() => onChoose(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                refs.current[(i + 1) % q.options!.length]?.focus();
              }
              if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                refs.current[(i - 1 + q.options!.length) % q.options!.length]?.focus();
              }
            }}
            className={cn(
              "group flex items-center gap-4 rounded-2xl border-2 bg-surface p-4 text-left transition sm:p-5",
              on ? "border-brand bg-brand-soft/50 shadow-soft" : "border-line hover:border-brand/40 hover:shadow-soft",
            )}
          >
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition", on ? "border-brand bg-brand text-brand-fg" : "border-line-strong")}>
              {on && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-sm text-muted">{o.hint}</span>}
            </span>
            <span className="hidden rounded-md border border-line px-1.5 text-xs font-semibold text-subtle sm:block" aria-hidden>
              {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatePicker({ value, onChoose }: { value?: string; onChoose: (v: string) => void }) {
  const [filter, setFilter] = useState("");
  const list = STATES.filter((s) => s.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          autoFocus
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && list.length === 1 && onChoose(list[0])}
          placeholder="Type to filter states and UTs"
          aria-label="Filter states"
          className="w-full rounded-2xl border border-line-strong bg-surface py-3.5 pl-10 pr-4 text-[15px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12"
        />
      </div>
      <div role="radiogroup" aria-label="State or union territory" className="mt-3 grid grid-cols-1 max-h-[340px] gap-1.5 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 sm:grid-cols-2">
        {list.map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={value === s}
            onClick={() => onChoose(s)}
            className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition", value === s ? "bg-brand text-brand-fg" : "hover:bg-surface-2")}
          >
            <MapPin className={cn("size-4 shrink-0", value === s ? "" : "text-subtle")} aria-hidden /> {s}
          </button>
        ))}
        {!list.length && <p className="p-3 text-sm text-muted">No match. Check the spelling.</p>}
      </div>
    </div>
  );
}

function Building({ process, steps, docs }: { process: string; steps: number; docs: number }) {
  return (
    <div className="container-page flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center" role="status" aria-live="polite">
      <div className="relative grid size-20 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
        <span className="relative grid size-16 place-items-center rounded-2xl bg-brand text-brand-fg shadow-lift">
          <Sparkles className="size-7" />
        </span>
      </div>
      <h1 className="mt-8 font-display text-2xl font-semibold">Building your roadmap…</h1>
      <ul className="mt-5 space-y-2 text-left text-sm text-muted">
        <li className="flex animate-fade-up items-center gap-2"><Check className="size-4 text-brand" /> Picking the {steps} steps that apply to you</li>
        <li className="flex animate-fade-up items-center gap-2 [animation-delay:250ms]"><Check className="size-4 text-brand" /> Preparing your {docs}-item document checklist</li>
        <li className="flex animate-fade-up items-center gap-2 [animation-delay:500ms]"><Check className="size-4 text-brand" /> Attaching official links for {process}</li>
      </ul>
    </div>
  );
}
