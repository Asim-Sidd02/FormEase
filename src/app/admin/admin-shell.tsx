"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, FileStack, History, Inbox, LayoutDashboard, Lock } from "lucide-react";
import { useHydrated, useAllProcesses } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { buttonClass, cn, Skeleton } from "@/components/ui";
import type { Role } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/processes", label: "Processes", icon: FileStack },
  { href: "/admin/reviews", label: "Review queue", icon: ClipboardCheck, badge: "reviews" as const },
  { href: "/admin/feedback", label: "User reports", icon: Inbox, badge: "reports" as const },
  { href: "/admin/audit", label: "Audit log", icon: History },
];

export const ROLE_CAN = {
  edit: (r: Role) => r === "author" || r === "admin",
  review: (r: Role) => r === "reviewer" || r === "admin",
  triage: (r: Role) => r !== "user",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const user = useStore((s) => s.user);
  const reports = useStore((s) => s.reports);
  const processes = useAllProcesses();

  if (!hydrated)
    return (
      <div className="container-page pt-10">
        <Skeleton className="h-96" />
      </div>
    );

  if (!user || user.role === "user") {
    return (
      <div className="container-page flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
          <Lock className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">Team members only</h1>
        <p className="mt-2 text-muted">The content console is for FormEase authors, reviewers and administrators.</p>
        <p className="mt-4 rounded-xl border border-info/25 bg-info-soft px-3 py-2 text-[13px] text-info">
          Preview: {user ? "switch your role under Account → Team access." : "sign in, then switch your role under Account → Team access."}
        </p>
        <Link href={user ? "/account" : "/sign-in?next=/account"} className={buttonClass("primary", "md", "mt-6")}>
          {user ? "Go to Account" : "Sign in"}
        </Link>
      </div>
    );
  }

  const counts = {
    reviews: processes.filter((p) => ["in_review", "review_due", "needs_update"].includes(p.status)).length,
    reports: reports.filter((r) => r.status === "new").length,
  };

  return (
    <div className="container-page grid gap-6 pb-10 pt-6 lg:grid-cols-[220px_1fr] lg:pt-8">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-3 hidden rounded-2xl border border-line bg-surface p-3.5 lg:block">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Content console</p>
          <p className="mt-1 truncate text-sm font-semibold">{user.name}</p>
          <p className="text-xs capitalize text-brand">{user.role}</p>
        </div>
        <nav aria-label="Console" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
          {NAV.map((n) => {
            const on = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            const c = n.badge ? counts[n.badge] : 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={cn("flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition", on ? "bg-brand text-brand-fg" : "text-muted hover:bg-surface-2 hover:text-fg")}
              >
                <n.icon className="size-4" /> {n.label}
                {c > 0 && <span className={cn("ml-auto rounded-full px-1.5 text-xs font-bold", on ? "bg-white/20" : "bg-accent-soft text-warning")}>{c}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
