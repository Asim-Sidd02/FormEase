"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Compass, Home, LayoutDashboard, LogOut, Menu, Route, Search, Settings, ShieldCheck, User as UserIcon, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme";
import { CommandSearch, useCommandSearch } from "./command-search";
import { buttonClass, cn, Kbd } from "./ui";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { dueReminders } from "@/lib/reminders";

const NAV = [
  { href: "/search", label: "Browse guides" },
  { href: "/schemes", label: "New schemes" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/how-we-verify", label: "How we verify" },
  { href: "/help", label: "Help" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useStore((s) => s.user);
  const reminders = useStore((s) => s.reminders);
  const signOut = useStore((s) => s.signOut);
  const { open, setOpen } = useCommandSearch();
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setMenu(false);
    setMobile(false);
  }, [pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const due = hydrated ? dueReminders(reminders).length : 0;
  const signedIn = hydrated && user;
  const initials = user?.name?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() ?? "";

  return (
    <>
      <a href="#main" className="sr-only z-[100] rounded-lg bg-brand px-4 py-2 font-semibold text-brand-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background,border-color,box-shadow] duration-200",
          scrolled ? "border-line bg-surface/95 shadow-[0_2px_10px_rgba(20,42,32,0.035)] backdrop-blur-xl" : "border-line bg-surface",
        )}
      >
        <div className="container-page flex h-[68px] items-center gap-3">
          <Logo />
          <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-md px-3 py-2 text-[13px] font-semibold transition",
                  pathname.startsWith(n.href) ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/70 hover:text-fg",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setOpen(true)}
              className="hidden h-10 w-56 items-center gap-2.5 whitespace-nowrap rounded-lg border border-line bg-bg px-3 text-[13px] text-subtle transition hover:border-line-strong hover:bg-surface md:flex"
              aria-label="Search processes"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate text-left">Search processes…</span>
              <Kbd>Ctrl K</Kbd>
            </button>
            <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg md:hidden" aria-label="Search processes">
              <Search className="size-[19px]" />
            </button>
            <ThemeToggle />

            {signedIn ? (
              <>
              <Link href="/reminders" className="relative hidden size-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg sm:grid" aria-label={`Reminders${due ? `, ${due} due` : ""}`}>
                  <Bell className="size-[19px]" />
                  {due > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-accent ring-2 ring-bg" />}
                </Link>
                <span className="hidden lg:block">
                  <Link href="/journeys" className={buttonClass("secondary", "md")}>
                    <Route className="size-4" /> My journeys
                  </Link>
                </span>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenu((m) => !m)}
                    aria-expanded={menu}
                    aria-haspopup="menu"
                    className="ml-1 grid size-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand ring-1 ring-brand/10 transition hover:ring-brand/30"
                    aria-label="Account menu"
                  >
                    {initials}
                  </button>
                  {menu && (
                    <div role="menu" className="absolute right-0 top-12 w-64 animate-scale-in rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
                      <div className="px-3 py-2.5">
                        <p className="truncate font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-line" />
                      <MenuLink href="/journeys" icon={<Route className="size-4" />}>My journeys</MenuLink>
                      <MenuLink href="/reminders" icon={<Bell className="size-4" />}>Reminders {due > 0 && <span className="ml-auto rounded-full bg-accent-soft px-1.5 text-xs font-bold text-warning">{due}</span>}</MenuLink>
                      <MenuLink href="/account" icon={<Settings className="size-4" />}>Account & privacy</MenuLink>
                      {user.role !== "user" && <MenuLink href="/admin" icon={<ShieldCheck className="size-4" />}>Content console</MenuLink>}
                      <div className="my-1 h-px bg-line" />
                      <button
                        role="menuitem"
                        onClick={() => {
                          signOut();
                          router.push("/");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg"
                      >
                        <LogOut className="size-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="ml-1 hidden sm:block">
                <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`} className={buttonClass("primary", "md")}>
                  Sign in
                </Link>
              </span>
            )}
            <button onClick={() => setMobile(true)} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-2 lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {mobile && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setMobile(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label="Menu" className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm animate-slide-left flex-col bg-surface p-4 shadow-lift">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobile(false)} className="rounded-lg p-2 text-muted hover:bg-surface-2" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
              {[{ href: "/", label: "Home" }, ...NAV, { href: "/about", label: "About FormEase" }, { href: "/report", label: "Report an issue" }].map((n) => (
                <Link key={n.href} href={n.href} className={cn("rounded-xl px-3 py-3 text-[15px] font-semibold", pathname === n.href ? "bg-brand-soft text-brand" : "hover:bg-surface-2")}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-2 border-t border-line pt-4">
              {signedIn ? (
                <>
                  {user.role !== "user" && (
                    <Link href="/admin" className={buttonClass("outline", "lg", "w-full")}>
                      <ShieldCheck className="size-4" /> Content console
                    </Link>
                  )}
                  <Link href="/account" className={buttonClass("secondary", "lg", "w-full")}>
                    <Settings className="size-4" /> Account & privacy
                  </Link>
                </>
              ) : (
                <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`} className={buttonClass("primary", "lg", "w-full")}>
                  Sign in to save progress
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <CommandSearch open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link role="menuitem" href={href} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg">
      {icon}
      {children}
    </Link>
  );
}

/** Mobile bottom navigation — thumb-friendly primary actions. */
export function MobileTabBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const reminders = useStore((s) => s.reminders);
  const due = hydrated ? dueReminders(reminders).length : 0;
  if (pathname.startsWith("/admin") || /\/start$/.test(pathname)) return null;
  const items = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { href: "/search", label: "Guides", icon: Compass, match: (p: string) => p.startsWith("/search") || p.startsWith("/process") || p.startsWith("/category") },
    { href: "/journeys", label: "Journeys", icon: LayoutDashboard, match: (p: string) => p.startsWith("/journey") },
    { href: "/reminders", label: "Reminders", icon: Bell, match: (p: string) => p.startsWith("/reminders"), badge: due },
    { href: "/account", label: "Account", icon: UserIcon, match: (p: string) => p.startsWith("/account") || p.startsWith("/sign-in") },
  ];
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: I, match, badge }) => {
          const on = match(pathname);
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? "page" : undefined} className={cn("relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold", on ? "text-brand" : "text-subtle")}>
                <I className="size-[21px]" aria-hidden strokeWidth={on ? 2.4 : 2} />
                {label}
                {!!badge && <span className="absolute right-[calc(50%-18px)] top-1.5 size-2 rounded-full bg-accent" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
