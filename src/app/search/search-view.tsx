"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Lightbulb, MessageSquarePlus, SearchX, X } from "lucide-react";
import { HeroSearch } from "@/components/hero-search";
import { ProcessRow, ProcessCard } from "@/components/process-card";
import { EmptyState, cn, buttonClass } from "@/components/ui";
import { categories } from "@/content/categories";
import { getProcess, POPULAR, publicProcesses } from "@/content/processes";
import { searchProcesses } from "@/lib/search";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import type { Complexity } from "@/lib/types";

const COMPLEXITIES: Complexity[] = ["Easy", "Moderate", "Involved"];

export function SearchView({ initialQuery, initialCategory }: { initialQuery: string; initialCategory: string }) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [complexity, setComplexity] = useState<Complexity | "">("");
  const [scope, setScope] = useState<"" | "National" | "State-specific">("");
  const hydrated = useHydrated();
  const recent = useStore((s) => s.recent);
  const q = initialQuery;

  useEffect(() => setCategory(initialCategory), [initialCategory]);

  const results = useMemo(() => {
    const base = q.trim() ? searchProcesses(q, publicProcesses) : publicProcesses.map((p) => ({ process: p, score: 0, matched: [] as string[] }));
    return base.filter(
      (h) => (!category || h.process.category === category) && (!complexity || h.process.complexity === complexity) && (!scope || h.process.scope === scope),
    );
  }, [q, category, complexity, scope]);

  const liveCats = categories.filter((c) => c.live);
  const filtersOn = !!(category || complexity || scope);

  const setCat = (c: string) => {
    setCategory(c);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (c) params.set("category", c);
    router.replace(`/search${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  return (
    <div className="container-page pt-8 sm:pt-12">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{q ? "Search results" : "All process guides"}</h1>
        <p className="mt-2 text-muted">Describe your situation in your own words, or browse the full library.</p>
        <div className="mt-6">
          <HeroSearch key={q} size="md" initial={q} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:block lg:space-y-6 lg:overflow-visible lg:px-0">
            <FilterGroup label="Category">
              <Chip on={!category} onClick={() => setCat("")}>All</Chip>
              {liveCats.map((c) => (
                <Chip key={c.slug} on={category === c.slug} onClick={() => setCat(category === c.slug ? "" : c.slug)}>
                  {c.name}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Complexity">
              {COMPLEXITIES.map((c) => (
                <Chip key={c} on={complexity === c} onClick={() => setComplexity(complexity === c ? "" : c)}>
                  {c}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Coverage">
              <Chip on={scope === "National"} onClick={() => setScope(scope === "National" ? "" : "National")}>Nationwide</Chip>
              <Chip on={scope === "State-specific"} onClick={() => setScope(scope === "State-specific" ? "" : "State-specific")}>Varies by state</Chip>
            </FilterGroup>
          </div>
        </aside>

        <section aria-live="polite" aria-label="Results">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>
              <strong className="text-fg">{results.length}</strong> {results.length === 1 ? "guide" : "guides"}
              {q && (
                <>
                  {" "}for <strong className="text-fg">“{q}”</strong>
                </>
              )}
            </span>
            {filtersOn && (
              <button
                onClick={() => {
                  setCat("");
                  setComplexity("");
                  setScope("");
                }}
                className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold hover:bg-surface-3"
              >
                <X className="size-3" /> Clear filters
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((h) => (
                <ProcessRow key={h.process.slug} p={h.process} matched={h.matched} />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <EmptyState
                icon={<SearchX className="size-6" />}
                title="We don't have a guide for that yet"
                desc={
                  <>
                    Try fewer words or the document&apos;s name — e.g. “passport”, “Aadhaar address”, “income certificate”. We&apos;re adding processes based on what people ask for.
                  </>
                }
                action={
                  <Link href={`/report?request=${encodeURIComponent(q)}`} className={buttonClass("outline")}>
                    <MessageSquarePlus className="size-4" /> Request this process
                  </Link>
                }
              />
              <div>
                <h2 className="mb-3 flex items-center gap-2 font-bold">
                  <Lightbulb className="size-4 text-accent" /> People often look for
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {POPULAR.slice(0, 4).map((s) => {
                    const p = getProcess(s)!;
                    return <ProcessCard key={s} p={p} />;
                  })}
                </div>
              </div>
            </div>
          )}

          {hydrated && recent.length > 0 && !q && (
            <div className="mt-12">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-subtle">Recently viewed</h2>
              <div className="flex flex-wrap gap-2">
                {recent.map((s) => {
                  const p = getProcess(s);
                  return p ? (
                    <Link key={s} href={`/process/${s}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-brand/40">
                      {p.shortTitle}
                    </Link>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 gap-2 lg:flex-col lg:items-start lg:gap-1.5">
      <p className="hidden text-xs font-bold uppercase tracking-wider text-subtle lg:mb-1 lg:block">{label}</p>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition lg:rounded-lg lg:border-transparent lg:px-2.5",
        on ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-muted hover:text-fg lg:bg-transparent lg:hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
