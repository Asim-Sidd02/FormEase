import Link from "next/link";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M9 10.5h9.5M9 16h6" stroke="var(--brand-fg)" strokeWidth="2.6" strokeLinecap="round" opacity=".55" />
      <path d="M13.5 21.5l3.2 3 6.8-8" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 rounded-lg" aria-label="FormEase home">
      <LogoMark className="size-8 transition-transform group-hover:-rotate-6" />
      <span className="font-display text-[21px] font-semibold tracking-tight">
        Form<span className="text-brand">Ease</span>
      </span>
    </Link>
  );
}
