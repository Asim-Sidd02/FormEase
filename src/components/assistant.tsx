"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, BadgeCheck, Radio, BookOpen, CircleHelp, EyeOff, Info, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { answer, redact, suggestionsFor, withOfficial, type AssistantReply, type Block } from "@/lib/assistant";
import { hostOf, searchOfficialPassages } from "@/lib/sources/client";
import { relativeTime } from "@/lib/reminders";
import type { Journey, Process } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn } from "./ui";
import { toast } from "./toast";

interface Msg {
  id: number;
  role: "user" | "assistant";
  text?: string;
  reply?: AssistantReply;
  rated?: "up" | "down";
}

function rich(text: string) {
  // **bold** and *italic* only — content is ours, but we still avoid HTML injection
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") ? <strong key={i} className="font-semibold text-fg">{p.slice(2, -2)}</strong> : p.startsWith("*") && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : p,
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i}>{rich(b.text)}</p>
        ) : b.type === "ul" ? (
          <ul key={i} className="space-y-1.5 pl-1">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>{rich(it)}</span>
              </li>
            ))}
          </ul>
        ) : b.type === "quote" ? (
          <figure key={i} className="rounded-xl border border-brand/25 bg-brand-soft/40 p-3">
            <blockquote className="text-[14px] leading-relaxed text-fg/90 [overflow-wrap:anywhere]">“{b.text}”</blockquote>
            <figcaption className="mt-2 text-[11.5px] leading-snug text-muted">
              <Radio className="mr-1 inline size-3.5 align-[-2px] text-brand" aria-hidden />
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">{b.org}</a>
              <span className="whitespace-nowrap"> · {hostOf(b.url)}{b.fetchedAt ? ` · read ${relativeTime(b.fetchedAt)}` : ""}</span>
            </figcaption>
          </figure>
        ) : (
          <p key={i} className="flex gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px]">
            <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
            <span>{rich(b.text)}</span>
          </p>
        ),
      )}
    </div>
  );
}

const GROUNDING = {
  verified: { label: "From verified guide", cls: "bg-brand-soft text-brand", icon: BadgeCheck },
  official: { label: "Official source (live)", cls: "bg-brand-soft text-brand", icon: Radio },
  general: { label: "General guidance", cls: "bg-info-soft text-info", icon: Info },
  not_found: { label: "Couldn't verify", cls: "bg-warning-soft text-warning", icon: CircleHelp },
};

