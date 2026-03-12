"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "../src/contexts/auth-context";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
