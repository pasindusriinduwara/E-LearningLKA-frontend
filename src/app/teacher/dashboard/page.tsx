"use client";

import { useEffect, useState, useCallback } from "react";
import { TeacherWelcomeBanner } from "@/app/(teacher)/dashboard/TeacherWelcomeBanner";
import { TeacherStats } from "@/app/(teacher)/dashboard/TeacherStats";
import { TeacherWidgets } from "@/app/(teacher)/dashboard/TeacherWidgets";
import {
  getTeacherDashboard,
  getTeacherBatches,
  getTeacherSchedules,
  getTeacherStudents,
  getTeacherAnnouncements,
  getTeacherPendingEnrollments,
  type TeacherDashboardSummary,
  type TeacherBatch,
  type TeacherStudentView,
  type TeacherAnnouncement,
  type PendingEnrollmentRequest,
} from "@/services/teacherService";
import type { ClassScheduleItem } from "@/lib/types/class";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<TeacherDashboardSummary | null>(null);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [students, setStudents] = useState<TeacherStudentView[]>([]);
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingEnrollmentRequest[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [
        summaryRes,
        batchesRes,
        schedulesRes,
        studentsRes,
        announcementsRes,
        pendingRes,
      ] = await Promise.allSettled([
        getTeacherDashboard(),
        getTeacherBatches(),
        getTeacherSchedules(),
        getTeacherStudents(),
        getTeacherAnnouncements(),
        getTeacherPendingEnrollments(),
      ]);

      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
      if (batchesRes.status === "fulfilled") setBatches(batchesRes.value);
      if (schedulesRes.status === "fulfilled") setSchedules(schedulesRes.value);
      if (studentsRes.status === "fulfilled") setStudents(studentsRes.value);
      if (announcementsRes.status === "fulfilled") setAnnouncements(announcementsRes.value);
      if (pendingRes.status === "fulfilled") setPendingRequests(pendingRes.value);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Overview
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900 font-serif">
            Teacher Dashboard
          </h1>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin text-emerald-600" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <TeacherWelcomeBanner
        batches={batches}
        schedules={schedules}
        loading={loading}
      />

      <TeacherStats
        summary={summary}
        loading={loading}
      />

      <TeacherWidgets
        batches={batches}
        schedules={schedules}
        students={students}
        announcements={announcements}
        pendingRequests={pendingRequests}
        loading={loading}
      />
    </div>
  );
}
