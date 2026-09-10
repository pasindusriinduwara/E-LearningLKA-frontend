"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, CheckCircle, FileText } from "lucide-react";
import {
  getTeacherDashboard,
  type TeacherDashboardSummary,
} from "@/services/teacherService";

interface TeacherStatsProps {
  summary?: TeacherDashboardSummary | null;
  loading?: boolean;
}

export function TeacherStats({
  summary: externalSummary,
  loading: externalLoading,
}: TeacherStatsProps) {
  const [internalSummary, setInternalSummary] =
    useState<TeacherDashboardSummary | null>(null);
  const [internalLoading, setInternalLoading] = useState(
    externalSummary === undefined
  );

  useEffect(() => {
    if (externalSummary !== undefined) return;
    let active = true;
    setInternalLoading(true);
    getTeacherDashboard()
      .then((data) => {
        if (active) {
          setInternalSummary(data);
          setInternalLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setInternalSummary({
            activeBatches: 0,
            totalStudents: 0,
            scheduledClasses: 0,
            uploadedMaterials: 0,
          });
          setInternalLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [externalSummary]);

  const summary = externalSummary !== undefined ? externalSummary : internalSummary;
  const isLoading =
    externalLoading !== undefined ? externalLoading : internalLoading;

  const value = (number: number | undefined) =>
    isLoading || number === undefined ? "—" : number.toLocaleString();

  const stats = [
    {
      label: "Active batches",
      value: value(summary?.activeBatches),
      subtext: "Currently running batches",
      icon: Calendar,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Total students",
      value: value(summary?.totalStudents),
      subtext: "Enrolled in your classes",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Scheduled classes",
      value: value(summary?.scheduledClasses),
      subtext: "Weekly timetable sessions",
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Materials uploaded",
      value: value(summary?.uploadedMaterials),
      subtext: "Notes, handouts & videos",
      icon: FileText,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
        >
          <div
            className={`${stat.bgColor} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}
          >
            <stat.icon className={stat.iconColor} size={20} />
          </div>
          <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 font-serif mb-1">
            {stat.value}
          </h3>
          <p className="text-xs text-gray-400">{stat.subtext}</p>
        </div>
      ))}
    </div>
  );
}
