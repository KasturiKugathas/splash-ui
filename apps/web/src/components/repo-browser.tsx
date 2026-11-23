"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const extensionOptions = [
  { value: "all", label: "All supported files" },
  { value: ".json", label: "JSON only" },
  { value: ".yaml", label: "YAML only" },
  { value: ".yml", label: "YML only" },
  { value: ".xml", label: "XML only" },
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

      const filteredChildren = filterTree(node.children, filter);
      if (filteredChildren.length === 0) {
        return null;
      }

      return { ...node, children: filteredChildren };
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
    <div style={toastStyles.shell} role="alert">
      <div>
        <strong style={{ display: "block", marginBottom: 4 }}>{toast.title}</strong>
        <span style={{ color: "var(--muted)" }}>{toast.detail}</span>
      </div>
      <button onClick={onDismiss} style={toastStyles.dismiss} type="button">
        Dismiss
      </button>
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
    <ul style={treeStyles.list}>
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
        <button onClick={() => setOpen((current) => !current)} style={treeStyles.folderButton} type="button">
          <span>{open ? "▾" : "▸"}</span>
          <span>{node.name}</span>
        </button>
        {open ? (
          <div style={{ marginLeft: 16 }}>
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
          ...treeStyles.fileButton,
          ...(selected ? treeStyles.fileButtonActive : null),
        }}
        type="button"
      >
        <span style={{ minWidth: 28, color: "var(--muted)" }}>file</span>
        <span>{node.name}</span>
      </button>
    </li>
  );
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let detail = `API request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        detail = payload.detail;
      }
    } catch {
      // Keep the default message when the backend does not return JSON.
    }

    throw new Error(detail);
  }

  return response.json() as Promise<T>;
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
        if (!active) {
          return;
        }

        setToast({
          title: "Could not load repositories",
          detail: error instanceof Error ? error.message : "Unexpected API error.",
        });
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

      try {
        const response = await requestJson<TreeNode[]>(
          `/tree?repo=${encodeURIComponent(selectedRepository.full_name)}`
        );
        if (!active) {
          return;
        }

        setTree(response);
      } catch (error) {
        if (!active) {
          return;
        }

        setToast({
          title: "Could not load repository tree",
          detail: error instanceof Error ? error.message : "Unexpected API error.",
        });
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
        if (!active) {
          return;
        }

        setFileContent(response);
      } catch (error) {
        if (!active) {
          return;
        }

        setToast({
          title: "Could not load file content",
          detail: error instanceof Error ? error.message : "Unexpected API error.",
        });
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
        if (!active) {
          return;
        }
        console.log("config-tree", response);
        setConfigStructure({
          status: "ready",
          detail: `${response.tree.children.length} top-level field${response.tree.children.length === 1 ? "" : "s"}`,
        });
      } catch (error) {
        if (!active) {
          return;
        }
        setConfigStructure({
          status: "error",
          detail: error instanceof Error ? error.message : "Unexpected API error.",
        });
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
    <main style={pageStyles.shell}>
      <section style={pageStyles.hero}>
        <div>
          <p style={pageStyles.eyebrow}>Phase 2</p>
          <h1 style={pageStyles.title}>Repository browser shell</h1>
          <p style={pageStyles.subtitle}>
            Browse live GitHub repositories available to your configured token, filter supported
            config files, and preview file contents before the editor phase lands.
          </p>
        </div>
        <div style={pageStyles.heroCard}>
          <span>Supported file types</span>
          <strong>JSON, YAML, YML, XML</strong>
        </div>
      </section>

      {toast ? <ErrorToast toast={toast} onDismiss={() => setToast(null)} /> : null}

      <section style={pageStyles.grid}>
        <aside style={panelStyles.root}>
          <div style={panelStyles.header}>
            <div>
              <p style={panelStyles.kicker}>Repositories</p>
              <h2 style={panelStyles.title}>Connected repos</h2>
            </div>
            <span style={panelStyles.badge}>
              {loadingRepos ? "Loading" : `${visibleRepositories.length} shown`}
            </span>
          </div>

          <label style={panelStyles.label}>
            Search repositories
            <input
              onChange={(event) => setRepoSearch(event.target.value)}
              placeholder="Filter by name or description"
              style={panelStyles.input}
              type="search"
              value={repoSearch}
            />
          </label>

          {loadingRepos ? (
            <div style={panelStyles.emptyState}>
              <strong>Loading repository list</strong>
              <span>Fetching your live GitHub repositories from the API.</span>
            </div>
          ) : visibleRepositories.length === 0 ? (
            <div style={panelStyles.emptyState}>
              <strong>No repositories match</strong>
              <span>Adjust the search input or confirm the token can access repositories.</span>
            </div>
          ) : (
            <div style={panelStyles.stack}>
              {visibleRepositories.map((repository) => {
                const selected = repository.full_name === selectedRepository?.full_name;

                return (
                  <button
                    key={repository.id}
                    onClick={() => setSelectedRepository(repository)}
                    style={{
                      ...panelStyles.repoButton,
                      ...(selected ? panelStyles.repoButtonActive : null),
                    }}
                    type="button"
                  >
                    <div style={{ display: "grid", gap: 6, textAlign: "left" }}>
                      <strong>{repository.full_name}</strong>
                      <span style={{ color: "var(--muted)" }}>{repository.description}</span>
                    </div>
                    <span style={panelStyles.metaPill}>
                      {repository.visibility} · {repository.default_branch}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section style={panelStyles.root}>
          <div style={panelStyles.header}>
            <div>
              <p style={panelStyles.kicker}>Repository tree</p>
              <h2 style={panelStyles.title}>Config files</h2>
            </div>
            <span style={panelStyles.badge}>{visibleFileCount} files</span>
          </div>

          <div style={panelStyles.toolbar}>
            <label style={panelStyles.labelCompact}>
              Extension filter
              <select
                onChange={(event) => setExtensionFilter(event.target.value)}
                style={panelStyles.select}
                value={extensionFilter}
              >
                {extensionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadingTree ? (
            <div style={panelStyles.emptyState}>
              <strong>Loading tree</strong>
              <span>Building the live repository file tree for the selected repo.</span>
            </div>
          ) : visibleTree.length === 0 ? (
            <div style={panelStyles.emptyState}>
              <strong>No supported files found</strong>
              <span>Select another filter or repository to see files.</span>
            </div>
          ) : (
            <TreeBranch
              nodes={visibleTree}
              onSelect={(path) => setSelectedPath(path)}
              selectedPath={selectedPath}
            />
          )}
        </section>

        <section style={panelStyles.root}>
          <div style={panelStyles.header}>
            <div>
              <p style={panelStyles.kicker}>File viewer</p>
              <h2 style={panelStyles.title}>Preview</h2>
            </div>
            <span style={panelStyles.badge}>
              {fileContent ? fileContent.language.toUpperCase() : "No file"}
            </span>
          </div>

          {loadingFile ? (
            <div style={panelStyles.emptyState}>
              <strong>Loading file content</strong>
              <span>Fetching the selected file from the GitHub API.</span>
            </div>
          ) : fileContent ? (
            <div style={panelStyles.viewer}>
              <div style={panelStyles.viewerHeader}>
                <strong>{fileContent.path}</strong>
                <span style={{ color: "var(--muted)" }}>{fileContent.repository}</span>
              </div>
              <div style={panelStyles.callout}>
                <strong>Config structure</strong>
                <span style={{ color: "var(--muted)" }}>
                  {configStructure.status === "loading"
                    ? "Fetching normalized structure for the editor."
                    : configStructure.status === "ready"
                      ? configStructure.detail
                      : configStructure.status === "error"
                        ? configStructure.detail
                        : "Select a file to begin parsing."}
                </span>
              </div>
              <pre style={panelStyles.pre}>{fileContent.content}</pre>
              <div style={panelStyles.actions}>
                <button
                  onClick={() => {
                    if (!selectedRepository || !selectedPath) {
                      return;
                    }
                    router.push(
                      `/editor?repo=${encodeURIComponent(selectedRepository.full_name)}&path=${encodeURIComponent(
                        selectedPath
                      )}`
                    );
                  }}
                  style={panelStyles.primaryAction}
                  type="button"
                >
                  Open in config editor
                </button>
                {selectedRepository && selectedPath ? (
                  <Link
                    href={`/editor?repo=${encodeURIComponent(selectedRepository.full_name)}&path=${encodeURIComponent(
                      selectedPath
                    )}`}
                    style={panelStyles.secondaryAction}
                  >
                    Open dedicated route
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div style={panelStyles.emptyState}>
              <strong>Select a config file</strong>
              <span>Choose a JSON, YAML, YML, or XML file from the tree to preview it here.</span>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const pageStyles = {
  shell: {
    padding: "32px clamp(20px, 3vw, 44px) 48px",
    display: "grid",
    gap: 24,
  },
  hero: {
    display: "grid",
    gap: 20,
    alignItems: "end",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  },
  eyebrow: {
    margin: 0,
    color: "var(--accent)",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontSize: 12,
  },
  title: {
    margin: "10px 0 12px",
    fontSize: "clamp(2.4rem, 4vw, 4rem)",
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    color: "var(--muted)",
    maxWidth: 720,
    fontSize: "1.04rem",
    lineHeight: 1.6,
  },
  heroCard: {
    padding: 20,
    borderRadius: "var(--radius-lg)",
    background: "rgba(255, 248, 235, 0.8)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow)",
    display: "grid",
    gap: 8,
    minHeight: 120,
    alignContent: "center",
  },
  grid: {
    display: "grid",
    gap: 18,
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  },
};

const panelStyles = {
  root: {
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--line)",
    background: "var(--panel)",
    boxShadow: "var(--shadow)",
    padding: 20,
    display: "grid",
    gap: 16,
    alignContent: "start",
  },
  header: {
    display: "flex",
    alignItems: "start",
    justifyContent: "space-between",
    gap: 12,
  },
  kicker: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 13,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  title: {
    margin: "6px 0 0",
    fontSize: 24,
  },
  badge: {
    borderRadius: 999,
    padding: "8px 12px",
    background: "var(--accent-soft)",
    color: "var(--accent)",
    fontSize: 13,
    whiteSpace: "nowrap" as const,
  },
  label: {
    display: "grid",
    gap: 8,
    fontSize: 14,
  },
  labelCompact: {
    display: "grid",
    gap: 8,
    fontSize: 13,
    color: "var(--muted)",
  },
  input: {
    width: "100%",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--line)",
    padding: "12px 14px",
    background: "var(--panel-strong)",
  },
  select: {
    width: "100%",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--line)",
    padding: "10px 12px",
    background: "var(--panel-strong)",
  },
  toolbar: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  stack: {
    display: "grid",
    gap: 12,
  },
  repoButton: {
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.64)",
    padding: 16,
    display: "grid",
    gap: 12,
    cursor: "pointer",
  },
  repoButtonActive: {
    border: "1px solid rgba(15, 118, 110, 0.35)",
    background: "rgba(15, 118, 110, 0.08)",
  },
  metaPill: {
    justifySelf: "start",
    borderRadius: 999,
    padding: "6px 10px",
    background: "rgba(31, 26, 20, 0.06)",
    color: "var(--muted)",
    fontSize: 12,
  },
  emptyState: {
    borderRadius: "var(--radius-lg)",
    border: "1px dashed var(--line)",
    background: "rgba(255,255,255,0.54)",
    minHeight: 180,
    padding: 20,
    display: "grid",
    gap: 6,
    alignContent: "center",
    color: "var(--muted)",
  },
  viewer: {
    display: "grid",
    gap: 12,
  },
  callout: {
    display: "grid",
    gap: 4,
    padding: 14,
    borderRadius: "var(--radius-md)",
    background: "rgba(15, 118, 110, 0.08)",
    border: "1px solid rgba(15, 118, 110, 0.18)",
  },
  viewerHeader: {
    display: "grid",
    gap: 4,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
  },
  primaryAction: {
    border: 0,
    borderRadius: 999,
    padding: "12px 18px",
    background: "var(--accent)",
    color: "#f7f4ec",
    cursor: "pointer",
  },
  secondaryAction: {
    textDecoration: "none",
    borderRadius: 999,
    padding: "12px 18px",
    border: "1px solid var(--line)",
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

const treeStyles = {
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 8,
  },
  folderButton: {
    width: "100%",
    border: 0,
    background: "transparent",
    padding: "8px 0",
    cursor: "pointer",
    display: "flex",
    gap: 10,
    alignItems: "center",
    fontWeight: 600,
    textAlign: "left" as const,
  },
  fileButton: {
    width: "100%",
    border: "1px solid transparent",
    borderRadius: "var(--radius-md)",
    background: "rgba(255,255,255,0.65)",
    padding: "10px 12px",
    cursor: "pointer",
    display: "flex",
    gap: 10,
    alignItems: "center",
    textAlign: "left" as const,
  },
  fileButtonActive: {
    border: "1px solid rgba(15, 118, 110, 0.35)",
    background: "rgba(15, 118, 110, 0.1)",
  },
};

const toastStyles = {
  shell: {
    position: "sticky" as const,
    top: 16,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "start",
    padding: 16,
    borderRadius: "var(--radius-lg)",
    border: "1px solid rgba(180, 35, 24, 0.24)",
    background: "var(--warn-soft)",
    boxShadow: "var(--shadow)",
  },
  dismiss: {
    border: 0,
    borderRadius: 999,
    padding: "8px 12px",
    background: "#fff",
    cursor: "pointer",
  },
};
