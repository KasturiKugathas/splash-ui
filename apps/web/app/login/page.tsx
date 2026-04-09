"use client";

import { useEffect, useState } from "react";

import { useAuth } from "../../src/contexts/auth-context";

export default function LoginPage() {
  const { login, status, error } = useAuth();
  const [nextPath, setNextPath] = useState("/app");
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") ?? "/app");
    setQueryError(params.get("error"));
  }, []);

  const loginError = queryError ?? error;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          maxWidth: 500,
          width: "100%",
          borderRadius: 28,
          border: "1px solid var(--line)",
          background: "var(--panel)",
          boxShadow: "var(--shadow)",
          padding: 28,
          display: "grid",
          gap: 18,
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <h1 style={{ margin: 0 }}>Sign in to Splash-UI</h1>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            Use GitHub OAuth to browse repositories you can access and create pull requests from
            the editor.
          </p>
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: 16,
            background: "var(--panel-strong)",
            border: "1px solid var(--line)",
            display: "grid",
            gap: 8,
          }}
        >
          <strong>Local setup note</strong>
          <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            Keep both apps on <code>localhost</code> in local development so the auth session cookie
            works across the web app and API.
          </span>
        </div>

        {loginError ? (
          <div
            role="alert"
            style={{
              borderRadius: 18,
              padding: 16,
              background: "#fff1eb",
              border: "1px solid #f2c0a6",
              color: "#8a3f1f",
              lineHeight: 1.6,
            }}
          >
            {loginError}
          </div>
        ) : null}

        <button
          disabled={status === "loading"}
          onClick={() => login(nextPath)}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 999,
            border: 0,
            background: "var(--accent)",
            color: "#f7f4ec",
            cursor: status === "loading" ? "wait" : "pointer",
            opacity: status === "loading" ? 0.7 : 1,
          }}
          type="button"
        >
          {status === "loading" ? "Checking session..." : "Continue with GitHub"}
        </button>
      </section>
    </main>
  );
}
