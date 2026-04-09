"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ConfigNode } from "../../lib/config-node";
import { getConfigTree, type ConfigTreeResponse } from "../../lib/config-tree";
import {
  clearDraftsForFile,
  deleteDraft,
  listDrafts,
  saveDraft,
  type SavedDraft,
} from "../../lib/drafts";
import {
  createChangeRequest,
  openPullRequest,
  type ChangeRequest,
} from "../../lib/change-requests";
import ConfigTreeRenderer from "./config-tree-renderer";

type ToastState = {
  title: string;
  detail: string;
};

function formatSavedAt(value: string) {
  return new Date(value).toLocaleString();
}

function ErrorBanner({ toast }: { toast: ToastState }) {
  return (
    <div className="alert" role="alert">
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
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"structure" | "draft">("structure");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [openingPr, setOpeningPr] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const isDirty = useMemo(() => {
    return response !== null && draftTree !== null && JSON.stringify(response.tree) !== JSON.stringify(draftTree);
  }, [draftTree, response]);

  const validationMessage =
    draftTree && draftTree.children.length > 0
      ? "Schema-aware validation is not wired yet. This editor is currently focused on careful structure changes."
      : "No editable nodes were produced for the selected file.";

  const refreshSavedDrafts = () => {
    if (!repository || !path) {
      setSavedDrafts([]);
      return;
    }

    setSavedDrafts(listDrafts(repository, path));
  };

  const resetChanges = () => {
    if (!response) {
      return;
    }
    setDraftTree(response.tree);
    setSaveMessage(null);
  };

  const handleSaveDraft = async () => {
    if (!draftTree) {
      return;
    }

    setSavingDraft(true);
    setToast(null);

    try {
      const nextDraft = saveDraft(repository, path, draftTree);
      refreshSavedDrafts();
      setSaveMessage(`Draft saved locally at ${formatSavedAt(nextDraft.savedAt)}.`);
    } catch (error) {
      setToast({
        title: "Could not save draft",
        detail: error instanceof Error ? error.message : "Unexpected draft persistence error.",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    deleteDraft(draftId);
    refreshSavedDrafts();
    setSaveMessage("Draft deleted.");
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    setDraftTree(draft.tree);
    setActiveTab("structure");
    setSaveMessage(`Loaded draft from ${formatSavedAt(draft.savedAt)}.`);
  };

  const handleCreatePullRequest = async () => {
    if (!draftTree || !isDirty) {
      return;
    }

    setOpeningPr(true);
    setToast(null);

    try {
      const draft = await createChangeRequest(repository, path, draftTree);
      setChangeRequest(draft);
      const nextChangeRequest = await openPullRequest(draft.id);
      setChangeRequest(nextChangeRequest);
      setResponse((currentResponse) =>
        currentResponse && draftTree
          ? {
              ...currentResponse,
              tree: draftTree,
            }
          : currentResponse
      );
      clearDraftsForFile(repository, path);
      refreshSavedDrafts();
      setSaveMessage(`Pull request #${nextChangeRequest.pull_request_number} opened. Local drafts cleared.`);
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

        setResponse(nextResponse);
        setDraftTree(nextResponse.tree);
        setChangeRequest(null);
        setSaveMessage(null);
        setSavedDrafts(listDrafts(repository, path));
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
        void handleSaveDraft();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [draftTree, path, repository]);

  if (!repository || !path) {
    return (
      <main className="app-page">
        <section className="panel">
          <div className="panel__body">
            <p className="eyebrow">Editor</p>
            <h1 className="panel__title">No file selected</h1>
            <div className="empty-state">
              <strong>Pick a file first</strong>
              <span>Open the repositories page and choose a supported config file to begin editing.</span>
            </div>
            <div>
              <Link className="button-secondary" href="/app/repositories">
                Back to repositories
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">Editor</p>
          <h1 className="page-title" style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)" }}>
            Edit configuration in a calmer workspace.
          </h1>
          <p className="page-subtitle">
            Keep local drafts while you work, reopen previous versions when needed, and turn
            finished JSON or YAML edits into pull requests.
          </p>
        </div>
        <Link className="button-secondary" href="/app/repositories">
          Back to repositories
        </Link>
      </header>

      {toast ? <ErrorBanner toast={toast} /> : null}
      {saveMessage ? (
        <div className="note">
          <strong>Editor update</strong>
          <span>{saveMessage}</span>
        </div>
      ) : null}

      <section className="page-grid page-grid--editor">
        <section className="panel">
          <div className="panel__header panel__header--stacked">
            <div>
              <h2 className="panel__title">{path.split("/").pop()}</h2>
              <p className="panel__subtitle">{repository}</p>
            </div>
            <div className="toolbar">
              <div className="tab-row">
                {[
                  { id: "structure", label: "Structure" },
                  { id: "draft", label: "Draft JSON" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? "tab-button--active" : ""}`}
                    onClick={() => setActiveTab(tab.id as "structure" | "draft")}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="toolbar-actions">
                <button
                  className={`button-secondary ${!isDirty ? "button-disabled" : ""}`}
                  disabled={!isDirty}
                  onClick={resetChanges}
                  type="button"
                >
                  Reset
                </button>
                <button
                  className={`button-secondary ${savingDraft ? "button-disabled" : ""}`}
                  disabled={!draftTree || savingDraft}
                  onClick={() => void handleSaveDraft()}
                  type="button"
                >
                  {savingDraft ? "Saving..." : "Save draft"}
                </button>
                <button
                  className={`button-primary ${!isDirty || openingPr ? "button-disabled" : ""}`}
                  disabled={!isDirty || !draftTree || openingPr}
                  onClick={() => void handleCreatePullRequest()}
                  type="button"
                >
                  {openingPr ? "Creating PR..." : "Create PR"}
                </button>
              </div>
            </div>
          </div>

          <div className="panel__body">
            {loading ? (
              <div className="empty-state">
                <strong>Loading config structure</strong>
                <span>Preparing the editor for the selected file.</span>
              </div>
            ) : activeTab === "structure" && draftTree ? (
              <ConfigTreeRenderer node={draftTree} onNodeChange={setDraftTree} />
            ) : (
              <pre className="code-block">{JSON.stringify(draftTree, null, 2)}</pre>
            )}
          </div>
        </section>

        <aside className="stack-lg">
          <section className="panel">
            <div className="panel__body">
              <div className="stack" style={{ gap: 8 }}>
                <span className="pill" style={{ width: "fit-content" }}>
                  {isDirty ? "Unsaved changes" : "No pending changes"}
                </span>
                <span className="meta-text">Path: {path}</span>
              </div>

              <div className="note">
                <strong>Validation</strong>
                <span>
                  {path.endsWith(".xml")
                    ? "XML files are still read-only for writeback until safe XML round-tripping is implemented."
                    : validationMessage}
                </span>
              </div>

              {changeRequest ? (
                <div className="surface-muted" style={{ padding: 16, display: "grid", gap: 8 }}>
                  <strong>Workflow state</strong>
                  <span className="meta-text">Current state: {changeRequest.state}</span>
                  {changeRequest.pull_request_url ? (
                    <a
                      className="button-secondary"
                      href={changeRequest.pull_request_url}
                      rel="noreferrer"
                      style={{ width: "fit-content" }}
                      target="_blank"
                    >
                      Open PR #{changeRequest.pull_request_number}
                    </a>
                  ) : null}
                  <div className="stack">
                    {changeRequest.events.map((event) => (
                      <div key={`${event.label}-${event.created_at}`} className="meta-text">
                        <strong style={{ color: "var(--ink)" }}>{event.label}</strong>
                        <br />
                        {event.detail}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="panel">
            <div className="panel__header panel__header--stacked">
              <div>
                <h2 className="panel__title">Saved drafts</h2>
                <p className="panel__subtitle">
                  Drafts are stored locally so you can reopen or delete them later.
                </p>
              </div>
            </div>
            <div className="panel__body">
              {savedDrafts.length === 0 ? (
                <div className="empty-state">
                  <strong>No saved drafts</strong>
                  <span>Save a draft to keep an in-progress version for this file.</span>
                </div>
              ) : (
                savedDrafts.map((draft) => (
                  <article key={draft.id} className="draft-card">
                    <strong>{formatSavedAt(draft.savedAt)}</strong>
                    <span className="meta-text">
                      {draft.tree.children.length} top-level field{draft.tree.children.length === 1 ? "" : "s"}
                    </span>
                    <div className="draft-card__actions">
                      <button className="button-secondary" onClick={() => handleLoadDraft(draft)} type="button">
                        Open draft
                      </button>
                      <button className="button-ghost" onClick={() => handleDeleteDraft(draft.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
