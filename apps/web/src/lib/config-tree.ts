export type ConfigNodeKind = "string" | "number" | "boolean" | "object" | "array" | "null";

export type ConfigNode = {
  key: string;
  path: string;
  kind: ConfigNodeKind;
  value: string | number | boolean | null;
  children: ConfigNode[];
};

export type ConfigTreeResponse = {
  repository: string;
  path: string;
  tree: ConfigNode;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
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

export function getConfigTree(repo: string, path: string) {
  return requestJson<ConfigTreeResponse>(
    `/config-tree?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`
  );
}
