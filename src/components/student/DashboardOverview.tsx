"use client";

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
import { studentProfile } from "@/services/studentService";

export function DashboardOverview() {
  return (
    <div className="dashboard-page-wrapper">
      {/* 1. Dark Navy Welcome Hero Banner */}
      <section className="dashboard-welcome-banner" aria-label="Welcome banner">
        <div className="welcome-banner-left">
          <p className="welcome-date-eyebrow">TUESDAY, 25 AUGUST 2026</p>
          <h1 className="welcome-hero-title">Good morning, Sahan.</h1>
          <p className="welcome-hero-subtitle">
            Keep your momentum going. You have one class and two new resources waiting today.
          </p>

          {/* Student Profile Tags */}
          <div className="welcome-tags-row">
            <span className="welcome-tag-chip">
              <GraduationCap size={15} />
              <span>{studentProfile.exam}</span>
            </span>
            <span className="welcome-tag-chip">
              <BookOpen size={15} />
              <span>{studentProfile.stream}</span>
            </span>
            <span className="welcome-tag-chip">
              <Globe size={15} />
              <span>{studentProfile.medium}</span>
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
          <strong className="metric-card-number">06</strong>
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
            {/* Class Card 1: Today's Class */}
            <article className="class-card-item">
              <div className="class-date-badge">
                <span className="date-badge-day">TODAY</span>
                <strong className="date-badge-number">25</strong>
                <span className="date-badge-month">AUG</span>
              </div>

              <div className="class-card-body">
                <div className="class-card-title-row">
                  <h3 className="class-title">Pure Mathematics</h3>
                  <span className="next-class-pill">Next class</span>
                </div>

                <p className="class-instructor">Combined Mathematics • Mr. K. Perera</p>

                <div className="class-meta-row">
                  <span className="class-meta-item">
                    <Clock3 size={15} />
                    <span>4:30 PM – 6:30 PM</span>
                  </span>
                  <span className="class-meta-item">
                    <MapPin size={15} />
                    <span>Nugegoda Studio 2</span>
                  </span>
                  <span className="mode-pill mode-pill-inperson">In person</span>
                </div>
              </div>
            </article>
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
