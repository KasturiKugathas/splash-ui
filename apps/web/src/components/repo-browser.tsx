"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { requestJson } from "../lib/api";
import { getConfigTree } from "../lib/config-tree";

type Repository = {
  id: string;
  name: string;
  owner: string;
  full_name: string;
  default_branch: string;
  visibility: string;
  description: string;
};

type TreeNode = {
  id: string;
  name: string;
  path: string;
  type: "dir" | "file";
  children: TreeNode[];
};

type FileContent = {
  repository: string;
  path: string;
  encoding: string;
  language: string;
  content: string;
};

type ConfigStructureState = {
  status: "idle" | "loading" | "ready" | "error";
  detail?: string;
};

type ToastState = {
  title: string;
  detail: string;
};

const extensionOptions = [
  { value: "all", label: "All files" },
  { value: ".json", label: "JSON" },
  { value: ".yaml", label: "YAML" },
  { value: ".yml", label: "YML" },
  { value: ".xml", label: "XML" },
];

function matchesExtension(path: string, filter: string) {
  if (filter === "all") {
    return [".json", ".yaml", ".yml", ".xml"].some((extension) => path.endsWith(extension));
  }

  return path.endsWith(filter);
}

function filterTree(nodes: TreeNode[], filter: string): TreeNode[] {
  return nodes
    .map((node) => {
      if (node.type === "file") {
        return matchesExtension(node.path, filter) ? node : null;
      }

      const children = filterTree(node.children, filter);
      if (children.length === 0) {
        return null;
      }

      return { ...node, children };
    })
    .filter((node): node is TreeNode => node !== null);
}

function flattenFiles(nodes: TreeNode[]): number {
  return nodes.reduce((count, node) => {
    if (node.type === "file") {
      return count + 1;
    }
    return count + flattenFiles(node.children);
  }, 0);
}

function ErrorToast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return (
    <div className="alert" role="alert">
      <strong>{toast.title}</strong>
      <span>{toast.detail}</span>
      <div>
        <button className="button-ghost" onClick={onDismiss} type="button">
          Dismiss
        </button>
      </div>
    </div>
  );
}

function TreeBranch({
  nodes,
  onSelect,
  selectedPath,
}: {
  nodes: TreeNode[];
  onSelect: (path: string) => void;
  selectedPath: string | null;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          onSelect={onSelect}
          selectedPath={selectedPath}
        />
      ))}
    </ul>
  );
}

function TreeNodeItem({
  node,
  onSelect,
  selectedPath,
}: {
  node: TreeNode;
  onSelect: (path: string) => void;
  selectedPath: string | null;
}) {
  const [open, setOpen] = useState(true);

  if (node.type === "dir") {
    return (
      <li>
        <button
          onClick={() => setOpen((current) => !current)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "0",
            background: "transparent",
            padding: "8px 10px",
            borderRadius: "var(--radius-sm)",
            color: "var(--ink-soft)",
          }}
          type="button"
        >
          <span style={{ color: "var(--muted)", minWidth: 12 }}>{open ? "▾" : "▸"}</span>
          <span>{node.name}</span>
        </button>
        {open ? (
          <div style={{ marginLeft: 12, paddingLeft: 10, borderLeft: "1px solid var(--line)" }}>
            <TreeBranch nodes={node.children} onSelect={onSelect} selectedPath={selectedPath} />
          </div>
        ) : null}
      </li>
    );
  }

  const selected = selectedPath === node.path;

  return (
    <li>
      <button
        onClick={() => onSelect(node.path)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: `1px solid ${selected ? "rgba(47, 107, 87, 0.24)" : "transparent"}`,
          background: selected ? "var(--accent-soft)" : "transparent",
          padding: "9px 10px",
          borderRadius: "var(--radius-sm)",
          color: selected ? "var(--accent-strong)" : "var(--ink-soft)",
          textAlign: "left",
        }}
        type="button"
      >
        <span style={{ color: "var(--muted)", minWidth: 22 }}>file</span>
        <span>{node.name}</span>
      </button>
    </li>
  );
}

