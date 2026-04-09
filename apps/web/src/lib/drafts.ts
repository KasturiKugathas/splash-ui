import type { ConfigNode } from "./config-node";

export type SavedDraft = {
  id: string;
  repository: string;
  path: string;
  tree: ConfigNode;
  savedAt: string;
};

const STORAGE_KEY = "splash-ui.saved-drafts";

function hasWindow() {
  return typeof window !== "undefined";
}

function readAllDrafts(): SavedDraft[] {
  if (!hasWindow()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedDraft[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function writeAllDrafts(drafts: SavedDraft[]) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function listDrafts(repository: string, path: string): SavedDraft[] {
  return readAllDrafts()
    .filter((draft) => draft.repository === repository && draft.path === path)
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
}

export function saveDraft(repository: string, path: string, tree: ConfigNode): SavedDraft {
  const draft: SavedDraft = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    repository,
    path,
    tree,
    savedAt: new Date().toISOString(),
  };

  writeAllDrafts([draft, ...readAllDrafts()]);
  return draft;
}

export function deleteDraft(draftId: string) {
  writeAllDrafts(readAllDrafts().filter((draft) => draft.id !== draftId));
}

export function clearDraftsForFile(repository: string, path: string) {
  writeAllDrafts(readAllDrafts().filter((draft) => !(draft.repository === repository && draft.path === path)));
}
