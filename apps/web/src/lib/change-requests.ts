import type { ConfigNode } from "./config-node";

export type WorkflowEvent = {
  label: string;
  detail: string;
  created_at: string;
};

export type ChangeRequest = {
  id: string;
  repository: string;
  path: string;
  tree: ConfigNode;
  state: "draft" | "branch_created" | "committed" | "pr_opened" | "failed";
  branch: string | null;
  pull_request_url: string | null;
  pull_request_number: string | null;
  events: WorkflowEvent[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
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

export function createChangeRequest(repository: string, path: string, tree: ConfigNode) {
  return requestJson<ChangeRequest>("/change-requests", {
    method: "POST",
    body: JSON.stringify({ repository, path, tree }),
  });
}

export function openPullRequest(changeRequestId: string) {
  return requestJson<ChangeRequest>(`/change-requests/${changeRequestId}/open-pr`, {
    method: "POST",
  });
}
