"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { publicProcesses } from "@/content/processes";
import { AssistantChat } from "@/components/assistant";
import { inputClass } from "@/components/ui";

export function AssistantPage() {
  const [slug, setSlug] = useState("");
  const process = publicProcesses.find((p) => p.slug === slug);
  return (
    <div className="container-page max-w-3xl pt-8 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-semibold sm:text-4xl">
            <Sparkles className="size-7 text-brand" /> Ask FormEase
          </h1>
          <p className="mt-1.5 text-muted">Plain-language answers from verified guides — with sources, and honesty when we don&apos;t know.</p>
        </div>
        <label className="w-full sm:w-64">
          <span className="mb-1 block text-xs font-semibold text-muted">Focus on a process (optional)</span>
          <select value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass}>
            <option value="">Any process</option>
            {publicProcesses.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6 flex h-[calc(100dvh-16rem)] min-h-[480px] flex-col overflow-hidden rounded-3xl border border-line bg-bg shadow-soft">
        <AssistantChat key={slug} process={process} />
      </div>
    </div>
  );
}
