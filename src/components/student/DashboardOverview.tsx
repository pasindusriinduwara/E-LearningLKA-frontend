"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock3,
  Globe,
  GraduationCap,
  MapPin,
  Tablet,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getAnnouncements, getRecentMaterials, getUpcomingClasses, type AnnouncementItem } from "@/services/studentService";
import type { ScheduleItem } from "@/lib/types/student";

export function DashboardOverview() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ScheduleItem[]>([]);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const displayUser = user;

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [scheduleRes, materialsRes, noticesRes] = await Promise.allSettled([
          getUpcomingClasses(),
          getRecentMaterials(),
          getAnnouncements(),
        ]);

        if (scheduleRes.status === "fulfilled") {
          setClasses(scheduleRes.value);
        }
        if (materialsRes.status === "fulfilled") {
          setMaterialsCount(materialsRes.value.length);
        }
        if (noticesRes.status === "fulfilled") {
          setAnnouncements(noticesRes.value);
        }
        
        if (scheduleRes.status === "rejected" && noticesRes.status === "rejected") {
          setError("Failed to load dashboard data from backend server.");
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
        setError("Failed to load dashboard data from backend server.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const formatCount = (count: number) => String(count).padStart(2, "0");
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date()).toUpperCase();

  return (
    <div className="dashboard-page-wrapper">
      
      <section className="dashboard-welcome-banner" aria-label="Welcome banner">
        <div className="welcome-banner-left">
          <p className="welcome-date-eyebrow">{today}</p>
          <h1 className="welcome-hero-title">
            Good morning, {displayUser?.name ? displayUser.name.split(" ")[0] : "Student"}.
          </h1>
          <p className="welcome-hero-subtitle">
            Student ID: <strong>{displayUser?.studentId || "Unavailable"}</strong> • Keep your momentum going!
          </p>

          <div className="welcome-tags-row">
            <span className="welcome-tag-chip">
              <GraduationCap size={15} />
              <span>{displayUser?.exam || "Not specified"}</span>
            </span>
            <span className="welcome-tag-chip">
              <BookOpen size={15} />
              <span>{displayUser?.stream || "Not specified"}</span>
            </span>
            <span className="welcome-tag-chip">
              <Globe size={15} />
              <span>{displayUser?.medium || "Not specified"}</span>
            </span>
          </div>
        </div>

        <div className="weekly-focus-card" aria-label="Weekly focus 78 percent">
          <div className="focus-card-top">
            <span className="focus-label">WEEKLY FOCUS</span>
            <strong className="focus-percentage">78%</strong>
          </div>
          <div className="focus-meter-track">
            <div className="focus-meter-fill" style={{ width: "78%" }} />
          </div>
          <div className="focus-card-bottom">
            <span className="focus-trend">↑ 12%</span>
            <span className="focus-trend-label">from last week</span>
          </div>
        </div>
      </section>

      <section className="dashboard-metrics-grid" aria-label="Quick metrics">
        
        <Link href="/schedule" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-blue">
              <CalendarDays size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">Classes this week</span>
          <strong className="metric-card-number">{formatCount(classes.length)}</strong>
          <span className="metric-card-subtext">Upcoming classes</span>
        </Link>

        <Link href="/attendance" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-green">
              <CircleCheck size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">Attendance rate</span>
          <strong className="metric-card-number">N/A</strong>
          <div className="attendance-progress-track">
            <div className="attendance-progress-fill" style={{ width: "0%" }} />
          </div>
          <span className="attendance-status-text">No attendance data</span>
        </Link>

        <Link href="/materials" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-yellow">
              <Tablet size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">New materials</span>
          <strong className="metric-card-number">{formatCount(materialsCount)}</strong>
          <span className="metric-card-subtext">Since your last visit</span>
        </Link>
      </section>

      <div className="dashboard-bottom-grid">
        
        <section className="dashboard-section" aria-labelledby="upcoming-classes-heading">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-section-eyebrow">YOUR WEEK</p>
              <h2 id="upcoming-classes-heading" className="dashboard-section-title">
                Upcoming classes
              </h2>
            </div>
            <Link href="/schedule" className="dashboard-section-action">
              <span>Full schedule</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="upcoming-classes-list">
            {loading ? (
              <p className="text-sm text-gray-500 p-4">Loading classes...</p>
            ) : error ? (
              <p className="text-sm text-red-500 p-4">{error}</p>
            ) : classes.length === 0 ? (
              <p className="text-sm text-gray-500 p-4">No upcoming classes found.</p>
            ) : (
              classes.map((cls, index) => (
                <article key={cls.id || index} className="class-card-item">
                  <div className="class-date-badge">
                    <span className="date-badge-day">{cls.day?.toUpperCase() || "CLASS"}</span>
                    <strong className="date-badge-number">{cls.date?.split(" ")[0] || "25"}</strong>
                    <span className="date-badge-month">{cls.date?.split(" ")[1] || "AUG"}</span>
                  </div>

                  <div className="class-card-body">
                    <div className="class-card-title-row">
                      <h3 className="class-title">{cls.title}</h3>
                      {index === 0 && <span className="next-class-pill">Next class</span>}
                    </div>

                    <p className="class-instructor">
                      {cls.subject} • {cls.teacher}
                    </p>

                    <div className="class-meta-row">
                      <span className="class-meta-item">
                        <Clock3 size={15} />
                        <span>{cls.time}</span>
                      </span>
                      <span className="class-meta-item">
                        <MapPin size={15} />
                        <span>{cls.location}</span>
                      </span>
                      <span className={`mode-pill ${cls.mode === "Online" ? "mode-pill-online" : "mode-pill-inperson"}`}>
                        {cls.mode}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="dashboard-section" aria-labelledby="notice-board-heading">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-section-eyebrow">FROM YOUR INSTITUTE</p>
              <h2 id="notice-board-heading" className="dashboard-section-title">
                Notice board
              </h2>
            </div>
            <Link href="/messages" className="dashboard-section-arrow-btn" aria-label="View notice board">
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="notices-list">
            {loading ? <p className="text-sm text-gray-500 p-4">Loading notices...</p> : announcements.length === 0 ? (
              <p className="text-sm text-gray-500 p-4">No announcements found.</p>
            ) : announcements.slice(0, 3).map((notice) => <article key={notice.id || notice.title} className="notice-card-item">
              <div className="notice-icon-box">
                <CircleAlert size={20} />
              </div>
              <div className="notice-card-content">
                <span className="notice-type-tag">{notice.type}</span>
                <h3 className="notice-card-title">{notice.title}</h3>
                <p className="notice-card-desc">{notice.description}</p>
                <span className="notice-card-time">{notice.time}</span>
              </div>
            </article>)}
          </div>
        </section>
      </div>
    </div>
  );
}
