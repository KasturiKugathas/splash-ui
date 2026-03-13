"use client";

import type { ReactNode } from "react";
import { useState } from "react";

export default function ConfigSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section style={styles.root}>
      <button onClick={() => setIsOpen((value) => !value)} style={styles.header} type="button">
        <div style={{ display: "grid", gap: 4, textAlign: "left" }}>
          <strong>{title}</strong>
          {description ? <span style={styles.description}>{description}</span> : null}
        </div>
        <span style={styles.chevron}>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen ? <div style={styles.content}>{children}</div> : null}
    </section>
  );
}

const styles = {
  root: {
    border: "1px solid var(--line)",
    borderRadius: "var(--radius-lg)",
    background: "rgba(255, 255, 255, 0.7)",
    overflow: "hidden",
  },
  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "14px 16px",
    border: 0,
    background: "rgba(15, 118, 110, 0.08)",
    cursor: "pointer",
  },
  content: {
    padding: 16,
    display: "grid",
    gap: 14,
  },
  description: {
    color: "var(--muted)",
    fontSize: 13,
  },
  chevron: {
    fontSize: 28,
    lineHeight: 1,
    color: "var(--accent)",
  },
};
