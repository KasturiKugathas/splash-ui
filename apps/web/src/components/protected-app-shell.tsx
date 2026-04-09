"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppShellHeader from "./app-shell-header";
import { useAuth } from "../contexts/auth-context";

export default function ProtectedAppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "anonymous") {
      return;
    }

    const next =
      typeof window === "undefined"
        ? pathname
        : `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [pathname, router, status]);

  if (status === "loading") {
    return (
      <main className="public-shell">
        <div className="empty-state" style={{ width: "min(100%, 360px)" }}>
          <strong>Checking your session</strong>
          <span>Loading your GitHub workspace.</span>
        </div>
      </main>
    );
  }

  if (status === "anonymous") {
    return null;
  }

  return (
    <div className="app-shell">
      <AppShellHeader />
      <div className="app-main">{children}</div>
    </div>
  );
}
