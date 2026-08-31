"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, CalendarDays, BookOpen, CreditCard, Megaphone } from "lucide-react";
import { loginUser } from "@/services/authService";
import { LoginRoleSelector } from "@/components/auth/LoginSelector";
export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await loginUser({ email, password });
            localStorage.setItem("token", data.token);
            const userRole = (data.role || (role === "teacher" ? "TEACHER" : "STUDENT")).toUpperCase();
            router.push(userRole === "TEACHER" ? "/teacher/dashboard" : "/dashboard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to login. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex min-h-screen font-sans">
            <div className="hidden lg:flex flex-col w-[40%] bg-[#0B132B] text-white p-12 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex-grow">
                    <div className="flex items-center gap-2 mb-16">
                        <div className="bg-blue-500 p-2 rounded-lg">
                            <GraduationCap size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">classroom.</span>
                    </div>

                    <h1 className="text-5xl font-extrabold mb-6 leading-tight font-serif">
                        Learning made <br /> simple.
                    </h1>
                    <p className="text-gray-400 text-base mb-12 max-w-sm leading-relaxed">
                        A unified platform for Sri Lankan tuition institutes — students, teachers, and parents in one place.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <CalendarDays className="text-blue-400" size={20} />
                            <span className="text-sm font-medium text-gray-300">Live schedules and attendance</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <BookOpen className="text-blue-400" size={20} />
                            <span className="text-sm font-medium text-gray-300">Course materials and assignments</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <CreditCard className="text-blue-400" size={20} />
                            <span className="text-sm font-medium text-gray-300">Fee tracking in LKR</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Megaphone className="text-pink-400" size={20} />
                            <span className="text-sm font-medium text-gray-300">Institute announcements</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-gray-600 font-medium tracking-wide mt-auto">
                    © 2026 classroom. · Asia/Colombo · LKR
                </div>
            </div>

            <div className="flex-1 bg-[#FAFAFA] flex flex-col justify-center items-center p-8 relative">
                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">Welcome back</h2>
                    <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue</p>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <LoginRoleSelector role={role} onRoleChange={setRole} />

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder={role === "student" ? "student@school.lk" : "teacher@institute.lk"}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase">
                                    Password
                                </label>
                                <Link href="#" className="text-xs font-bold text-[#4F46E5] hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-4 pr-16 py-3 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 tracking-wider"
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full mt-4 bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] disabled:shadow-none"
                        >
                            {loading ? "Signing in..." : `Sign in as ${role === "student" ? "Student" : "Teacher"}`}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-sm text-gray-500">
                        Don&apos;t have an account? <Link href="/register" className="text-[#4F46E5] font-semibold hover:underline">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
