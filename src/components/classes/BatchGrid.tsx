"use client";

import { Clock, ArrowUpRight } from "lucide-react";
import type { TeacherBatch } from "@/services/teacherService";

const modeStyles: Record<string, string> = {
  ONLINE: "bg-blue-50 text-blue-600",
  IN_PERSON: "bg-emerald-50 text-emerald-600",
  HYBRID: "bg-purple-50 text-purple-600",
};

interface BatchGridProps {
  batches: TeacherBatch[];
  subjects: { id: string; name: string }[];
  onSelect: (batch: TeacherBatch) => void;
}

export function BatchGrid({
  batches,
  subjects,
  onSelect,
}: BatchGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {batches.map((batch) => {
        const subject =
          subjects.find((item) => item.id === batch.subjectId)?.name ??
          "Unknown subject";

        const modeClass =
          modeStyles[batch.deliveryMode] ??
          "bg-gray-50 text-gray-600";

        return (
          <button
            key={batch.id}
            type="button"
            onClick={() => onSelect(batch)}
            className="w-full text-left bg-white rounded-2xl shadow-sm border-t-4 border-t-[#2D9F75] border-x border-b border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">
                {batch.name}
              </h3>

              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${modeClass}`}
              >
                {batch.deliveryMode}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-5">
              {subject}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
              <Clock size={16} className="text-gray-400" />
              <span>Exam year {batch.examYear}</span>
            </div>

            <div>
              <div className="flex justify-between items-end text-sm mb-2">
                <span className="text-gray-500">Enrollment</span>

                <span className="font-bold text-gray-900">
                  {batch.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="w-full h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    batch.active
                      ? "bg-[#2D9F75] w-full"
                      : "bg-gray-400 w-1/3"
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400 font-medium">
                  Monthly fee: LKR {batch.monthlyFee}
                </p>

                <ArrowUpRight size={17} className="text-[#2D9F75]" />
              </div>

              <p className="mt-3 text-xs font-semibold text-[#2D9F75]">
                Click to view enrollments
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}