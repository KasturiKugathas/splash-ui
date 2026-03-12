export default function LoginPage() {
  return (
    <main style={{ maxWidth: 420, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Sign in to Splash-UI</h1>
      <form>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          style={{ display: "block", width: "100%", margin: "8px 0 16px", padding: 8 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Send email login link
        </button>
      </form>

      <div style={{ margin: "16px 0", textAlign: "center" }}>or</div>

      <button type="button" style={{ width: "100%", padding: 10 }}>
        Continue with GitHub
      </button>
    </main>
  );
}
