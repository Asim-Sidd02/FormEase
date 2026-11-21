import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, desc, children }: { eyebrow?: string; title: string; desc?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="dotgrid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="container-page relative max-w-3xl py-12 sm:py-16">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        {desc && <p className="mt-4 text-lg text-muted">{desc}</p>}
        {children}
      </div>
    </section>
  );
}

/** Long-form legal/info copy with comfortable reading measure. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-10 text-[16px] leading-relaxed text-muted [&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-fg [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-fg [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}
