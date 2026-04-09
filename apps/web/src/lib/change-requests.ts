import type { ConfigNode } from "./config-node";
import { requestJson } from "./api";

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

export function createChangeRequest(repository: string, path: string, tree: ConfigNode) {
  return requestJson<ChangeRequest>("/change-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repository, path, tree }),
  });
}

export function openPullRequest(changeRequestId: string) {
  return requestJson<ChangeRequest>(`/change-requests/${changeRequestId}/open-pr`, {
    method: "POST",
  });
}
