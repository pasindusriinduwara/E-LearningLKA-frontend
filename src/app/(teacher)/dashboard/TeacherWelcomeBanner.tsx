"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { TeacherBatch } from "@/services/teacherService";
import type { ClassScheduleItem } from "@/lib/types/class";

interface TeacherWelcomeBannerProps {
  batches?: TeacherBatch[];
  schedules?: ClassScheduleItem[];
  loading?: boolean;
}

export function TeacherWelcomeBanner({
  batches = [],
  schedules = [],
  loading = false,
}: TeacherWelcomeBannerProps) {
  const { user } = useAuth();
  const teacherName = user?.name || "Teacher";

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

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
  const currentDayIndex = now.getDay();
  const todayFull = dayNamesFull[currentDayIndex];
  const todayShort = dayNamesShort[currentDayIndex];

  const todayClasses = useMemo(() => {
    if (!schedules) return [];
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

  const dayOrder: Record<string, number> = {
    MONDAY: 1,
    MON: 1,
    TUESDAY: 2,
    TUE: 2,
    WEDNESDAY: 3,
    WED: 3,
    THURSDAY: 4,
    THU: 4,
    FRIDAY: 5,
    FRI: 5,
    SATURDAY: 6,
    SAT: 6,
    SUNDAY: 7,
    SUN: 7,
  };
  const currentIsoDay = currentDayIndex === 0 ? 7 : currentDayIndex;

  const totalWeeklyCount = schedules.length;
  const completedCount = useMemo(() => {
    if (totalWeeklyCount === 0) return 0;
    return schedules.filter((s) => {
      const dow = (s.dayOfWeek || s.day || "").toUpperCase();
      const order = dayOrder[dow] || 0;
      return order > 0 && order < currentIsoDay;
    }).length;
  }, [schedules, currentIsoDay, totalWeeklyCount]);

  const progressPercent =
    totalWeeklyCount > 0
      ? Math.min(100, Math.round((completedCount / totalWeeklyCount) * 100))
      : 0;

  const subtitle = useMemo(() => {
    if (loading) return "Loading your daily agenda and class schedule...";
    if (todayClasses.length > 0) {
      return `You have ${todayClasses.length} ${
        todayClasses.length === 1 ? "class" : "classes"
      } scheduled for today across your active batches.`;
    }
    if (batches.length > 0) {
      return `You have no classes scheduled for today across your ${
        batches.length
      } active ${batches.length === 1 ? "batch" : "batches"}.`;
    }
    return "Welcome to your teaching hub. Get started by creating your first batch or scheduling sessions.";
  }, [loading, todayClasses.length, batches.length]);

  return (
    <div className="bg-[#133A2D] rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white overflow-hidden relative shadow-sm">
      <div className="relative z-10">
        <p className="text-emerald-400/80 text-xs font-bold tracking-widest uppercase mb-2">
          {today}
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif mb-3">
          {greeting}, {teacherName}.
        </h1>
        <p className="text-emerald-100/70 text-sm md:text-base max-w-lg mb-6">
          {subtitle}
        </p>

        <div className="flex gap-2 flex-wrap">
          {batches && batches.length > 0 ? (
            batches.slice(0, 4).map((batch, idx) => {
              const styles = [
                "bg-emerald-900/50 border-emerald-700/50 text-emerald-100",
                "bg-blue-900/30 border-blue-700/50 text-blue-100",
                "bg-teal-900/30 border-teal-700/50 text-teal-100",
                "bg-indigo-900/30 border-indigo-700/50 text-indigo-100",
              ];
              const dotColors = [
                "bg-emerald-400",
                "bg-blue-400",
                "bg-teal-400",
                "bg-indigo-400",
              ];
              const style = styles[idx % styles.length];
              const dotColor = dotColors[idx % dotColors.length];

              return (
                <span
                  key={`${batch.id}-${idx}`}
                  className={`border text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${style}`}
                >
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  {batch.name}
                </span>
              );
            })
          ) : (
            <span className="bg-emerald-900/40 border border-emerald-700/50 text-emerald-200 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {loading ? "Loading batches..." : "No active batches"}
            </span>
          )}

          {batches && batches.length > 4 && (
            <span className="bg-emerald-950/60 border border-emerald-700/40 text-emerald-200 text-xs px-3 py-1.5 rounded-full">
              +{batches.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 md:mt-0 bg-[#1A4537] border border-emerald-800/50 rounded-xl p-5 w-full md:w-64 relative z-10">
        <p className="text-emerald-400/80 text-[10px] font-bold tracking-widest uppercase mb-1">
          This Week
        </p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold">{loading ? "—" : totalWeeklyCount}</span>
        </div>
        <p className="text-emerald-100/70 text-xs mb-4">classes scheduled</p>
        <div className="w-full bg-[#133A2D] h-1.5 rounded-full mb-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-emerald-400/60 text-[10px] text-right">
          {totalWeeklyCount === 0
            ? "No classes this week"
            : `${completedCount} of ${totalWeeklyCount} elapsed`}
        </p>
      </div>
    </div>
  );
}
