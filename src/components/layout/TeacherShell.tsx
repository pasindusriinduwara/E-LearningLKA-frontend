"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Calendar, CheckSquare, BookOpen,
  ClipboardList, LineChart, MessageCircle, Settings,
  LogOut, Bell, ChevronRight, Menu, GraduationCap
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "My classes", href: "/teacher/classes", icon: Calendar },
  { label: "Attendance", href: "/teacher/attendance", icon: CheckSquare },
  { label: "Materials", href: "/teacher/materials", icon: BookOpen },
  { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
  { label: "Results", href: "/teacher/results", icon: LineChart },
  { label: "Messages", href: "/teacher/messages", icon: MessageCircle, badge: 2 },
  { label: "Settings", href: "/teacher/settings", icon: Settings },
];

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const teacherName = user?.name || "Teacher";
  const teacherInitials = user?.initials || teacherName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "TC";
  const teacherRole = user?.qualification || "Teacher";
  useEffect(() => {
    if (!loading && user && user.role === "STUDENT") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] text-gray-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center h-16 px-6 bg-[#111827] border-b border-gray-800">
          <GraduationCap className="text-emerald-500 mr-2" size={24} />
          <span className="text-xl font-bold text-white tracking-tight">classroom.</span>
          <span className="ml-2 text-[10px] font-bold text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10">Teacher</span>
        </div>

        <div className="p-4">
          <div className="flex items-center p-3 bg-gray-800/50 rounded-xl mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">{teacherInitials}</div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{teacherName}</p>
              <p className="text-xs text-gray-400 truncate">{teacherRole}</p>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
          </div>

          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Teacher Portal</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.label} href={item.href} className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${active ? "bg-emerald-500 text-white" : "hover:bg-gray-800 hover:text-white"}`}>
                  <div className="flex items-center">
                    <item.icon size={18} className={active ? "text-white" : "text-gray-400"} />
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4">
          <button onClick={signOut} className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full">
            <LogOut size={18} className="mr-3" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center">
            <button className="lg:hidden mr-4 text-gray-500" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="text-sm text-gray-500">
              Teacher portal <span className="mx-2">›</span> <strong className="text-gray-900">Dashboard</strong>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-full">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-full pl-1 pr-3 py-1">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">{teacherInitials}</div>
              <span className="text-sm font-medium text-gray-700">{teacherName}</span>
              <ChevronRight size={14} className="text-gray-400" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
