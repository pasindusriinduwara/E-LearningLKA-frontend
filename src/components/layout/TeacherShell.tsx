"use client";

import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSidebarDrawer } from "./useSidebarDrawer";
import {
  BookOpen,
  Calendar,CheckSquare,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Settings,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "My classes", href: "/teacher/classes", icon: Calendar },
  { label: "Student access", href: "/teacher/enrollments", icon: CheckSquare },
  { label: "Materials", href: "/teacher/materials", icon: BookOpen },
  { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
  { label: "Results", href: "/teacher/results", icon: LineChart },
  { label: "Settings", href: "/teacher/settings", icon: Settings },
];

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const { isOpen: sidebarOpen, isMobile, open: openSidebar, close: closeSidebar, sidebarRef, triggerRef, closeButtonRef } = useSidebarDrawer("(max-width: 1023px)");
  const activeLabel = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label || "Dashboard";
  const teacherName = user?.name || "Teacher";
  const teacherInitials = user?.initials || teacherName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "TC";
  const teacherRole = user?.qualification || "Teacher";
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role === "STUDENT") {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-dvh bg-[#F8FAFC] font-sans overflow-hidden">
      {sidebarOpen && <button className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" type="button" aria-label="Close navigation overlay" tabIndex={-1} onClick={closeSidebar} />}

      <aside ref={sidebarRef} id="teacher-sidebar" role={isMobile ? "dialog" : undefined} aria-modal={sidebarOpen || undefined} aria-label="Teacher navigation" aria-hidden={isMobile && !sidebarOpen || undefined} inert={isMobile && !sidebarOpen} className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[calc(100vw-24px)] shrink-0 flex-col bg-[#111827] text-gray-300 transition-transform duration-300 ease-in-out lg:static lg:visible lg:translate-x-0 ${sidebarOpen ? "visible translate-x-0" : "invisible -translate-x-full"}`}>
        <div className="flex shrink-0 items-center gap-2 h-16 px-4 bg-[#111827] border-b border-gray-800">
          <GraduationCap className="text-emerald-500 shrink-0" size={24} />
          <span className="flex-1 text-lg font-bold text-white tracking-tight">classroom.</span>
          <span className="hidden lg:inline text-[10px] font-bold text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10">Teacher</span>
          <button ref={closeButtonRef} type="button" aria-label="Close navigation" onClick={closeSidebar} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 lg:hidden"><X size={22} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <Link
            href="/teacher/settings"
            onClick={closeSidebar}
            className={`flex items-center p-3 rounded-xl mb-6 transition-all duration-200 cursor-pointer ${
              pathname === "/teacher/settings"
                ? "bg-gray-800 ring-2 ring-emerald-500 text-white shadow-lg"
                : "bg-gray-800/50 hover:bg-gray-800/80 text-gray-200"
            }`}
            title="Edit Teacher Profile Details"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {teacherInitials}
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{teacherName}</p>
              <p className="text-xs text-gray-400 truncate">{teacherRole}</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
          </Link>

          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Teacher Portal</p>
          <nav className="space-y-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.label} href={item.href} onClick={closeSidebar} aria-current={active ? "page" : undefined} className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${active ? "bg-emerald-500 text-white" : "hover:bg-gray-800 hover:text-white"}`}>
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

        <div className="shrink-0 border-t border-gray-800 p-4">
          <button onClick={signOut} className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full">
            <LogOut size={18} className="mr-3" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" inert={sidebarOpen}>
        <header className="relative z-20 h-16 shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <button ref={triggerRef} type="button" className="lg:hidden mr-3 grid h-10 w-10 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Open navigation" aria-controls="teacher-sidebar" aria-expanded={sidebarOpen} onClick={openSidebar}>
              <Menu size={24} />
            </button>
            <div className="text-sm text-gray-500">
              Teacher portal <span className="mx-2">›</span> <strong className="text-gray-900">{activeLabel}</strong>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell key={user?.userId ?? user?.id ?? user?.email ?? "signed-out"} enabled={!loading && user?.role === "TEACHER"} />
            <Link href="/teacher/settings" className="flex items-center gap-2 cursor-pointer border border-gray-200 hover:border-gray-300 rounded-full pl-1 pr-3 py-1 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">{teacherInitials}</div>
              <span className="text-sm font-medium text-gray-700">{teacherName}</span>
              <ChevronRight size={14} className="text-gray-400" />
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
