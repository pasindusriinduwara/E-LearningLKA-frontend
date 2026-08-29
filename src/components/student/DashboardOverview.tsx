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
import { getStudentProfile, getUpcomingClasses } from "@/services/studentService";
import type { StudentProfile, ScheduleItem } from "@/lib/types/student";

export function DashboardOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [classes, setClasses] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const displayUser = profile || user;

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch student profile and upcoming schedule from PostgreSQL via Spring Boot
        const [profileRes, scheduleRes] = await Promise.allSettled([
          getStudentProfile("24081"),
          getUpcomingClasses(),
        ]);

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value);
        }
        if (scheduleRes.status === "fulfilled") {
          setClasses(scheduleRes.value);
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

  return (
    <div className="dashboard-page-wrapper">
      {/* 1. Dark Navy Welcome Hero Banner */}
      <section className="dashboard-welcome-banner" aria-label="Welcome banner">
        <div className="welcome-banner-left">
          <p className="welcome-date-eyebrow">TUESDAY, 25 AUGUST 2026</p>
          <h1 className="welcome-hero-title">
            Good morning, {displayUser?.name ? displayUser.name.split(" ")[0] : "Student"}.
          </h1>
          <p className="welcome-hero-subtitle">
            Student ID: <strong>{displayUser?.studentId || "24081"}</strong> • Keep your momentum going!
          </p>

          {/* Student Profile Tags from PostgreSQL */}
          <div className="welcome-tags-row">
            <span className="welcome-tag-chip">
              <GraduationCap size={15} />
              <span>{displayUser?.exam || "A/L 2026"}</span>
            </span>
            <span className="welcome-tag-chip">
              <BookOpen size={15} />
              <span>{displayUser?.stream || "Physical Science"}</span>
            </span>
            <span className="welcome-tag-chip">
              <Globe size={15} />
              <span>{displayUser?.medium || "Sinhala medium"}</span>
            </span>
          </div>
        </div>

        {/* Weekly Focus Metric Widget */}
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

      {/* 2. Top Summary Metric Cards (Row of 3 Cards) */}
      <section className="dashboard-metrics-grid" aria-label="Quick metrics">
        {/* Metric 1: Classes this week */}
        <Link href="/schedule" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-blue">
              <CalendarDays size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">Classes this week</span>
          <strong className="metric-card-number">{classes.length > 0 ? `0${classes.length}` : "06"}</strong>
          <span className="metric-card-subtext">2 completed</span>
        </Link>

        {/* Metric 2: Attendance rate */}
        <Link href="/attendance" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-green">
              <CircleCheck size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">Attendance rate</span>
          <strong className="metric-card-number">92%</strong>
          <div className="attendance-progress-track">
            <div className="attendance-progress-fill" style={{ width: "92%" }} />
          </div>
          <span className="attendance-status-text">Excellent consistency</span>
        </Link>

        {/* Metric 3: New materials */}
        <Link href="/materials" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-yellow">
              <Tablet size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">New materials</span>
          <strong className="metric-card-number">03</strong>
          <span className="metric-card-subtext">Since your last visit</span>
        </Link>
      </section>

      {/* 3. Bottom Grid: Upcoming Classes & Notice Board */}
      <div className="dashboard-bottom-grid">
        {/* Left: Upcoming Classes */}
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
            {classes.length === 0 ? (
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

        {/* Right: Notice Board */}
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
            {/* Notice Card 1: Term Test */}
            <article className="notice-card-item">
              <div className="notice-icon-box">
                <CircleAlert size={20} />
              </div>
              <div className="notice-card-content">
                <span className="notice-type-tag">IMPORTANT</span>
                <h3 className="notice-card-title">Term test paper 02</h3>
                <p className="notice-card-desc">
                  Submit your answer script by Friday, 29 August.
                </p>
                <span className="notice-card-time">1 hour ago</span>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
