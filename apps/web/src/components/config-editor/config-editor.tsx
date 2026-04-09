"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ConfigTreeRenderer from "./config-tree-renderer";
import {
  createChangeRequest,
  openPullRequest,
  type ChangeRequest,
} from "../../lib/change-requests";
import { getConfigTree, type ConfigTreeResponse } from "../../lib/config-tree";
import type { ConfigNode } from "../../lib/config-node";

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
  const [activeTab, setActiveTab] = useState<"structure" | "draft">("structure");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [openingPr, setOpeningPr] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const isDirty =
    response !== null && draftTree !== null && JSON.stringify(response.tree) !== JSON.stringify(draftTree);

  const validationMessage =
    draftTree && draftTree.children.length > 0
      ? "Validation placeholder: schema rules and server validation are not wired yet."
      : "Validation placeholder: no editable nodes were produced for the selected file.";

  const resetChanges = () => {
    if (!response) {
      return;
    }
    setDraftTree(response.tree);
    setSaveMessage(null);
  };

  const handleSaveDraft = async () => {
    if (!draftTree) {
      return null;
    }

    setSavingDraft(true);
    setToast(null);

    try {
      const nextChangeRequest = await createChangeRequest(repository, path, draftTree);
      setChangeRequest(nextChangeRequest);
      setSaveMessage(`Draft ${nextChangeRequest.id} saved for ${path}.`);
      return nextChangeRequest;
    } catch (error) {
      setToast({
        title: "Could not save draft",
        detail: error instanceof Error ? error.message : "Unexpected API error.",
      });
      return null;
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCreatePullRequest = async () => {
    if (!draftTree || !isDirty) {
      return;
    }

    setOpeningPr(true);
    setToast(null);

    try {
      const draft = changeRequest ?? (await createChangeRequest(repository, path, draftTree));
      if (!draft) {
        return;
      }

      setChangeRequest(draft);
      const nextChangeRequest = await openPullRequest(draft.id);
      setChangeRequest(nextChangeRequest);
      setSaveMessage(`Pull request #${nextChangeRequest.pull_request_number} opened.`);
      setResponse((currentResponse) =>
        currentResponse && draftTree
          ? {
              ...currentResponse,
              tree: draftTree,
            }
          : currentResponse
      );
    } catch (error) {
      setToast({
        title: "Could not create pull request",
        detail: error instanceof Error ? error.message : "Unexpected API error.",
      });
    } finally {
      setOpeningPr(false);
    }
  };

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
        setChangeRequest(null);
        setSaveMessage(null);
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

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSaveDraft();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [path]);

  if (!repository || !path) {
    return (
      <main style={pageStyles.shell}>
        <section style={pageStyles.card}>
          <p style={pageStyles.eyebrow}>Phase 2.1</p>
          <h1 style={pageStyles.title}>Config editor</h1>
          <div style={pageStyles.emptyState}>
            <strong>No file selected</strong>
            <span>Open the repository browser first and choose a supported config file.</span>
            <Link href="/app/repositories" style={pageStyles.linkButton}>
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
            <p style={pageStyles.eyebrow}>Phase 4</p>
            <h1 style={pageStyles.title}>Config editor</h1>
            <p style={pageStyles.subtitle}>
              Review the normalized config tree, adjust scalar values, then create a branch, commit,
              and pull request for JSON/YAML changes.
            </p>
          </div>
          <Link href={`/app/repositories`} style={pageStyles.secondaryLink}>
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
          <div style={pageStyles.metaCard}>
            <strong>Editor state</strong>
            <span>{isDirty ? "Unsaved changes" : "All changes reset"}</span>
          </div>
        </div>

        {toast ? <ErrorBanner toast={toast} /> : null}
        {saveMessage ? (
          <div style={pageStyles.infoBanner}>
            <strong>Save draft</strong>
            <span>{saveMessage}</span>
          </div>
        ) : null}

        {loading ? (
          <div style={pageStyles.emptyState}>
            <strong>Loading config structure</strong>
            <span>Fetching and normalizing the selected file.</span>
          </div>
        ) : (
          <>
            <div style={pageStyles.toolbar}>
              <div style={pageStyles.tabs}>
                {[
                  { id: "structure", label: "Structure" },
                  { id: "draft", label: "Draft JSON" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as "structure" | "draft")}
                    style={{
                      ...pageStyles.tabButton,
                      ...(activeTab === tab.id ? pageStyles.tabButtonActive : null),
                    }}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={pageStyles.actions}>
                <button
                  disabled={!isDirty}
                  onClick={resetChanges}
                  style={{
                    ...pageStyles.secondaryButton,
                    ...(isDirty ? null : pageStyles.buttonDisabled),
                  }}
                  type="button"
                >
                  Reset changes
                </button>
                <button
                  disabled={!draftTree || savingDraft}
                  onClick={() => void handleSaveDraft()}
                  style={{
                    ...pageStyles.secondaryButton,
                    ...(savingDraft ? pageStyles.buttonDisabled : null),
                  }}
                  type="button"
                >
                  {savingDraft ? "Saving draft..." : "Save draft"}
                </button>
                <button
                  disabled={!isDirty || !draftTree || openingPr}
                  onClick={() => void handleCreatePullRequest()}
                  style={{
                    ...pageStyles.primaryButton,
                    ...(!isDirty || openingPr ? pageStyles.buttonDisabled : null),
                  }}
                  type="button"
                >
                  {openingPr ? "Creating PR..." : "Create PR"}
                </button>
              </div>
            </div>

            <section style={pageStyles.validationCard}>
              <strong>Validation</strong>
              <span>
                {path.endsWith(".xml")
                  ? "XML files are read-only for writeback until safe XML serialization is implemented."
                  : validationMessage}
              </span>
            </section>

            {changeRequest ? (
              <section style={pageStyles.statusCard}>
                <div style={pageStyles.statusHeader}>
                  <div>
                    <strong>PR workflow</strong>
                    <span>State: {changeRequest.state}</span>
                  </div>
                  {changeRequest.pull_request_url ? (
                    <a href={changeRequest.pull_request_url} rel="noreferrer" style={pageStyles.linkButton} target="_blank">
                      Open PR #{changeRequest.pull_request_number}
                    </a>
                  ) : null}
                </div>
                <ol style={pageStyles.timeline}>
                  {changeRequest.events.map((event) => (
                    <li key={`${event.created_at}-${event.label}`} style={pageStyles.timelineItem}>
                      <strong>{event.label}</strong>
                      <span>{event.detail}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {draftTree && draftTree.children.length > 0 ? (
              activeTab === "structure" ? (
                <ConfigTreeRenderer node={draftTree} onNodeChange={setDraftTree} />
              ) : (
                <section style={pageStyles.debugPanel}>
                  <div style={pageStyles.debugHeader}>
                    <strong>Draft payload</strong>
                    <span>Current in-memory state after inline edits.</span>
                  </div>
                  <pre style={pageStyles.pre}>{JSON.stringify(draftTree, null, 2)}</pre>
                </section>
              )
            ) : (
              <div style={pageStyles.emptyState}>
                <strong>No editable fields found</strong>
                <span>The selected file parsed successfully but did not produce any editable nodes.</span>
              </div>
            )}
          </>
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
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap" as const,
  },
  tabs: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
  },
  tabButton: {
    borderRadius: 999,
    border: "1px solid var(--line)",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },
  tabButtonActive: {
    background: "var(--accent-soft)",
    color: "var(--accent)",
    border: "1px solid rgba(15, 118, 110, 0.22)",
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
  },
  primaryButton: {
    borderRadius: 999,
    border: 0,
    padding: "12px 18px",
    background: "var(--accent)",
    color: "#f7f4ec",
    cursor: "pointer",
  },
  secondaryButton: {
    borderRadius: 999,
    border: "1px solid var(--line)",
    padding: "12px 18px",
    background: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  validationCard: {
    display: "grid",
    gap: 6,
    padding: 16,
    borderRadius: "var(--radius-lg)",
    border: "1px solid rgba(15, 118, 110, 0.16)",
    background: "rgba(15, 118, 110, 0.07)",
    color: "var(--muted)",
  },
  statusCard: {
    display: "grid",
    gap: 12,
    padding: 16,
    borderRadius: "var(--radius-lg)",
    border: "1px solid rgba(15, 118, 110, 0.2)",
    background: "rgba(255,255,255,0.72)",
  },
  statusHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "start",
    flexWrap: "wrap" as const,
  },
  timeline: {
    display: "grid",
    gap: 10,
    margin: 0,
    paddingLeft: 20,
    color: "var(--muted)",
  },
  timelineItem: {
    display: "grid",
    gap: 4,
  },
  debugPanel: {
    display: "grid",
    gap: 10,
  },
  infoBanner: {
    display: "grid",
    gap: 6,
    padding: 16,
    borderRadius: "var(--radius-lg)",
    border: "1px solid rgba(15, 118, 110, 0.16)",
    background: "rgba(15, 118, 110, 0.1)",
    color: "var(--accent)",
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
