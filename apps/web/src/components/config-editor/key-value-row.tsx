"use client";

import type { ReactNode } from "react";

export default function KeyValueRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <label style={styles.root}>
      <div style={styles.labelColumn}>
        <strong>{label}</strong>
        <span style={styles.hint}>{hint}</span>
      </div>
      <div>{children}</div>
    </label>
  );
}

const styles = {
  root: {
    display: "grid",
    gridTemplateColumns: "minmax(160px, 0.8fr) minmax(0, 1.2fr)",
    gap: 16,
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.72)",
  },
  labelColumn: {
    display: "grid",
    gap: 4,
  },
  hint: {
    color: "var(--muted)",
    fontSize: 12,
    wordBreak: "break-all" as const,
  },
};
