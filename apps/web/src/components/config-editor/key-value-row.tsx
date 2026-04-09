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
    <label
      className="surface"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(180px, 0.8fr) minmax(0, 1.2fr)",
        gap: 16,
        alignItems: "center",
        padding: 16,
      }}
    >
      <div className="stack" style={{ gap: 4 }}>
        <strong>{label}</strong>
        <span className="meta-text" style={{ wordBreak: "break-all" }}>
          {hint}
        </span>
      </div>
      <div>{children}</div>
    </label>
  );
}
