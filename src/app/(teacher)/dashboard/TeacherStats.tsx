"use client";

import { useEffect, useState } from "react";
import { Calendar, TrendingUp, CheckCircle, FileText } from "lucide-react";
import { getTeacherDashboard, type TeacherDashboardSummary } from "@/services/teacherService";

export function TeacherStats() {
  const [summary, setSummary] = useState<TeacherDashboardSummary | null>(null);

  useEffect(() => {
    let active = true;
    getTeacherDashboard()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setSummary({ activeBatches: 0, totalStudents: 0, scheduledClasses: 0, uploadedMaterials: 0 });
      });
    return () => {
      active = false;
    };
  }, []);

  const value = (number: number | undefined) => (number === undefined ? "—" : number.toString());

  const stats = [
    { label: "Active batches", value: value(summary?.activeBatches), subtext: "Currently active", icon: Calendar, iconColor: "text-emerald-500", bgColor: "bg-emerald-50" },
    { label: "Total students", value: "128", subtext: "↑ 6 this month", icon: TrendingUp, iconColor: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Scheduled classes", value: value(summary?.scheduledClasses), subtext: "Across your batches", icon: CheckCircle, iconColor: "text-green-500", bgColor: "bg-green-50" },
    { label: "Materials uploaded", value: value(summary?.uploadedMaterials), subtext: "Stored in Cloudinary", icon: FileText, iconColor: "text-amber-500", bgColor: "bg-amber-50" },
  ];
  if (summary) {
    stats[1] = { ...stats[1], value: value(summary.totalStudents), subtext: "Enrolled students" };
  } else {
    stats[1] = { ...stats[1], value: value(undefined), subtext: "Loading..." };
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className={`${stat.bgColor} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
            <stat.icon className={stat.iconColor} size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 font-serif mb-1">{stat.value}</h3>
          <p className="text-xs text-gray-400">{stat.subtext}</p>
        </div>
      ))}
    </div>
  );
}
