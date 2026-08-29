"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getStudentProfile } from "@/services/studentService";
import type { StudentProfile } from "@/lib/types/student";

interface AuthContextValue {
  user: StudentProfile | null; // User කෙනෙක් නැති වෙලාවට null වෙන්න පුළුවන්
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentProfile | null>(null); // Hardcoded data අයින් කළා
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      // 1. LocalStorage එකෙන් Token එක ගන්නවා
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false); // Token එකක් නැත්නම් කෙලින්ම loading false කරනවා
        return;
      }

      try {
        // 2. Token එක තියෙනවා නම් Backend එකෙන් User Profile එක ගන්නවා.
        // (සටහන: මෙතන ID එකක් pass කරන්න එපා. Backend එක Token එකෙන් User ව අඳුරගන්න ඕනේ)
        const student = await getStudentProfile();

        if (student) {
          setUser(student);
        }
      } catch (err) {
        console.error("Auth context load error:", err);
        // Token එක Expire වෙලා හෝ වැරදි නම්, ඒක අයින් කරනවා
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function signOut() {
    // Sign out වෙද්දී Token එක අයින් කරලා Login page එකට යවනවා
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user, // User Object එකක් තියෙනවා නම් විතරක් true වෙනවා
        signOut
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