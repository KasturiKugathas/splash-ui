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
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div
          style={{
            borderRadius: 24,
            border: "1px solid var(--line)",
            background: "var(--panel)",
            padding: 24,
            boxShadow: "var(--shadow)",
          }}
        >
          Checking your session...
        </div>
      </main>
    );
  }

  if (status === "anonymous") {
    return null;
  }

  return (
    <>
      <AppShellHeader />
      {children}
    </>
  );
}
