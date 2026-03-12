export default function ProtectedAppPage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Protected Area</h1>
      <p>If middleware is working, unauthenticated users are redirected to /login.</p>
    </main>
  );
}
