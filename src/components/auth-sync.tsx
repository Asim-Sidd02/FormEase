"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";

/** Keeps the locally stored user in step with the server session cookie. */
export function AuthSync() {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ user: { email: string; name: string } | null }>)
      .then(({ user }) => {
        if (cancelled) return;
        const s = useStore.getState();
        if (!user) {
          if (s.user) useStore.setState({ user: null });
        } else if (s.user?.email !== user.email) {
          s.signIn(user.email, user.name);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hydrated]);
  return null;
}
