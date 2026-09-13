"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, ChevronRight, Sparkles } from "lucide-react";
import { requestEnrollment } from "@/services/enrollmentService";
import type { AvailableBatch } from "@/services/batchService";

export function ClassCard({
  batch,
  onClick,
  onStatusChange,
}: {
  batch: AvailableBatch;
  onClick?: () => void;
  onStatusChange?: (newStatus: "AVAILABLE" | "PENDING" | "APPROVED" | "REJECTED") => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(batch.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(batch.status);
  }, [batch.status]);

  function handleCardClick() {
    if (onClick) {
      onClick();
    } else {
      router.push(`/enrollment/${batch.id}`);
    }
  }

  async function handleEnroll(e: React.MouseEvent) {
    e.stopPropagation();
    setError("");
    setLoading(true);

    try {
      await requestEnrollment(batch.id);
      setStatus("PENDING");
      if (onStatusChange) {
        onStatusChange("PENDING");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Enrollment request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#2D9F75]/60 hover:shadow-lg transition-all flex flex-col h-full cursor-pointer group relative overflow-hidden"
    >
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2D9F75] via-emerald-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#2D9F75] border border-emerald-100">
            {batch.subject}
          </span>
          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {batch.deliveryMode}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2D9F75] transition-colors leading-snug">
          {batch.name}
        </h3>

        <div className="space-y-2 my-4">
          <div className="flex items-center text-xs text-gray-600 gap-2">
            <User size={14} className="text-gray-400 shrink-0" />
            <span className="font-medium text-gray-800">{batch.teacher}</span>
            {batch.teacherQualification && (
              <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                ({batch.teacherQualification})
              </span>
            )}
          </div>

          <div className="flex items-center text-xs text-gray-600 gap-2">
            <Clock size={14} className="text-gray-400 shrink-0" />
            <span>{batch.schedule || "Schedule not set"}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Exam year: {batch.examYear}</span>
            <span className="font-semibold text-gray-800">
              LKR {Number(batch.monthlyFee || 0).toLocaleString()} / mo
            </span>
          </div>
        </div>
      </div>

      {/* Preview prompt hint */}
      <div className="text-[11px] font-semibold text-[#2D9F75] flex items-center justify-between py-2 border-t border-gray-100 group-hover:text-emerald-700 transition-colors">
        <span className="flex items-center gap-1">
          <Sparkles size={12} />
          <span>View Class Page & Educator Profile</span>
        </span>
        <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
      </div>

      {error && (
        <p className="mb-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
        {status === "PENDING" ? (
          <button
            disabled
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200"
          >
            Pending Approval
          </button>
        ) : status === "APPROVED" ? (
          <button
            disabled
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200"
          >
            Enrolled
          </button>
        ) : status === "REJECTED" ? (
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
          >
            {loading ? "Processing..." : "Request Again"}
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-sm transition-colors"
          >
            {loading ? "Processing..." : "Enroll Now"}
          </button>
        )}
      </div>
    </div>
  );
}
