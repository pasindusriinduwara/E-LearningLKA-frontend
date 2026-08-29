"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getStudentProfile } from "@/services/studentService";
import type { StudentProfile } from "@/lib/types/student";

interface AuthContextValue {
  user: StudentProfile;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
}

const defaultStudent: StudentProfile = {
  name: "Student",
  initials: "ST",
  studentId: "24081",
  exam: "A/L 2026",
  stream: "Physical Science",
  medium: "Sinhala medium",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentProfile>(defaultStudent);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const student = await getStudentProfile("24081");
        if (student) {
          setUser(student);
        }
      } catch (err) {
        console.error("Auth context load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function signOut() {
    setUser(defaultStudent);
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: true, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
