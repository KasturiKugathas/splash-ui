import type { ConfigNode } from "./config-node";
import { requestJson } from "./api";

export type ConfigTreeResponse = {
  repository: string;
  path: string;
  tree: ConfigNode;
};

export function getConfigTree(repo: string, path: string) {
  return requestJson<ConfigTreeResponse>(
    `/config-tree?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`
  );
}
