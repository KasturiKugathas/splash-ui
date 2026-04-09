import Link from "next/link";

export default function HomePage() {
  return (
    <main className="public-shell">
      <section className="public-card">
        <div className="stack-lg">
          <p className="eyebrow">Splash-UI</p>
          <div className="stack-lg" style={{ gap: 14 }}>
            <h1 className="page-title">Govern config changes without adding dashboard noise.</h1>
            <p className="page-subtitle">
              Sign in with GitHub, browse the repositories you already have access to, edit
              configuration files in a calmer workspace, and open pull requests from one place.
            </p>
          </div>
        </div>

        <div className="toolbar">
          <div className="toolbar-actions">
            <Link className="button-primary" href="/login">
              Sign in with GitHub
            </Link>
            <Link className="button-secondary" href="/app/repositories">
              Open workspace
            </Link>
          </div>
          <span className="pill">Minimal UI refresh in progress</span>
        </div>

        <div className="page-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <section className="surface" style={{ padding: 20 }}>
            <p className="eyebrow">Browse</p>
            <h2 className="panel__title">Repository access</h2>
            <p className="page-subtitle">View the repositories and supported config files tied to your GitHub login.</p>
          </section>
          <section className="surface" style={{ padding: 20 }}>
            <p className="eyebrow">Edit</p>
            <h2 className="panel__title">Draft safely</h2>
            <p className="page-subtitle">Keep drafts around while you work, then reopen or delete them when you decide.</p>
          </section>
          <section className="surface" style={{ padding: 20 }}>
            <p className="eyebrow">Ship</p>
            <h2 className="panel__title">Open pull requests</h2>
            <p className="page-subtitle">Create GitHub branches and PRs from the editor instead of copying changes by hand.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
