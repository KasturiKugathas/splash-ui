import Link from "next/link";

export default function ProtectedAppPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <section
        style={{
          maxWidth: 760,
          width: "100%",
          borderRadius: 28,
          border: "1px solid var(--line)",
          background: "var(--panel)",
          boxShadow: "var(--shadow)",
          padding: 32,
          display: "grid",
          gap: 18,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--accent)",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Protected area
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(2.2rem, 4vw, 3.5rem)" }}>Splash-UI workspace</h1>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
          Phase 2 adds the first repository browser shell. Continue into the GitHub workspace to
          inspect accessible repositories, browse supported config files, and preview content.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/repositories"
            style={{
              textDecoration: "none",
              borderRadius: 999,
              padding: "12px 18px",
              background: "var(--accent)",
              color: "#f7f4ec",
            }}
          >
            Open repositories
          </Link>
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              borderRadius: 999,
              padding: "12px 18px",
              border: "1px solid var(--line)",
            }}
          >
            Return to login
          </Link>
        </div>
      </section>
    </main>
  );
}
