"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ConfigTreeRenderer from "./config-tree-renderer";
import { getConfigTree, type ConfigNode, type ConfigTreeResponse } from "../../lib/config-tree";

type ToastState = {
  title: string;
  detail: string;
};

function ErrorBanner({ toast }: { toast: ToastState }) {
  return (
    <div style={bannerStyles.root} role="alert">
      <strong>{toast.title}</strong>
      <span>{toast.detail}</span>
    </div>
  );
}

export default function ConfigEditor({
  repository,
  path,
}: {
  repository: string;
  path: string;
}) {
  const [response, setResponse] = useState<ConfigTreeResponse | null>(null);
  const [draftTree, setDraftTree] = useState<ConfigNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTree() {
      if (!repository || !path) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setToast(null);

      try {
        const nextResponse = await getConfigTree(repository, path);
        if (!active) {
          return;
        }
        console.log("config-tree", nextResponse);
        setResponse(nextResponse);
        setDraftTree(nextResponse.tree);
      } catch (error) {
        if (!active) {
          return;
        }
        setToast({
          title: "Could not load config tree",
          detail: error instanceof Error ? error.message : "Unexpected API error.",
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTree();

    return () => {
      active = false;
    };
  }, [path, repository]);

  if (!repository || !path) {
    return (
      <main style={pageStyles.shell}>
        <section style={pageStyles.card}>
          <p style={pageStyles.eyebrow}>Phase 2.1</p>
          <h1 style={pageStyles.title}>Config editor</h1>
          <div style={pageStyles.emptyState}>
            <strong>No file selected</strong>
            <span>Open the repository browser first and choose a supported config file.</span>
            <Link href="/repositories" style={pageStyles.linkButton}>
              Back to repositories
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyles.shell}>
      <section style={pageStyles.card}>
        <div style={pageStyles.header}>
          <div style={{ display: "grid", gap: 10 }}>
            <p style={pageStyles.eyebrow}>Phase 2.1</p>
            <h1 style={pageStyles.title}>Config editor</h1>
            <p style={pageStyles.subtitle}>
              Review the normalized config tree, then adjust scalar values in place. Persistence is
              not wired yet; this phase focuses on parsing and rendering.
            </p>
          </div>
          <Link href={`/repositories`} style={pageStyles.secondaryLink}>
            Back to repositories
          </Link>
        </div>

        <div style={pageStyles.metaGrid}>
          <div style={pageStyles.metaCard}>
            <strong>Repository</strong>
            <span>{repository}</span>
          </div>
          <div style={pageStyles.metaCard}>
            <strong>File</strong>
            <span>{path}</span>
          </div>
        </div>

        {toast ? <ErrorBanner toast={toast} /> : null}

        {loading ? (
          <div style={pageStyles.emptyState}>
            <strong>Loading config structure</strong>
            <span>Fetching and normalizing the selected file.</span>
          </div>
        ) : draftTree && draftTree.children.length > 0 ? (
          <ConfigTreeRenderer node={draftTree} onNodeChange={setDraftTree} />
        ) : (
          <div style={pageStyles.emptyState}>
            <strong>No editable fields found</strong>
            <span>The selected file parsed successfully but did not produce any editable nodes.</span>
          </div>
        )}

        {response ? (
          <section style={pageStyles.debugPanel}>
            <div style={pageStyles.debugHeader}>
              <strong>Normalized structure</strong>
              <span>Current editor state for this file.</span>
            </div>
            <pre style={pageStyles.pre}>{JSON.stringify(draftTree ?? response.tree, null, 2)}</pre>
          </section>
        ) : null}
      </section>
    </main>
  );
}

const pageStyles = {
  shell: {
    padding: "32px clamp(20px, 3vw, 44px) 48px",
  },
  card: {
    display: "grid",
    gap: 20,
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--line)",
    background: "var(--panel)",
    boxShadow: "var(--shadow)",
    padding: "28px clamp(18px, 2vw, 32px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "start",
    flexWrap: "wrap" as const,
  },
  eyebrow: {
    margin: 0,
    color: "var(--accent)",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontSize: 12,
  },
  title: {
    margin: 0,
    fontSize: "clamp(2rem, 4vw, 3.6rem)",
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    maxWidth: 760,
    color: "var(--muted)",
    lineHeight: 1.6,
  },
  secondaryLink: {
    textDecoration: "none",
    borderRadius: 999,
    border: "1px solid var(--line)",
    padding: "12px 18px",
    alignSelf: "start",
  },
  linkButton: {
    textDecoration: "none",
    borderRadius: 999,
    background: "var(--accent)",
    color: "#f7f4ec",
    padding: "12px 18px",
    justifySelf: "start",
  },
  metaGrid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  },
  metaCard: {
    display: "grid",
    gap: 6,
    padding: 16,
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.7)",
    color: "var(--muted)",
    wordBreak: "break-word" as const,
  },
  emptyState: {
    display: "grid",
    gap: 8,
    padding: 24,
    borderRadius: "var(--radius-lg)",
    border: "1px dashed var(--line)",
    background: "rgba(255,255,255,0.6)",
    color: "var(--muted)",
  },
  debugPanel: {
    display: "grid",
    gap: 10,
  },
  debugHeader: {
    display: "grid",
    gap: 4,
    color: "var(--muted)",
  },
  pre: {
    margin: 0,
    padding: 18,
    borderRadius: "var(--radius-lg)",
    background: "#1f1a14",
    color: "#f8efe0",
    overflowX: "auto" as const,
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: 13,
    lineHeight: 1.6,
  },
};

const bannerStyles = {
  root: {
    display: "grid",
    gap: 6,
    padding: 16,
    borderRadius: "var(--radius-lg)",
    border: "1px solid rgba(180, 35, 24, 0.24)",
    background: "var(--warn-soft)",
    color: "#7a271a",
  },
};
