import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./logo";

const cols = [
  {
    title: "Guides",
    links: [
      { href: "/search", label: "All guides" },
      { href: "/category/travel", label: "Travel & passport" },
      { href: "/category/identity", label: "Identity & documents" },
      { href: "/category/certificates", label: "Certificates" },
      { href: "/category/transport", label: "Driving & transport" },
    ],
  },
  {
    title: "FormEase",
    links: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/how-we-verify", label: "How we verify information" },
      { href: "/help", label: "Help & FAQ" },
      { href: "/report", label: "Report an issue" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of use" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface pb-24 md:pb-0">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-muted">Know what to do. Do it with confidence. Plain-language, source-backed guidance for India&apos;s official processes.</p>
          <div className="mt-5 flex gap-3 rounded-2xl border border-line bg-surface-2/60 p-3.5 text-[13px] text-muted">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <p>
              <strong className="text-fg">FormEase is independent.</strong> We are not a government website and are not affiliated with any government body. Applications, payments and final submissions happen only on official portals.
            </p>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-subtle">{c.title}</h2>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm font-medium text-muted transition hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FormEase. Guidance only — no guarantee of approval, eligibility or processing time.</p>
          <p>Rules change. The official portal is always the final authority.</p>
        </div>
      </div>
    </footer>
  );
}
