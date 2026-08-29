"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Bell, BookOpen, CalendarDays, Check, ChevronRight, CircleAlert, CircleCheck, ClipboardCheck, GraduationCap, LayoutDashboard, LogOut, Menu, MessageCircle, Settings, WalletCards, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My schedule", href: "/schedule", icon: CalendarDays },
  { label: "Attendance", href: "/attendance", icon: CircleCheck },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Materials", href: "/materials", icon: BookOpen },
  { label: "Fees & payments", href: "/fees", icon: WalletCards },
];

const supportItems = [
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const activeLabel = [...navItems, ...supportItems].find((item) => isActivePath(pathname, item.href))?.label ?? "Dashboard";

  function closeMenus() {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }

  return (
    <div className="app-shell">
      {mobileOpen && <button className="drawer-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Student navigation">
        <div className="brand-row"><Link className="brand-link" href="/dashboard" onClick={closeMenus}><span className="brand-mark"><GraduationCap size={21} /></span><span className="brand-name">classroom<span>.</span></span></Link><button className="icon-button sidebar-close" type="button" title="Close navigation" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <Link className="student-chip" href="/settings" onClick={closeMenus}>
          <div className="avatar avatar-small">{user?.initials || "ST"}</div>
          <div>
            <strong>{user.name || "Student"}</strong>
            <span>Student ID {user?.studentId || "24081"}</span>
          </div>
          <ChevronRight size={16} />
        </Link>
        <nav className="nav-group" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                className={`nav-item ${active ? "nav-item-active" : ""}`}
                href={href}
                onClick={closeMenus}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{label}</span>
                {label === "Materials" && !active && <span className="nav-count">3</span>}
              </Link>
            );
          })}
        </nav>

        <nav className="nav-group nav-group-secondary" aria-label="Support navigation"><p className="nav-label">Support</p>{supportItems.map(({ label, href, icon: Icon }) => { const active = isActivePath(pathname, href); return <Link key={href} className={`nav-item ${active ? "nav-item-active" : ""}`} href={href} onClick={closeMenus} aria-current={active ? "page" : undefined}><Icon size={18} /><span>{label}</span></Link>; })}</nav>
        <div className="sidebar-footer">
          <Link className="help-box" href="/messages" onClick={closeMenus}>
            <span className="help-icon"><MessageCircle size={17} /></span>
            <span><strong>Need help?</strong><span>Message the office</span></span>
            <ArrowUpRight size={16} />
          </Link>
          <button className="logout-button" type="button" onClick={signOut}>
            <span className="avatar avatar-tiny">N</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>


      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" type="button" title="Open navigation" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={22} /></button><div className="breadcrumb"><span>Student portal</span><ChevronRight size={15} /><strong>{activeLabel}</strong></div></div>
          <div className="topbar-actions">
            <div className="popover-wrap">
              <button
                className={`icon-button notification-button ${notificationsOpen ? "is-open" : ""}`}
                type="button"
                title="Notifications"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
              >
                <Bell size={19} />
                <span className="notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="popover notification-popover">
                  <div className="popover-heading">
                    <div>
                      <strong>Notifications</strong>
                      <span>2 unread updates</span>
                    </div>
                    <button className="text-button" type="button">
                      Mark read <Check size={14} />
                    </button>
                  </div>
                  <div className="notification-item">
                    <div className="notification-symbol coral-symbol">
                      <CircleAlert size={16} />
                    </div>
                    <div>
                      <strong>Paper 02 submission</strong>
                      <p>Due Friday, 29 August</p>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-symbol green-symbol">
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <strong>Class time changed</strong>
                      <p>Tomorrow&apos;s class starts at 3:00 PM</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="popover-wrap">
              <button
                className="profile-button"
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                aria-expanded={profileOpen}
              >
                <div className="avatar">{user?.initials || "ST"}</div>
                <span>{user?.name ? user.name.split(" ")[0] : "Student"}</span>
                <ChevronRight
                  className={`profile-chevron ${profileOpen ? "profile-chevron-open" : ""}`}
                  size={15}
                />
              </button>
              {profileOpen && (
                <div className="popover profile-popover">
                  <div className="profile-popover-head">
                    <div className="avatar avatar-medium">{user?.initials || "ST"}</div>
                    <div>
                      <strong>{user?.name || "Student"}</strong>
                      <span>Student ID {user?.studentId || "24081"}</span>
                    </div>
                  </div>
                  <Link className="popover-action" href="/settings" onClick={closeMenus}>
                    <Settings size={16} /> Account settings
                  </Link>
                  <button className="popover-action" type="button" onClick={signOut}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
