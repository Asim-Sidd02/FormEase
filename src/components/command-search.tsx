"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CornerDownLeft, Search, Sparkles, X } from "lucide-react";
import { publicProcesses, getProcess, POPULAR } from "@/content/processes";
import { EXAMPLE_QUERIES, searchProcesses } from "@/lib/search";
import { useStore } from "@/lib/store";
import { IconTile } from "./icon";
import { cn, Kbd } from "./ui";

export function useCommandSearch() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("fe:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("fe:open-search", onOpen);
    };
  }, []);
  return { open, setOpen };
}

export const openSearch = () => window.dispatchEvent(new Event("fe:open-search"));

export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useStore((s) => s.recent);

  const results = useMemo(() => {
    if (!q.trim()) {
      const recentP = recent.map(getProcess).filter(Boolean) as typeof publicProcesses;
      const popular = POPULAR.map(getProcess).filter((p) => p && !recent.includes(p.slug)) as typeof publicProcesses;
      return [...recentP, ...popular].slice(0, 6);
    }
    return searchProcesses(q, publicProcesses).map((h) => h.process).slice(0, 7);
  }, [q, recent]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  if (!open || typeof document === "undefined") return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const total = results.length + (q.trim() ? 1 : 0);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(total, 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + total) % Math.max(total, 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (active < results.length && results[active]) go(`/process/${results[active].slug}`);
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-start justify-center p-3 pt-[8vh] sm:p-4 sm:pt-[12vh]" onKeyDown={onKey}>
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search processes" className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 shrink-0 text-brand" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you need to get done?"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-subtle"
            aria-label="Search processes"
            role="combobox"
            aria-expanded
            aria-controls="cmd-results"
            aria-activedescendant={`cmd-${active}`}
          />
          <button onClick={onClose} className="rounded-md p-1.5 text-subtle hover:text-fg sm:hidden" aria-label="Close search">
            <X className="size-5" />
          </button>
          <span className="hidden sm:block">
            <Kbd>Esc</Kbd>
          </span>
        </div>
        <ul id="cmd-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
          <li className="px-2.5 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-subtle" role="presentation">
            {q.trim() ? (results.length ? "Best matches" : "No direct match") : recent.length ? "Recent & popular" : "Popular"}
          </li>
          {results.map((p, i) => (
            <li key={p.slug} id={`cmd-${i}`} role="option" aria-selected={active === i}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(`/process/${p.slug}`)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left", active === i && "bg-surface-2")}
              >
                <IconTile name={p.icon} category={p.category} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{p.title}</span>
                  <span className="block truncate text-[13px] text-muted">{p.summary}</span>
                </span>
                {active === i && <CornerDownLeft className="size-4 shrink-0 text-subtle" aria-hidden />}
              </button>
            </li>
          ))}
          {q.trim() && (
            <li id={`cmd-${results.length}`} role="option" aria-selected={active === results.length}>
              <button
                onMouseEnter={() => setActive(results.length)}
                onClick={() => go(`/search?q=${encodeURIComponent(q)}`)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-[15px]", active === results.length && "bg-surface-2")}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-muted">
                  <ArrowRight className="size-[18px]" />
                </span>
                See all results for <strong className="truncate">“{q}”</strong>
              </button>
            </li>
          )}
          {!q.trim() && (
            <>
              <li className="px-2.5 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-wider text-subtle" role="presentation">
                Try asking in your own words
              </li>
              {EXAMPLE_QUERIES.slice(0, 3).map((ex) => (
                <li key={ex}>
                  <button onClick={() => setQ(ex)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-fg">
                    <Sparkles className="size-4 shrink-0 text-accent" aria-hidden /> {ex}
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>
        <div className="hidden items-center gap-4 border-t border-line bg-surface-2/60 px-4 py-2.5 text-xs text-muted sm:flex">
          <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> open</span>
          <span className="ml-auto">Search understands everyday language</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
