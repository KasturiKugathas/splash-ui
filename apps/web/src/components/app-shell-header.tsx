"use client";

import Link from "next/link";

import { useAuth } from "../contexts/auth-context";

export default function AppShellHeader() {
  const { status, user, logout } = useAuth();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "18px 24px",
        borderBottom: "1px solid var(--line)",
        background: "rgba(255, 252, 245, 0.86)",
        backdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <Link href="/app" style={{ textDecoration: "none", color: "inherit", fontWeight: 700 }}>
          Splash-UI
        </Link>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          {status === "authenticated" && user
            ? `Signed in as ${user.name} (@${user.login})`
            : status === "loading"
              ? "Checking session..."
              : "Not signed in"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user?.html_url ? (
          <a href={user.html_url} rel="noreferrer" style={{ color: "var(--accent)" }} target="_blank">
            View GitHub profile
          </a>
        ) : null}
        <button
          onClick={() => void logout()}
          style={{
            borderRadius: 999,
            border: "1px solid var(--line)",
            background: "transparent",
            padding: "10px 14px",
          }}
          type="button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
