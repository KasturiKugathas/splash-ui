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
    <main className="public-shell">
      <section className="public-card public-card--compact">
        <div className="stack-lg">
          <p className="eyebrow">Welcome</p>
          <div className="stack-lg" style={{ gap: 12 }}>
            <h1 className="page-title" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Sign in to Splash-UI
            </h1>
            <p className="page-subtitle">
              Authenticate with GitHub, then move straight into a quieter repository and config
              editing workspace.
            </p>
          </div>
        </div>

        <section className="surface" style={{ padding: 24, display: "grid", gap: 16 }}>
          <div className="note">
            <strong>Local setup note</strong>
            <span className="meta-text">
              Keep both apps on <code>localhost</code> so the session cookie works correctly across
              the web app and API.
            </span>
          </div>

          {loginError ? (
            <div className="alert" role="alert">
              <strong>Login error</strong>
              <span>{loginError}</span>
            </div>
          ) : null}

          <button
            className={`button-primary ${status === "loading" ? "button-disabled" : ""}`}
            disabled={status === "loading"}
            onClick={() => login(nextPath)}
            type="button"
          >
            {status === "loading" ? "Checking your session..." : "Continue with GitHub"}
          </button>
        </section>
      </section>
    </main>
  );
}
