import Link from "next/link";

export default function ProtectedAppPage() {
  return (
    <main className="app-page">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">Workspace</p>
          <h1 className="page-title" style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)" }}>
            A simpler place to move config changes forward.
          </h1>
          <p className="page-subtitle">
            Browse repositories, keep drafts while you work, and open pull requests without the
            visual clutter of a traditional admin dashboard.
          </p>
        </div>
        <div className="toolbar-actions">
          <Link className="button-primary" href="/app/repositories">
            Open repositories
          </Link>
          <Link className="button-secondary" href="/app/change-requests">
            Review workflow
          </Link>
        </div>
      </header>

      <section className="page-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <article className="panel">
          <div className="panel__body">
            <p className="eyebrow">Repositories</p>
            <h2 className="panel__title">Live GitHub access</h2>
            <p className="page-subtitle">
              Search repositories, inspect supported config files, and preview contents before
              opening the editor.
            </p>
          </div>
        </article>
        <article className="panel">
          <div className="panel__body">
            <p className="eyebrow">Editor</p>
            <h2 className="panel__title">Persistent drafts</h2>
            <p className="page-subtitle">
              Keep multiple saved drafts per file so you can come back later or clean them up when
              they are no longer useful.
            </p>
          </div>
        </article>
        <article className="panel">
          <div className="panel__body">
            <p className="eyebrow">Workflow</p>
            <h2 className="panel__title">PR-ready changes</h2>
            <p className="page-subtitle">
              Serialize JSON and YAML safely, create branches, and send updates to GitHub from the
              same workspace.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
