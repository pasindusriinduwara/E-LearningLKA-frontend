"use client";

import { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  Download,
  FileText,
  Video,
  Link2,
  Play,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  getAnnouncements,
  getRecentMaterials,
  getUpcomingClasses,
  getStudentProfile,
  type AnnouncementItem,
} from "@/services/studentService";
import {
  getAvailableBatches,
  type AvailableBatch,
} from "@/services/batchService";
import {
  getMyEnrollmentStatuses,
  type EnrollmentStatus,
} from "@/services/enrollmentService";
import type { ScheduleItem, StudentProfile, LearningResource } from "@/lib/types/student";

export function DashboardOverview() {
  const { user } = useAuth();

  const [classes, setClasses] = useState<ScheduleItem[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [batches, setBatches] = useState<AvailableBatch[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [
          scheduleRes,
          materialsRes,
          noticesRes,
          profileRes,
          batchesRes,
          statusesRes,
        ] = await Promise.allSettled([
          getUpcomingClasses(),
          getRecentMaterials(),
          getAnnouncements(),
          getStudentProfile(),
          getAvailableBatches(),
          getMyEnrollmentStatuses(),
        ]);

        if (cancelled) return;

        const approvedBatchIds = new Set<string>();
        if (statusesRes.status === "fulfilled") {
          (statusesRes.value || []).forEach((item) => {
            if (item.status === "APPROVED") {
              approvedBatchIds.add(item.batchId);
            }
          });
        }

        if (scheduleRes.status === "fulfilled") {
          const allUpcoming = scheduleRes.value || [];
          const enrolledUpcoming = allUpcoming.filter(
            (c: any) => c.batchId && approvedBatchIds.has(c.batchId)
          );
          setClasses(enrolledUpcoming);
        }

        if (batchesRes.status === "fulfilled") {
          const allBatches = batchesRes.value || [];
          const statusMap = new Map<string, EnrollmentStatus>();

          if (statusesRes.status === "fulfilled") {
            (statusesRes.value || []).forEach((item) => {
              statusMap.set(item.batchId, item.status);
            });
          }

          const enriched = allBatches.map((b) => ({
            ...b,
            status: statusMap.get(b.id) || b.status,
          }));

          setBatches(enriched);
        }

        if (materialsRes.status === "fulfilled") {
          const allMaterials = materialsRes.value || [];
          // Filter strictly for only enrolled classes (APPROVED)
          const enrolledMaterials = allMaterials.filter(
            (m) => m.batchId && approvedBatchIds.has(m.batchId)
          );
          setResources(enrolledMaterials);
          setMaterialsCount(enrolledMaterials.length);
        }
        if (noticesRes.status === "fulfilled") {
          const allNotices = noticesRes.value || [];
          // Filter strictly for only enrolled classes (APPROVED)
          const enrolledNotices = allNotices.filter(
            (n: any) => n.batchId && approvedBatchIds.has(n.batchId)
          );
          setAnnouncements(enrolledNotices);
        }
        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
        if (!cancelled) {
          setError("Failed to load dashboard data from backend server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Derived dynamic counts
  const enrolledBatches = useMemo(() => {
    return batches.filter((b) => b.status === "APPROVED");
  }, [batches]);

  const pendingBatches = useMemo(() => {
    return batches.filter((b) => b.status === "PENDING");
  }, [batches]);

  const enrolledCount = enrolledBatches.length;
  const pendingCount = pendingBatches.length;
  const totalMyBatches = enrolledCount + pendingCount;

  // Real user display info combining auth context with fresh profile data
  const displayName = profile?.name || user?.name || "Student";
  const firstName = displayName.split(" ")[0];
  const studentId = profile?.studentId || user?.studentId || "ST-ACTIVE";
  const exam = profile?.exam || user?.exam || "A/L General";
  const stream = profile?.stream || user?.stream || "Academic Studies";
  const medium = profile?.medium || user?.medium || "English";

  const formatCount = (count: number) => String(count).padStart(2, "0");

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date()).toUpperCase();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";

  // Dynamic focus calculation based on enrollment engagement
  const focusPercentage =
    totalMyBatches > 0
      ? Math.round((enrolledCount / totalMyBatches) * 100)
      : enrolledCount > 0
      ? 100
      : 0;

  return (
    <div className="dashboard-page-wrapper">
      {/* 1. Welcome Hero Banner */}
      <section className="dashboard-welcome-banner" aria-label="Welcome banner">
        <div className="welcome-banner-left">
          <p className="welcome-date-eyebrow">{todayFormatted}</p>
          <h1 className="welcome-hero-title">
            {greeting}, {firstName}.
          </h1>
          <p className="welcome-hero-subtitle">
            Student ID: <strong>{studentId}</strong> • Keep your learning momentum going!
          </p>

          <div className="welcome-tags-row">
            <span className="welcome-tag-chip">
              <GraduationCap size={15} />
              <span>{exam}</span>
            </span>
            <span className="welcome-tag-chip">
              <BookOpen size={15} />
              <span>{stream}</span>
            </span>
            <span className="welcome-tag-chip">
              <Globe size={15} />
              <span>{medium}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Study Enrollment Progress Card */}
        <div className="weekly-focus-card" aria-label="Active enrollment engagement">
          <div className="focus-card-top">
            <span className="focus-label">ACTIVE STUDIES</span>
            <strong className="focus-percentage">
              {enrolledCount > 0 ? `${enrolledCount}` : "0"}
            </strong>
          </div>
          <div className="focus-meter-track">
            <div
              className="focus-meter-fill"
              style={{ width: `${Math.max(focusPercentage, 10)}%` }}
            />
          </div>
          <div className="focus-card-bottom">
            {enrolledCount > 0 ? (
              <>
                <span className="focus-trend">
                  {enrolledCount} {enrolledCount === 1 ? "Class" : "Classes"}
                </span>
                <span className="focus-trend-label">
                  {pendingCount > 0 ? `• ${pendingCount} pending` : "• Enrolled"}
                </span>
              </>
            ) : (
              <>
                <span className="focus-trend text-amber-400">Explore</span>
                <span className="focus-trend-label">Browse classes to enroll</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Top Summary Metric Cards */}
      <section className="dashboard-metrics-grid" aria-label="Quick metrics">
        {/* Metric 1: My Schedule */}
        <Link href="/schedule" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-blue">
              <CalendarDays size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">Weekly Lectures</span>
          <strong className="metric-card-number">{formatCount(classes.length)}</strong>
          <span className="metric-card-subtext">Upcoming sessions this week</span>
        </Link>

        {/* Metric 2: Enrolled Classes (Dynamic, replaces dead attendance link) */}
        <Link href="/classes" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-green">
              <GraduationCap size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">Enrolled Classes</span>
          <strong className="metric-card-number">{formatCount(enrolledCount)}</strong>
          <div className="attendance-progress-track">
            <div
              className="attendance-progress-fill"
              style={{ width: `${Math.max(focusPercentage, 15)}%` }}
            />
          </div>
          <span className="attendance-status-text">
            {pendingCount > 0
              ? `${pendingCount} pending approval`
              : enrolledCount > 0
              ? "All enrolled classes active"
              : "No classes enrolled yet"}
          </span>
        </Link>

        {/* Metric 3: Learning Materials */}
        <Link href="/materials" className="dashboard-metric-card">
          <div className="metric-card-top-row">
            <div className="metric-icon-box metric-icon-yellow">
              <Tablet size={22} />
            </div>
            <ArrowUpRight size={18} className="metric-card-arrow" />
          </div>
          <span className="metric-card-label">Learning Materials</span>
          <strong className="metric-card-number">{formatCount(materialsCount)}</strong>
          <span className="metric-card-subtext">Notes, tutorials & playbacks</span>
        </Link>
      </section>

      {/* 3. Bottom Grid: Upcoming Classes & Notice Board */}
      <div className="dashboard-bottom-grid">
        {/* Left: Upcoming Classes */}
        <section className="dashboard-section" aria-labelledby="upcoming-classes-heading">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-section-eyebrow">YOUR ROUTINE</p>
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
              <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-6 h-6 border-2 border-[#4f6df5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading upcoming timetable...</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-xs">
                {error}
              </div>
            ) : classes.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-[#edf2ff] text-[#4f6df5] flex items-center justify-center mx-auto mb-3">
                  <CalendarDays size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-800">
                  {enrolledCount === 0 ? "No enrolled classes yet" : "No classes scheduled this week"}
                </h3>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  {enrolledCount === 0
                    ? "Enroll in a class to view your personalized weekly lecture schedule."
                    : "Timetable entries will appear here once published by your instructors."}
                </p>
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#4f6df5] text-white hover:bg-[#3b5ce8] shadow-sm shadow-blue-500/20 transition-colors"
                >
                  <Sparkles size={14} />
                  <span>{enrolledCount === 0 ? "Browse Classes to Enroll" : "Go to My Classes"}</span>
                </Link>
              </div>
            ) : (
              classes.map((cls, index) => {
                // Safely extract day of week and display text without hardcoding
                const dayLabel = (cls.day || (cls as any).dayOfWeek || "CLASS")
                  .slice(0, 3)
                  .toUpperCase();
                const dateParts = cls.date ? cls.date.split(" ") : [];
                const dateNum = dateParts[0] || String(index + 1);
                const dateMonth = dateParts[1] || "SESSION";

                const isOnline =
                  cls.mode?.toLowerCase() === "online" ||
                  (cls as any).deliveryMode?.toLowerCase() === "online";

                return (
                  <article key={cls.id || index} className="class-card-item">
                    <div className="class-date-badge">
                      <span className="date-badge-day">{dayLabel}</span>
                      <strong className="date-badge-number">{dateNum}</strong>
                      <span className="date-badge-month">{dateMonth}</span>
                    </div>

                    <div className="class-card-body">
                      <div className="class-card-title-row">
                        <h3 className="class-title">{cls.title}</h3>
                        {index === 0 && <span className="next-class-pill">Next lecture</span>}
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
                          <span>{cls.location || (isOnline ? "Zoom Live" : "Tuition Hall")}</span>
                        </span>
                        <span
                          className={`mode-pill ${
                            isOnline ? "mode-pill-online" : "mode-pill-inperson"
                          }`}
                        >
                          {cls.mode || (isOnline ? "Online" : "In person")}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Right: Notice Board */}
        <section className="dashboard-section" aria-labelledby="notice-board-heading">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-section-eyebrow">UPDATES & ALERTS</p>
              <h2 id="notice-board-heading" className="dashboard-section-title">
                Notice board
              </h2>
            </div>
            <Link
              href="/classes"
              className="dashboard-section-arrow-btn"
              aria-label="View announcements in classes"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="notices-list">
            {loading ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-400">Loading notices...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2">
                  <CircleAlert size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-800">
                  {enrolledCount === 0 ? "No notices" : "No new notices"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {enrolledCount === 0
                    ? "Announcements from your enrolled classes will appear here."
                    : "Broadcast notices and urgent updates will appear here."}
                </p>
              </div>
            ) : (
              announcements.slice(0, 4).map((notice, idx) => (
                <article key={notice.id || idx} className="notice-card-item">
                  <div className="notice-icon-box">
                    <CircleAlert size={20} />
                  </div>
                  <div className="notice-card-content">
                    <span className="notice-type-tag">{notice.type || "NOTICE"}</span>
                    <h3 className="notice-card-title">{notice.title}</h3>
                    <p className="notice-card-desc">{notice.description}</p>
                    <span className="notice-card-time">{notice.time || "Recently posted"}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 4. Enrolled Class Study Resources Section */}
      <section className="dashboard-section mt-8 pt-6 border-t border-gray-100" aria-labelledby="enrolled-resources-heading">
        <div className="dashboard-section-header">
          <div>
            <p className="dashboard-section-eyebrow">STUDY RESOURCES • ENROLLED CLASSES</p>
            <h2 id="enrolled-resources-heading" className="dashboard-section-title">
              Recent Class Resources
            </h2>
          </div>
          <Link href="/materials" className="dashboard-section-action">
            <span>View library ({resources.length})</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 bg-white border border-gray-100 rounded-2xl animate-pulse space-y-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-20 h-3 bg-gray-200 rounded" />
                    <div className="w-32 h-2.5 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="w-3/4 h-4 bg-gray-200 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#edf2ff] text-[#4f6df5] flex items-center justify-center mx-auto mb-3">
              <BookOpen size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">
              {enrolledCount === 0
                ? "No enrolled classes yet"
                : "No resources uploaded yet"}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto mb-4">
              {enrolledCount === 0
                ? "Enroll in tuition classes to access lesson recordings, lecture notes, and revision packs."
                : "Your instructors haven't uploaded study materials for your enrolled classes yet. Check back soon!"}
            </p>
            {enrolledCount === 0 && (
              <Link
                href="/enrollment"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#4f6df5] text-white hover:bg-[#3b5ce8] transition-colors shadow-sm shadow-blue-500/20"
              >
                <Sparkles size={14} />
                <span>Browse Classes to Enroll</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.slice(0, 6).map((res, index) => {
              const rawType = (res.type || "").toUpperCase();
              const isVideo =
                rawType.includes("VIDEO") ||
                rawType.includes("RECORDING") ||
                rawType.includes("MP4") ||
                rawType.includes("ZOOM") ||
                rawType.includes("YOUTUBE") ||
                res.fileUrl?.toLowerCase().includes("youtube.com") ||
                res.fileUrl?.toLowerCase().includes("youtu.be");
              const isPdf =
                rawType.includes("PDF") || res.fileUrl?.toLowerCase().includes(".pdf");

              return (
                <article
                  key={res.id || index}
                  className="bg-white rounded-2xl p-5 border border-[#edf0f5] hover:border-[#4f6df5]/50 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Type Icon & Subject/Class Tag */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isVideo
                            ? "bg-blue-50 text-blue-600"
                            : isPdf
                            ? "bg-red-50 text-red-600"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {isVideo ? (
                          <Video size={20} />
                        ) : isPdf ? (
                          <FileText size={20} />
                        ) : (
                          <Link2 size={20} />
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#4f6df5] border border-blue-100">
                          {res.subject || "Subject"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium truncate max-w-[130px]">
                          {res.batchName || "Enrolled Class"}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#4f6df5] transition-colors line-clamp-2 mb-1.5">
                      {res.title}
                    </h4>

                    {/* Instructor / Class Subtitle */}
                    <p className="text-xs text-gray-500 line-clamp-1 mb-3">
                      {res.teacherName ? `Instructor: ${res.teacherName}` : res.batchName}
                    </p>
                  </div>

                  {/* Footer / Action */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 text-[11px]">
                      {res.time || res.size || "Class Material"}
                    </span>

                    {res.fileUrl ? (
                      <a
                        href={res.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#4f6df5] hover:text-[#3b5ce8] hover:underline"
                      >
                        {isVideo ? (
                          <>
                            <Play size={12} className="fill-current" />
                            <span>Watch</span>
                          </>
                        ) : (
                          <>
                            <Download size={12} />
                            <span>Download</span>
                          </>
                        )}
                      </a>
                    ) : (
                      <Link
                        href="/materials"
                        className="inline-flex items-center gap-1 font-semibold text-gray-400 hover:text-gray-700"
                      >
                        <span>View</span>
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
