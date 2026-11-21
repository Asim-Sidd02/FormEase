"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { publicProcesses } from "@/content/processes";
import { EXAMPLE_QUERIES, suggest } from "@/lib/search";
import { IconTile } from "./icon";
import { cn } from "./ui";

export function HeroSearch({ size = "lg", initial = "", autoFocus }: { size?: "lg" | "md"; initial?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [focus, setFocus] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const items = useMemo(() => suggest(q, publicProcesses, 5), [q]);
  const open = focus && q.trim().length > 0 && items.length > 0;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (active >= 0 && items[active]) return router.push(`/process/${items[active].slug}`);
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    else router.push("/search");
  };

  return (
    <div>
      <form onSubmit={submit} role="search" className="relative">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border bg-surface shadow-lift transition-[border-color,box-shadow]",
            focus ? "border-brand ring-4 ring-brand/12" : "border-line-strong",
            size === "lg" ? "p-2 pl-4 sm:pl-5" : "p-1.5 pl-3.5",
          )}
        >
          <Search className={cn("shrink-0 text-brand", size === "lg" ? "size-6" : "size-5")} aria-hidden />
          <input
            value={q}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(-1);
            }}
            onFocus={() => {
              clearTimeout(blurTimer.current);
              setFocus(true);
            }}
            onBlur={() => (blurTimer.current = setTimeout(() => setFocus(false), 120))}
            onKeyDown={(e) => {
              if (!open) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, -1));
              } else if (e.key === "Escape") setFocus(false);
            }}
            placeholder="e.g. I moved house and need to change my address"
            aria-label="Describe what you need to get done"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className={cn("min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle", size === "lg" ? "h-12 text-base sm:text-lg" : "h-10 text-[15px]")}
          />
          <button
            type="submit"
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand font-semibold text-brand-fg transition hover:bg-brand-strong active:scale-[0.98]",
              size === "lg" ? "h-12 px-4 sm:px-6" : "h-10 px-4 text-sm",
            )}
          >
            <span className="hidden sm:inline">Find my steps</span>
            <ArrowRight className="size-5 sm:hidden" aria-label="Search" />
          </button>
        </div>
        {open && (
          <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface p-1.5 text-left shadow-lift">
            {items.map((p, i) => (
              <li key={p.slug} id={`${listId}-${i}`} role="option" aria-selected={active === i}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => router.push(`/process/${p.slug}`)}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left", active === i && "bg-surface-2")}
                >
                  <IconTile name={p.icon} category={p.category} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.title}</span>
                    <span className="block truncate text-[13px] text-muted">{p.summary}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
      {size === "lg" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[13px] font-semibold text-muted">
            <Sparkles className="size-3.5 text-accent" aria-hidden /> Try:
          </span>
          {EXAMPLE_QUERIES.slice(0, 4).map((ex) => (
            <button
              key={ex}
              onClick={() => router.push(`/search?q=${encodeURIComponent(ex)}`)}
              className="rounded-full border border-line bg-surface/70 px-3 py-1 text-[13px] font-medium text-muted transition hover:border-brand/40 hover:text-fg"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
