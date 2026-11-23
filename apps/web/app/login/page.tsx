export default function LoginPage() {
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
          maxWidth: 460,
          width: "100%",
          borderRadius: 28,
          border: "1px solid var(--line)",
          background: "var(--panel)",
          boxShadow: "var(--shadow)",
          padding: 28,
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Sign in to Splash-UI</h1>
        <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
          Use email magic-link auth or GitHub OAuth to open the repository browser.
        </p>

        <form>
          <label htmlFor="email" style={{ display: "grid", gap: 8, fontSize: 14 }}>
            Work email
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              style={{
                display: "block",
                width: "100%",
                marginBottom: 16,
                padding: 12,
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "var(--panel-strong)",
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 999,
              border: 0,
              background: "var(--accent)",
              color: "#f7f4ec",
            }}
          >
            Send email login link
          </button>
        </form>

        <div style={{ margin: "16px 0", textAlign: "center", color: "var(--muted)" }}>or</div>

        <button
          type="button"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 999,
            border: "1px solid var(--line)",
            background: "transparent",
          }}
        >
          Continue with GitHub
        </button>
      </section>
    </main>
  );
}
