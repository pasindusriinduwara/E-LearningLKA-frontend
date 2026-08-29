"use client";

import { createContext, useContext, type ReactNode } from "react";
import { studentProfile } from "@/services/studentService";

interface AuthContextValue {
  user: typeof studentProfile;
  isAuthenticated: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  function signOut() {
    // The real implementation will clear the Spring Security session/token.
  }

  return <AuthContext.Provider value={{ user: studentProfile, isAuthenticated: true, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
