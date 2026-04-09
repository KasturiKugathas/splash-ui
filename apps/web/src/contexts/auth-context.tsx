"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import {
  getAuthSession,
  getGithubLoginUrl,
  logoutSession,
  type AuthUser,
} from "../lib/auth";

type AuthState = {
  status: "loading" | "authenticated" | "anonymous";
  user: AuthUser | null;
  error: string | null;
  login: (nextPath?: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);

    try {
      const session = await getAuthSession();
      if (session.authenticated && session.user) {
        setUser(session.user);
        setStatus("authenticated");
        return;
      }

      setUser(null);
      setStatus("anonymous");
    } catch (nextError) {
      setUser(null);
      setStatus("anonymous");
      setError(nextError instanceof Error ? nextError.message : "Unexpected auth error.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        error,
        login: (nextPath = "/app") => {
          window.location.href = getGithubLoginUrl(nextPath);
        },
        logout: async () => {
          await logoutSession();
          setUser(null);
          setStatus("anonymous");
          window.location.href = "/login";
        },
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
