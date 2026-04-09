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
    <section className="surface" style={{ overflow: "hidden" }}>
      <button
        onClick={() => setIsOpen((value) => !value)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          padding: "16px 18px",
          border: 0,
          background: "var(--panel-muted)",
          textAlign: "left",
        }}
        type="button"
      >
        <div className="stack" style={{ gap: 4 }}>
          <strong>{title}</strong>
          {description ? <span className="meta-text">{description}</span> : null}
        </div>
        <span className="meta-text" style={{ fontSize: 20 }}>
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen ? <div className="stack" style={{ padding: 18 }}>{children}</div> : null}
    </section>
  );
}