export function AssistantChat({ process, journey, compact }: { process?: Process; journey?: Journey; compact?: boolean }) {
  const useContext = useStore((s) => s.assistantContext);
  const setContext = useStore((s) => s.setAssistantContext);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const ctxJourney = journey && useContext ? journey : undefined;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  const ask = (raw: string) => {
    const q = raw.trim();
    if (!q || thinking) return;
    const { text, changed } = redact(q);
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text }]);
    setInput("");
    setThinking(true);
    if (changed) toast("We removed an ID-like number from your message", { tone: "warning", desc: "Never share Aadhaar, PAN, passport numbers or OTPs in chat." });
    const started = Date.now();
    (async () => {
      let reply = answer(q, { process, journey: ctxJourney });
      // Add verbatim passages from the live official pages for this process, when they match.
      if (reply.processSlug && reply.grounding !== "general") {
        const passages = await searchOfficialPassages(reply.processSlug, text);
        reply = withOfficial(reply, passages);
        const extra = passages.slice(0, 3).map((p) => ({ label: `${p.org} — ${hostOf(p.url)} (live)`, url: p.url }));
        reply = { ...reply, sources: [...reply.sources, ...extra.filter((e, i) => extra.findIndex((x) => x.url === e.url) === i)] };
      }
      const wait = Math.max(0, 400 - (Date.now() - started));
      setTimeout(() => {
        setMsgs((m) => [...m, { id: Date.now() + 1, role: "assistant", reply }]);
        setThinking(false);
      }, wait);
    })();
  };

  const rate = (id: number, r: "up" | "down") => {
    setMsgs((m) => m.map((x) => (x.id === id ? { ...x, rated: r } : x)));
    toast(r === "up" ? "Thanks for the feedback" : "Thanks — we'll review this answer", { tone: "info" });
  };

  const suggestions = suggestionsFor(process, ctxJourney);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite">
        {msgs.length === 0 && (
          <div className={cn("animate-fade-in", compact ? "py-2" : "py-6")}>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong text-brand-fg">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-bold">What happens next?</p>
                <p className="text-[13px] text-muted">{process ? `Ask anything about “${process.shortTitle}”.` : "Ask about any process we cover."}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-[13px] text-muted">
              <li className="flex gap-2"><BookOpen className="size-4 shrink-0 text-brand" /> Answers come from FormEase&apos;s verified guides and live official pages, with sources.</li>
              <li className="flex gap-2"><EyeOff className="size-4 shrink-0 text-brand" /> Don&apos;t share Aadhaar, PAN, passport numbers, OTPs or passwords.</li>
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => ask(s)} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm font-medium transition hover:border-brand/40 hover:bg-brand-soft/40">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] animate-fade-in rounded-2xl rounded-br-md bg-brand px-3.5 py-2.5 text-[15px] text-brand-fg">{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="animate-fade-up">
              {m.reply && (
                <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-line bg-surface p-4 text-[15px] leading-relaxed text-muted shadow-soft">
                  {(() => {
                    const g = GROUNDING[m.reply.grounding];
                    return (
                      <span className={cn("mb-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", g.cls)}>
                        <g.icon className="size-3" aria-hidden /> {g.label}
                      </span>
                    );
                  })()}
                  <Blocks blocks={m.reply.blocks} />
                  {m.reply.sources.length > 0 && (
                    <div className="mt-3.5 border-t border-line pt-3">
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-subtle">Sources</p>
                      <ul className="space-y-1">
                        {m.reply.sources.map((s) => (
                          <li key={s.url + s.label} className="text-[13px]">
                            {s.url.startsWith("/") ? (
                              <Link href={s.url} className="font-medium text-brand hover:underline">{s.label}</Link>
                            ) : (
                              <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
                                {s.label} ↗
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1">
                    <span className="mr-1 text-xs text-subtle">Helpful?</span>
                    <button onClick={() => rate(m.id, "up")} aria-pressed={m.rated === "up"} aria-label="Helpful" className={cn("rounded-lg p-1.5 hover:bg-surface-2", m.rated === "up" ? "text-brand" : "text-subtle")}>
                      <ThumbsUp className="size-3.5" />
                    </button>
                    <button onClick={() => rate(m.id, "down")} aria-pressed={m.rated === "down"} aria-label="Not helpful" className={cn("rounded-lg p-1.5 hover:bg-surface-2", m.rated === "down" ? "text-danger" : "text-subtle")}>
                      <ThumbsDown className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-1.5 px-1 text-subtle" aria-label="Assistant is looking this up">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 animate-bounce rounded-full bg-brand/60" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
            <span className="ml-1.5 text-xs">Checking our guide and the official pages…</span>
          </div>
        )}
        {msgs.length > 0 && !thinking && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(msgs[msgs.length - 1].reply?.suggestions ?? []).slice(0, 3).map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted hover:border-brand/40 hover:text-fg">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line bg-surface p-3 sm:p-4">
        {journey && (
          <label className="mb-2.5 flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={useContext} onChange={(e) => setContext(e.target.checked)} className="size-3.5 accent-[var(--brand)]" />
            Use my journey answers and progress to personalise answers
          </label>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-line-strong bg-surface p-1.5 pl-3.5 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/12"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            rows={1}
            placeholder="Ask a question, or paste a rejection reason…"
            aria-label="Ask the assistant"
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-subtle"
          />
          <button type="submit" disabled={!input.trim() || thinking} className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-fg transition hover:bg-brand-strong disabled:opacity-40" aria-label="Send">
            <ArrowUp className="size-5" />
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-subtle">Guidance only · No guarantee of approval or timelines · Official portals are authoritative</p>
      </div>
    </div>
  );
}

/** Slide-over drawer wrapper. */
export function AssistantDrawer({ open, onClose, process, journey }: { open: boolean; onClose: () => void; process?: Process; journey?: Journey }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 animate-fade-in bg-black/30" onClick={onClose} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label="Assistant" className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-left flex-col border-l border-line bg-bg shadow-lift">
        <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" aria-hidden />
            <p className="font-bold">FormEase Assistant</p>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">Beta</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-surface-2" aria-label="Close assistant">
            <X className="size-5" />
          </button>
        </div>
        <AssistantChat process={process} journey={journey} />
      </aside>
    </div>,
    document.body,
  );
}
