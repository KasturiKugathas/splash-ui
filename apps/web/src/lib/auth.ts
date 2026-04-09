import { getApiUrl, requestJson } from "./api";

export type AuthUser = {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
};

export type AuthSessionResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

export function getGithubLoginUrl(nextPath: string = "/app"): string {
  return getApiUrl(`/auth/github/start?next=${encodeURIComponent(nextPath)}`);
}

export function getAuthSession() {
  return requestJson<AuthSessionResponse>("/auth/session");
}

export function logoutSession() {
  return requestJson<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}
