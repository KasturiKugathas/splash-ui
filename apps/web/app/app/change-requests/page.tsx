export default function ChangeRequestsPage() {
  return (
    <main className="app-page">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">Workflow</p>
          <h1 className="page-title" style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)" }}>
            Change requests
          </h1>
          <p className="page-subtitle">
            Approval workflow is the next major phase. This section will become the home for PR
            status, approval routing, and change history.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel__body">
          <div className="empty-state">
            <strong>No dedicated change request inbox yet</strong>
            <span>
              Create PRs from the editor for now. This area is reserved for the upcoming approval
              and review workflow.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
