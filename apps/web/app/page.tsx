import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Splash-UI</h1>
      <p>Phase 1 scaffold is ready.</p>
      <Link href="/login">Go to Login</Link>
    </main>
  );
}