export default function RepoBrowser() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [configStructure, setConfigStructure] = useState<ConfigStructureState>({ status: "idle" });
  const [repoSearch, setRepoSearch] = useState("");
  const [extensionFilter, setExtensionFilter] = useState("all");
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRepositories() {
      setLoadingRepos(true);

      try {
        const repoList = await requestJson<Repository[]>("/repos");
        if (!active) {
          return;
        }

        setRepositories(repoList);
        setSelectedRepository(repoList[0] ?? null);
      } catch (error) {
        if (active) {
          setToast({
            title: "Could not load repositories",
            detail: error instanceof Error ? error.message : "Unexpected API error.",
          });
        }
      } finally {
        if (active) {
          setLoadingRepos(false);
        }
      }
    }

    void loadRepositories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTree() {
      if (!selectedRepository) {
        setTree([]);
        setSelectedPath(null);
        setFileContent(null);
        return;
      }

      setLoadingTree(true);
      setSelectedPath(null);
      setFileContent(null);
      setConfigStructure({ status: "idle" });

      try {
        const response = await requestJson<TreeNode[]>(
          `/tree?repo=${encodeURIComponent(selectedRepository.full_name)}`
        );
        if (active) {
          setTree(response);
        }
      } catch (error) {
        if (active) {
          setToast({
            title: "Could not load repository tree",
            detail: error instanceof Error ? error.message : "Unexpected API error.",
          });
        }
      } finally {
        if (active) {
          setLoadingTree(false);
        }
      }
    }

    void loadTree();
    return () => {
      active = false;
    };
  }, [selectedRepository]);

  useEffect(() => {
    let active = true;

    async function loadFile() {
      if (!selectedRepository || !selectedPath) {
        setFileContent(null);
        setConfigStructure({ status: "idle" });
        return;
      }

      setLoadingFile(true);

      try {
        const response = await requestJson<FileContent>(
          `/file?repo=${encodeURIComponent(selectedRepository.full_name)}&path=${encodeURIComponent(
            selectedPath
          )}`
        );
        if (active) {
          setFileContent(response);
        }
      } catch (error) {
        if (active) {
          setToast({
            title: "Could not load file content",
            detail: error instanceof Error ? error.message : "Unexpected API error.",
          });
        }
      } finally {
        if (active) {
          setLoadingFile(false);
        }
      }
    }

    void loadFile();
    return () => {
      active = false;
    };
  }, [selectedRepository, selectedPath]);

  useEffect(() => {
    let active = true;

    async function loadStructure() {
      if (!selectedRepository || !selectedPath) {
        setConfigStructure({ status: "idle" });
        return;
      }

      setConfigStructure({ status: "loading" });

      try {
        const response = await getConfigTree(selectedRepository.full_name, selectedPath);
        if (active) {
          setConfigStructure({
            status: "ready",
            detail: `${response.tree.children.length} top-level field${response.tree.children.length === 1 ? "" : "s"}`,
          });
        }
      } catch (error) {
        if (active) {
          setConfigStructure({
            status: "error",
            detail: error instanceof Error ? error.message : "Unexpected API error.",
          });
        }
      }
    }

    void loadStructure();
    return () => {
      active = false;
    };
  }, [selectedPath, selectedRepository]);

  const visibleRepositories = useMemo(() => {
    const value = repoSearch.trim().toLowerCase();
    if (!value) {
      return repositories;
    }

    return repositories.filter((repository) => {
      return (
        repository.full_name.toLowerCase().includes(value) ||
        repository.description.toLowerCase().includes(value)
      );
    });
  }, [repoSearch, repositories]);

  const visibleTree = useMemo(() => filterTree(tree, extensionFilter), [tree, extensionFilter]);
  const visibleFileCount = useMemo(() => flattenFiles(visibleTree), [visibleTree]);

  return (
    <main className="app-page">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">Repositories</p>
          <h1 className="page-title" style={{ fontSize: "clamp(1.9rem, 3vw, 2.6rem)" }}>
            Browse repositories and files without the extra noise.
          </h1>
          <p className="page-subtitle">
            Search your accessible repositories, filter supported config files, and move into the
            editor only when a file is ready.
          </p>
        </div>
        <span className="pill">{selectedRepository ? selectedRepository.full_name : "No repository selected"}</span>
      </header>

      {toast ? <ErrorToast onDismiss={() => setToast(null)} toast={toast} /> : null}

      <section className="page-grid page-grid--three">
        <section className="panel">
          <div className="panel__header panel__header--stacked">
            <div>
              <h2 className="panel__title">Repositories</h2>
              <p className="panel__subtitle">Pick a repository to load its supported config files.</p>
            </div>
            <input
              className="field"
              onChange={(event) => setRepoSearch(event.target.value)}
              placeholder="Search repositories"
              type="search"
              value={repoSearch}
            />
          </div>
          <div className="panel__body">
            {loadingRepos ? (
              <div className="empty-state">
                <strong>Loading repositories</strong>
                <span>Fetching repositories for your GitHub session.</span>
              </div>
            ) : visibleRepositories.length === 0 ? (
              <div className="empty-state">
                <strong>No repositories match</strong>
                <span>Try a different search query.</span>
              </div>
            ) : (
              <div className="stack">
                {visibleRepositories.map((repository) => {
                  const selected = repository.full_name === selectedRepository?.full_name;
                  return (
                    <button
                      key={repository.id}
                      className={`list-button ${selected ? "list-button--active" : ""}`}
                      onClick={() => setSelectedRepository(repository)}
                      type="button"
                    >
                      <strong>{repository.full_name}</strong>
                      <span className="meta-text">{repository.description}</span>
                      <span className="pill" style={{ width: "fit-content" }}>
                        {repository.visibility} · {repository.default_branch}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Files</h2>
              <p className="panel__subtitle">{visibleFileCount} supported files in the current filter.</p>
            </div>
            <select
              className="select-field"
              onChange={(event) => setExtensionFilter(event.target.value)}
              style={{ width: 140 }}
              value={extensionFilter}
            >
              {extensionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="panel__body">
            {loadingTree ? (
              <div className="empty-state">
                <strong>Loading file tree</strong>
                <span>Building the repository structure.</span>
              </div>
            ) : visibleTree.length === 0 ? (
              <div className="empty-state">
                <strong>No supported files</strong>
                <span>Select another repository or adjust the filter.</span>
              </div>
            ) : (
              <TreeBranch nodes={visibleTree} onSelect={setSelectedPath} selectedPath={selectedPath} />
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header panel__header--stacked">
            <div>
              <h2 className="panel__title">Preview</h2>
              <p className="panel__subtitle">
                Review the file and move into the editor only when you are ready to make changes.
              </p>
            </div>
            {selectedRepository && selectedPath && configStructure.status === "ready" ? (
              <div className="note">
                <strong>Config structure ready</strong>
                <span>{configStructure.detail}</span>
                <div>
                  <button
                    className="button-primary"
                    onClick={() =>
                      router.push(
                        `/app/editor?repo=${encodeURIComponent(selectedRepository.full_name)}&path=${encodeURIComponent(
                          selectedPath
                        )}`
                      )
                    }
                    type="button"
                  >
                    Open in editor
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="panel__body">
            {!selectedPath ? (
              <div className="empty-state">
                <strong>Select a file</strong>
                <span>Choose a supported config file to preview its content.</span>
              </div>
            ) : loadingFile ? (
              <div className="empty-state">
                <strong>Loading file</strong>
                <span>Fetching content from GitHub.</span>
              </div>
            ) : fileContent ? (
              <>
                <div className="split-meta">
                  <span className="pill">{fileContent.language.toUpperCase()}</span>
                  <span className="meta-text">{fileContent.path}</span>
                </div>
                {configStructure.status === "loading" ? (
                  <div className="note">
                    <strong>Analyzing file structure</strong>
                    <span>Preparing the editor view.</span>
                  </div>
                ) : configStructure.status === "error" ? (
                  <div className="alert">
                    <strong>Could not build config structure</strong>
                    <span>{configStructure.detail}</span>
                  </div>
                ) : null}
                <pre className="code-block">{fileContent.content}</pre>
                {selectedRepository ? (
                  <Link
                    className="button-secondary"
                    href={`/app/editor?repo=${encodeURIComponent(selectedRepository.full_name)}&path=${encodeURIComponent(
                      selectedPath
                    )}`}
                  >
                    Open editor
                  </Link>
                ) : null}
              </>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
