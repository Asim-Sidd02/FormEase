import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, desc, children }: { eyebrow?: string; title: string; desc?: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-b border-line bg-surface-2/65">
      <div className="container-page max-w-4xl py-10 sm:py-14">
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-[42px]">{title}</h1>
        {desc && <p className="mt-4 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{desc}</p>}
        {children}
      </div>
    </section>
  );
}

/** Long-form legal/info copy with comfortable reading measure. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="container-page max-w-4xl py-9 text-[15px] leading-7 text-muted sm:py-12 sm:text-base [&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-fg [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:text-fg [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}
