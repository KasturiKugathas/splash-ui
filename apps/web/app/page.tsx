import Link from "next/link";

export default function HomePage() {
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
          maxWidth: 900,
          borderRadius: 32,
          border: "1px solid var(--line)",
          background: "var(--panel)",
          boxShadow: "var(--shadow)",
          padding: "40px clamp(24px, 4vw, 48px)",
          display: "grid",
          gap: 22,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--accent)",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Splash-UI
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(2.8rem, 6vw, 5.5rem)", lineHeight: 0.95 }}>
          Govern config changes through a safer GitHub workflow.
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", maxWidth: 720, lineHeight: 1.7 }}>
          The local scaffold now includes GitHub OAuth login, a live repository browser, and an
          editor flow for JSON, YAML, and XML configuration files.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              borderRadius: 999,
              padding: "12px 18px",
              background: "var(--accent)",
              color: "#f7f4ec",
            }}
          >
            Go to login
          </Link>
          <Link
            href="/app/repositories"
            style={{
              textDecoration: "none",
              borderRadius: 999,
              padding: "12px 18px",
              border: "1px solid var(--line)",
            }}
          >
            View repository shell
          </Link>
        </div>
      </section>
    </main>
  );
}
