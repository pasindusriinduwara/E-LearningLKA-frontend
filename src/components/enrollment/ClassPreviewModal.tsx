"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Award,
  Video,
  BookOpen,
  FileText,
  ShieldCheck,
  ChevronRight,
  LogOut,
  XCircle,
} from "lucide-react";
import type { AvailableBatch } from "@/services/batchService";
import {
  requestEnrollment,
  cancelEnrollmentRequest,
  leaveClass,
} from "@/services/enrollmentService";

interface ClassPreviewModalProps {
  batch: AvailableBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onEnrollSuccess?: (batchId: string) => void;
  onStatusChange?: (
    batchId: string,
    newStatus: "AVAILABLE" | "PENDING" | "APPROVED" | "REJECTED"
  ) => void;
}

export function ClassPreviewModal({
  batch,
  isOpen,
  onClose,
  onEnrollSuccess,
  onStatusChange,
}: ClassPreviewModalProps) {
  const [status, setStatus] = useState<string>("AVAILABLE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enrolledSuccess, setEnrolledSuccess] = useState(false);

  useEffect(() => {
    if (batch) {
      setStatus(batch.status || "AVAILABLE");
      setError("");
      setEnrolledSuccess(false);
    }
  }, [batch]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !batch) return null;

  async function handleEnroll() {
    if (!batch) return;
    setError("");
    setLoading(true);

    try {
      await requestEnrollment(batch.id);
      setStatus("PENDING");
      setEnrolledSuccess(true);
      if (onEnrollSuccess) {
        onEnrollSuccess(batch.id);
      }
      if (onStatusChange) {
        onStatusChange(batch.id, "PENDING");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enrollment request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelRequest() {
    if (!batch) return;
    if (!confirm("Are you sure you want to cancel your enrollment request?")) {
      return;
    }
    setError("");
    setLoading(true);

    try {
      await cancelEnrollmentRequest(batch.id);
      setStatus("AVAILABLE");
      setEnrolledSuccess(false);
      if (onStatusChange) {
        onStatusChange(batch.id, "AVAILABLE");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel request"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveClass() {
    if (!batch) return;
    if (!confirm("Are you sure you want to leave this class? You will lose access to all class materials, assessments, and live sessions.")) {
      return;
    }
    setError("");
    setLoading(true);

    try {
      await leaveClass(batch.id);
      setStatus("AVAILABLE");
      setEnrolledSuccess(false);
      if (onStatusChange) {
        onStatusChange(batch.id, "AVAILABLE");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to leave class"
      );
    } finally {
      setLoading(false);
    }
  }

  // Generate initials for teacher avatar
  const teacherInitials = (batch.teacher || "T")
    .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s*/i, "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "T";

  const isApproved = status === "APPROVED";
  const isPending = status === "PENDING";
  const isRejected = status === "REJECTED";

  const deliveryModeLabel =
    batch.deliveryMode === "ONLINE"
      ? "100% Online"
      : batch.deliveryMode === "HYBRID"
      ? "Hybrid (Online & In-Person)"
      : "In-Person Classroom";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 via-white to-sky-50/40">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2D9F75] text-white tracking-wide shadow-sm">
              {batch.subject || "Subject"}
            </span>

            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                batch.deliveryMode === "ONLINE"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : batch.deliveryMode === "HYBRID"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {batch.deliveryMode || "HYBRID"}
            </span>

            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {batch.examYear} A/L
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Class Title & Summary */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-serif leading-tight">
              {batch.name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-[#2D9F75]" />
              Comprehensive curriculum designed for Sri Lanka G.C.E. Advanced Level examinations.
            </p>
          </div>

          {/* Pricing Banner */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Monthly Tuition Fee
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-gray-900">
                  LKR {Number(batch.monthlyFee || 0).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 font-medium">/ month</span>
              </div>
            </div>

            <div className="text-xs text-emerald-700 font-medium bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-[#2D9F75]" />
              <span>Full curriculum & digital materials included</span>
            </div>
          </div>

          {/* Teacher Profile Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <GraduationCap size={15} className="text-[#2D9F75]" />
                <span>Teacher Profile & Educator Preview</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={12} />
                Verified Educator
              </span>
            </div>

            <div className="flex items-start gap-4">
              {/* Teacher Avatar */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2D9F75] to-emerald-700 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-md shrink-0 border-2 border-white ring-2 ring-emerald-100">
                {teacherInitials}
              </div>

              {/* Teacher Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                  <span>{batch.teacher || "Assigned Teacher"}</span>
                </h3>

                {batch.teacherQualification ? (
                  <p className="text-xs font-semibold text-[#2D9F75] flex items-center gap-1 mt-0.5">
                    <Award size={13} className="shrink-0" />
                    <span>{batch.teacherQualification}</span>
                  </p>
                ) : (
                  <p className="text-xs font-medium text-gray-500 mt-0.5">
                    Educator • {batch.subject || "Academics"}
                  </p>
                )}

                <div className="mt-3 text-xs text-gray-600 leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                  {batch.teacherBio && batch.teacherBio.trim().length > 0 ? (
                    <p className="whitespace-pre-line">{batch.teacherBio}</p>
                  ) : (
                    <p className="text-gray-500 italic">
                      Instructor profile for {batch.teacher} leading the {batch.name} batch for {batch.subject} ({batch.examYear} A/L).
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Class Delivery & Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Delivery Mode Info */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <Video size={15} className="text-blue-600" />
                <span>Class Delivery Mode</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {deliveryModeLabel}
              </p>
              <p className="text-xs text-gray-500 leading-normal">
                {batch.deliveryMode === "ONLINE"
                  ? "Interactive live classes hosted online with recorded replays available 24/7."
                  : batch.deliveryMode === "HYBRID"
                  ? "Attend sessions either physically at the institute or join live online from home."
                  : "Physical in-person classes held at the designated institute lecture theater."}
              </p>
            </div>

            {/* Schedule Info */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <Clock size={15} className="text-amber-600" />
                <span>Class Timetable</span>
              </div>

              {batch.scheduleList && batch.scheduleList.length > 0 ? (
                <div className="space-y-1">
                  {batch.scheduleList.map((slot, index) => (
                    <div
                      key={index}
                      className="text-xs font-semibold text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 inline-block mr-1.5 mb-1 shadow-2xs"
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold text-gray-800">
                  {batch.schedule || "Schedule announced soon"}
                </p>
              )}

              <p className="text-xs text-gray-500 leading-normal">
                Recurring live lecture hours for {batch.subject}. Regular calendar sync available upon enrollment.
              </p>
            </div>
          </div>

          {/* What this class includes */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Included with Enrollment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-100">
                <BookOpen size={14} className="text-[#2D9F75] shrink-0" />
                <span>
                  {batch.materialsCount && batch.materialsCount > 0
                    ? `${batch.materialsCount} Course Materials & Revision Modules`
                    : `Syllabus study materials for ${batch.subject}`}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-100">
                <FileText size={14} className="text-[#2D9F75] shrink-0" />
                <span>
                  {batch.scheduleList && batch.scheduleList.length > 0
                    ? `${batch.scheduleList.length} Scheduled Weekly Sessions`
                    : `Regular lecture sessions & evaluations`}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-100">
                <Video size={14} className="text-[#2D9F75] shrink-0" />
                <span>
                  {batch.deliveryMode === "ONLINE"
                    ? "Interactive online sessions with 24/7 video replays"
                    : batch.deliveryMode === "HYBRID"
                    ? "Dual delivery: In-person classroom & live online replay"
                    : "Direct physical institute lectures & laboratory discussions"}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-100">
                <GraduationCap size={14} className="text-[#2D9F75] shrink-0" />
                <span>Direct academic guidance with {batch.teacher}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {enrolledSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>
                Enrollment request sent successfully! The teacher has been notified to approve your request.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors order-2 sm:order-1"
          >
            Close Preview
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2 order-1 sm:order-2">
            {isApproved ? (
              <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span>Enrolled</span>
                </span>
                <Link
                  href={`/classes/${batch.id}`}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Open Classroom</span>
                  <ChevronRight size={14} />
                </Link>
                <button
                  type="button"
                  onClick={handleLeaveClass}
                  disabled={loading}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Leave this class"
                >
                  <LogOut size={14} />
                  <span>{loading ? "Leaving..." : "Leave Class"}</span>
                </button>
              </div>
            ) : isPending ? (
              <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap">
                <div className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center gap-2">
                  <Clock size={15} />
                  <span>Pending Approval</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  disabled={loading}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Cancel enrollment request"
                >
                  <XCircle size={14} />
                  <span>{loading ? "Cancelling..." : "Cancel Request"}</span>
                </button>
              </div>
            ) : isRejected ? (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Request Again</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>
                      Enroll in Class • LKR {Number(batch.monthlyFee || 0).toLocaleString()}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
