"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle2,
  Clock3,
  Bell,
  FileText,
  Calendar,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { TeacherBatch, TeacherStudentView, PendingEnrollmentRequest, TeacherAnnouncement } from "@/services/teacherService";
import type { ClassScheduleItem } from "@/lib/types/class";

interface TeacherWidgetsProps {
  batches?: TeacherBatch[];
  schedules?: ClassScheduleItem[];
  students?: TeacherStudentView[];
  announcements?: TeacherAnnouncement[];
  pendingRequests?: PendingEnrollmentRequest[];
  loading?: boolean;
}

export function TeacherWidgets({
  batches = [],
  schedules = [],
  students = [],
  announcements = [],
  pendingRequests = [],
  loading = false,
}: TeacherWidgetsProps) {
  const dayNamesFull = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const dayNamesShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const now = new Date();
  const currentDayIndex = now.getDay();
  const todayFull = dayNamesFull[currentDayIndex];
  const todayShort = dayNamesShort[currentDayIndex];

  // Filter today's classes
  const todayClasses = useMemo(() => {
    return schedules.filter((s) => {
      const dow = (s.dayOfWeek || s.day || "").toUpperCase();
      if (dow === todayFull || dow === todayShort) return true;
      if (s.date) {
        const sDate = new Date(s.date);
        if (!isNaN(sDate.getTime()) && sDate.toDateString() === now.toDateString()) {
          return true;
        }
      }
      return false;
    });
  }, [schedules, todayFull, todayShort]);

  // Find next upcoming class in the week if none today
  const nextClass = useMemo(() => {
    if (todayClasses.length > 0 || schedules.length === 0) return null;
    const dayOrder: Record<string, number> = {
      MONDAY: 1, MON: 1,
      TUESDAY: 2, TUE: 2,
      WEDNESDAY: 3, WED: 3,
      THURSDAY: 4, THU: 4,
      FRIDAY: 5, FRI: 5,
      SATURDAY: 6, SAT: 6,
      SUNDAY: 7, SUN: 7,
    };
    const currentIso = currentDayIndex === 0 ? 7 : currentDayIndex;
    const sorted = [...schedules].sort((a, b) => {
      const aDay = dayOrder[(a.dayOfWeek || a.day || "").toUpperCase()] || 0;
      const bDay = dayOrder[(b.dayOfWeek || b.day || "").toUpperCase()] || 0;
      const aDiff = (aDay - currentIso + 7) % 7 || 7;
      const bDiff = (bDay - currentIso + 7) % 7 || 7;
      return aDiff - bDiff;
    });
    return sorted[0] || null;
  }, [schedules, todayClasses.length, currentDayIndex]);

  // Helper to map batch name from ID
  function getBatchName(batchId?: string, fallbackSubject?: string) {
    if (!batchId) return fallbackSubject || "Class session";
    const found = batches.find((b) => b.id === batchId);
    return found ? found.name : fallbackSubject || "Class session";
  }

  // Student initials & avatar colors
  function getInitials(name: string) {
    if (!name) return "ST";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const avatarColors = [
    "bg-emerald-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-teal-600",
    "bg-amber-600",
  ];

  function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: Today's Classes */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Today
          </h3>
          <Link
            href="/teacher/classes"
            className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
          >
            All classes <ArrowRight size={12} />
          </Link>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 font-serif mb-4">
          Today&apos;s classes
        </h2>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/3"></div>
            </div>
          ) : todayClasses.length > 0 ? (
            todayClasses.map((item, idx) => {
              const isOnline = item.mode?.toUpperCase().includes("ONLINE");
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`bg-white p-5 rounded-2xl border-l-4 ${
                    isOnline ? "border-l-blue-500" : "border-l-emerald-500"
                  } border border-gray-100 shadow-sm transition-all hover:shadow-md`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-gray-900 text-sm md:text-base">
                      {item.title}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                        isOnline
                          ? "text-blue-600 bg-blue-50"
                          : "text-emerald-600 bg-emerald-50"
                      }`}
                    >
                      {isOnline ? "Online" : "In person"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {getBatchName(item.batchId, item.subject)}
                    {item.subject && ` • ${item.subject}`}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-gray-600 font-medium">
                      <Clock size={14} className="text-emerald-600" />{" "}
                      {item.time || `${item.startTime || ""} - ${item.endTime || ""}`}
                    </span>
                    <span className="flex items-center gap-1">
                      {isOnline ? (
                        <Video size={14} className="text-blue-500" />
                      ) : (
                        <MapPin size={14} className="text-emerald-500" />
                      )}
                      {item.location || (isOnline ? "Live stream" : "Classroom")}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Calendar size={22} />
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">
                No classes scheduled today
              </h4>
              {nextClass ? (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl text-left border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                    Next up in your schedule
                  </p>
                  <p className="text-xs font-bold text-gray-800">
                    {nextClass.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {nextClass.dayOfWeek || nextClass.day} • {nextClass.time}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-4">
                  Take this time to prepare materials or schedule your next sessions.
                </p>
              )}
              <Link
                href="/teacher/classes"
                className="mt-4 inline-flex items-center justify-center gap-1.5 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
              >
                View weekly timetable
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Enrolled Students */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Students
          </h3>
          <span className="text-xs font-semibold text-gray-500">
            {students.length} total
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 font-serif mb-4">
          Enrolled students
        </h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-3 space-y-1">
          {loading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : students.length > 0 ? (
            <>
              {students.slice(0, 5).map((student, idx) => (
                <div
                  key={`${student.id}-${student.batchName || idx}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 shrink-0 rounded-full ${getAvatarColor(
                        student.name
                      )} text-white flex items-center justify-center font-bold text-xs shadow-sm`}
                    >
                      {getInitials(student.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {student.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {student.batchName || "Enrolled"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[11px] font-mono font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {student.studentId || "Student"}
                    </span>
                  </div>
                </div>
              ))}

              <Link
                href="/teacher/classes"
                className="block text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 p-2 pt-3 border-t border-gray-100 hover:underline"
              >
                View all enrolled students →
              </Link>
            </>
          ) : (
            <div className="p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Users size={18} />
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">
                No students enrolled yet
              </h4>
              <p className="text-xs text-gray-500">
                As students enroll in your batches, their profiles will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Pending Tasks & Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Action Required
          </h3>
          <span className="text-xs font-semibold text-emerald-600">
            Hub
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 font-serif mb-4">
          Pending & Quick Actions
        </h2>

        <div className="space-y-3">
          {/* Pending Enrollment Requests */}
          {pendingRequests.length > 0 ? (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-700 mt-0.5">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                    Enrollment Approval
                  </p>
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                    {pendingRequests.length} student{pendingRequests.length > 1 ? "s" : ""} waiting
                  </h4>
                  <p className="text-xs text-amber-800/80">
                    Review and approve batch enrollment requests.
                  </p>
                </div>
              </div>
              <Link
                href="/teacher/classes"
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Review
              </Link>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 mt-0.5">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Enrollments
                </p>
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                  All requests reviewed
                </h4>
                <p className="text-xs text-gray-400">
                  No pending student enrollments waiting for approval.
                </p>
              </div>
            </div>
          )}

          {/* Quick Learning Materials Upload Link */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-600 mt-0.5">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Course Materials
                </p>
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                  Upload learning resources
                </h4>
                <p className="text-xs text-gray-400">
                  Add PDF notes, past papers, or video lecture links.
                </p>
              </div>
            </div>
            <Link
              href="/teacher/materials"
              className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Upload
            </Link>
          </div>

          {/* Post Announcement Card */}
          <div className="bg-[#133A2D] rounded-2xl p-5 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={16} className="text-emerald-400" />
                <h4 className="font-bold text-sm">Class Announcements</h4>
              </div>
              {announcements.length > 0 ? (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-emerald-200 truncate">
                    Latest: {announcements[0].title}
                  </p>
                  <p className="text-emerald-100/70 text-xs line-clamp-2 mt-0.5">
                    {announcements[0].description}
                  </p>
                </div>
              ) : (
                <p className="text-emerald-100/70 text-xs mb-4">
                  Broadcast exam alerts, schedule changes, or study reminders to your students.
                </p>
              )}
              <Link
                href="/teacher/classes"
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Post announcement <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
