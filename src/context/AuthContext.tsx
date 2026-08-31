"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/services/userService";

export interface AuthUser {
  role: "STUDENT" | "TEACHER";
  id?: string;
  userId?: string;
  title?: string;
  name?: string;
  initials?: string;
  studentId?: string;
  exam?: string;
  stream?: string;
  medium?: string;
  qualification?: string;
  bio?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUserProfile();
        const defaultName = profile.role === "TEACHER" ? "Teacher" : "Student";
        const name = profile.name?.trim() || defaultName;
        const initials =
          profile.initials ||
          name
            .split(/\s+/)
            .map((part) => part[0])
            .filter(Boolean)
            .join("")
            .slice(0, 2)
            .toUpperCase() ||
          (profile.role === "TEACHER" ? "TC" : "ST");

        setUser({
          ...profile,
          name,
          initials,
        });
      } catch (err) {
        console.error("Auth context load error:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function signOut() {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
