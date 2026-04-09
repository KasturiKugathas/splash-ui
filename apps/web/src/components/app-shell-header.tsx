"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../contexts/auth-context";

const navItems = [
  { href: "/app", label: "Home", section: "Workspace" },
  { href: "/app/repositories", label: "Repositories", section: "Workspace" },
  { href: "/app/editor", label: "Editor", section: "Workspace" },
  { href: "/app/change-requests", label: "Change Requests", section: "Workflow" },
];

function isActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }

  return pathname.startsWith(href);
}

export default function AppShellHeader() {
  const pathname = usePathname();
  const { status, user, logout } = useAuth();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <Link href="/app">Splash-UI</Link>
        <span className="app-sidebar__label">
          Minimal GitHub-based config editing with drafts and pull requests.
        </span>
      </div>

      <nav className="app-nav" aria-label="Primary navigation">
        <div className="app-nav__section">Workspace</div>
        {navItems
          .filter((item) => item.section === "Workspace")
          .map((item) => (
            <Link
              key={item.href}
              className={`app-nav__link ${isActive(pathname, item.href) ? "app-nav__link--active" : ""}`}
              href={item.href}
            >
              <span>{item.label}</span>
            </Link>
          ))}

        <div className="app-nav__section">Workflow</div>
        {navItems
          .filter((item) => item.section === "Workflow")
          .map((item) => (
            <Link
              key={item.href}
              className={`app-nav__link ${isActive(pathname, item.href) ? "app-nav__link--active" : ""}`}
              href={item.href}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        <span className="app-nav__link--muted">Approvals soon</span>
      </nav>

      <div className="app-sidebar__footer">
        <div className="app-user-card">
          <span className="app-user-card__name">
            {status === "authenticated" && user ? user.name : "Checking session"}
          </span>
          <span className="app-user-card__meta">
            {status === "authenticated" && user ? `@${user.login}` : "GitHub authentication"}
          </span>
          {user?.html_url ? (
            <a className="meta-text" href={user.html_url} rel="noreferrer" target="_blank">
              Open GitHub profile
            </a>
          ) : null}
        </div>
        <button className="button-secondary" onClick={() => void logout()} type="button">
          Logout
        </button>
      </div>
    </aside>
  );
}
