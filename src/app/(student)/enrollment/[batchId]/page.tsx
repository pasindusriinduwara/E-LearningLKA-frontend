"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Sparkles,
  Award,
  Video,
  BookOpen,
  FileText,
  ShieldCheck,
  AlertCircle,
  Users,
  MapPin,
  RefreshCw,
  XCircle,
  HelpCircle,
  Check,
  Sparkle,
  LogOut,
} from "lucide-react";
import {
  getBatchById,
  type AvailableBatch,
  type ScheduleSummary,
} from "@/services/batchService";
import {
  requestEnrollment,
  cancelEnrollmentRequest,
  leaveClass,
  getMyEnrollmentStatuses,
} from "@/services/enrollmentService";
import { useAuth } from "@/context/AuthContext";

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const batchId = params?.batchId as string;
  const isTeacherPreview = searchParams?.get("preview") === "teacher" || user?.role === "TEACHER";

  const [batch, setBatch] = useState<AvailableBatch | null>(null);
  const [status, setStatus] = useState<string>("AVAILABLE");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadBatchData() {
    if (!batchId) return;

    try {
      setLoading(true);
      setError("");

      const [batchData, enrollmentStatuses] = await Promise.all([
        getBatchById(batchId),
        getMyEnrollmentStatuses().catch(() => []),
      ]);

      const matchingStatus = enrollmentStatuses.find(
        (item) => item.batchId === batchId
      )?.status;

      setBatch(batchData);
      // Backend automatically computes status for authenticated student, fallback to enrollment statuses if available
      setStatus(batchData.status || matchingStatus || "AVAILABLE");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load class details"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatchData();
  }, [batchId]);

  async function handleEnroll() {
    if (!batchId) return;
    setError("");
    setSuccessMessage("");
    setSubmitting(true);

    try {
      await requestEnrollment(batchId);
      setStatus("PENDING");
      setSuccessMessage(
        "Enrollment request submitted! Your educator has been notified and will approve your seat shortly."
      );
      // Refetch latest batch details to update real counts
      const updated = await getBatchById(batchId).catch(() => null);
      if (updated) {
        setBatch(updated);
        setStatus(updated.status || "PENDING");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enrollment request failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelRequest() {
    if (!batchId) return;
    if (!confirm("Are you sure you want to cancel your pending enrollment request?")) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setCancelling(true);

    try {
      await cancelEnrollmentRequest(batchId);
      setStatus("AVAILABLE");
      setSuccessMessage("Your enrollment request has been cancelled.");
      // Refresh dynamic batch data
      const updated = await getBatchById(batchId).catch(() => null);
      if (updated) {
        setBatch(updated);
        setStatus("AVAILABLE");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel request"
      );
    } finally {
      setCancelling(false);
    }
  }

  async function handleLeaveClass() {
    if (!batchId) return;
    if (!confirm("Are you sure you want to leave this class? You will lose access to all class materials, assessments, and live sessions.")) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setLeaving(true);

    try {
      await leaveClass(batchId);
      setStatus("AVAILABLE");
      setSuccessMessage("You have successfully left this class.");
      const updated = await getBatchById(batchId).catch(() => null);
      if (updated) {
        setBatch(updated);
        setStatus("AVAILABLE");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to leave class"
      );
    } finally {
      setLeaving(false);
    }
  }

  // Generate initials for teacher avatar
  const teacherInitials = (batch?.teacher || "T")
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
    batch?.deliveryMode === "ONLINE"
      ? "100% Online"
      : batch?.deliveryMode === "HYBRID"
      ? "Hybrid (Online & In-Person)"
      : "In-Person Classroom";

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded-lg" />
        <div className="h-10 w-96 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded-3xl" />
            <div className="h-48 bg-gray-200 rounded-3xl" />
          </div>
          <div className="h-96 bg-gray-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Class Not Found</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          {error || "The tuition class you are looking for does not exist or has been removed."}
        </p>
        <div className="pt-2">
          <Link
            href="/enrollment"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#2D9F75] text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Browse Available Classes</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!batch) return null;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8">
      {/* Teacher Preview Banner if viewing from teacher perspective */}
      {isTeacherPreview && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200/70 text-amber-800 rounded-lg">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="font-bold">Teacher Preview Mode</p>
              <p className="text-amber-700">This is how your students see this class in the enrollment catalog.</p>
            </div>
          </div>
          <Link
            href="/teacher/classes"
            className="px-3.5 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300/80 font-bold text-amber-900 transition-colors shrink-0"
          >
            Back to Class Management
          </Link>
        </div>
      )}

      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <Link
            href="/enrollment"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#2D9F75] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Class Catalog</span>
          </Link>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="text-[#2D9F75] font-bold">{batch.subject}</span>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="text-gray-500 truncate max-w-[200px] sm:max-w-xs">
            {batch.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBatchData}
            title="Refresh class details"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <Link
            href="/enrollment"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200/70 rounded-xl transition-all"
          >
            <ArrowLeft size={14} />
            <span>All Classes</span>
          </Link>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-[#194030] to-teal-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-teal-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#2D9F75] text-white tracking-wide shadow-md">
              {batch.subject || "Subject"}
            </span>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border ${
                batch.deliveryMode === "ONLINE"
                  ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                  : batch.deliveryMode === "HYBRID"
                  ? "bg-purple-500/20 text-purple-200 border-purple-400/30"
                  : "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
              }`}
            >
              {batch.deliveryMode || "HYBRID"}
            </span>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md">
              {batch.examYear} A/L
            </span>

            {isApproved && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 flex items-center gap-1.5 backdrop-blur-md">
                <CheckCircle2 size={13} />
                <span>Enrolled & Active</span>
              </span>
            )}

            {isPending && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 flex items-center gap-1.5 backdrop-blur-md">
                <Clock size={13} />
                <span>Enrollment Pending</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif tracking-tight leading-tight">
            {batch.name}
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-300 shrink-0" />
            <span>
              {batch.subject} • {batch.examYear} A/L academic curriculum delivered via {deliveryModeLabel}.
            </span>
          </p>

          {/* Live Dynamic Stats Strip */}
          <div className="pt-2 flex items-center gap-3 sm:gap-6 flex-wrap text-xs text-emerald-100/80">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Users size={14} className="text-emerald-300" />
              <span>
                <strong className="text-white">{Number(batch.enrolledCount || 0)}</strong> Students Enrolled
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <BookOpen size={14} className="text-teal-300" />
              <span>
                <strong className="text-white">{Number(batch.materialsCount || 0)}</strong> Study Modules & Materials
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Award size={14} className="text-amber-300" />
              <span>National Syllabus Aligned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Success / Error Banners */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 text-sm font-medium shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-red-800 text-sm font-medium shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="text-xs text-red-700 hover:text-red-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details, Teacher & Curriculum */}
        <div className="lg:col-span-2 space-y-8">
          {/* Teacher Profile Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <GraduationCap size={18} className="text-[#2D9F75]" />
                <span>Teacher Profile & Educator Preview</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 size={13} />
                <span>Verified Educator</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Teacher Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#2D9F75] to-emerald-800 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shrink-0 border-4 border-white ring-4 ring-emerald-50">
                {teacherInitials}
              </div>

              {/* Teacher Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {batch.teacher || "Assigned Teacher"}
                </h3>

                {batch.teacherQualification ? (
                  <p className="text-sm font-semibold text-[#2D9F75] flex items-center gap-1.5">
                    <Award size={16} className="shrink-0" />
                    <span>{batch.teacherQualification}</span>
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Educator • {batch.subject || "Academics"}
                  </p>
                )}

                <div className="pt-1 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>{batch.subject} Specialist</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} className="text-blue-600" />
                    <span>{batch.examYear} A/L Batch</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-teal-600" />
                    <span>{Number(batch.enrolledCount || 0)} Enrolled Students</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Teacher Bio */}
            <div className="bg-gray-50/90 p-5 rounded-2xl border border-gray-100 text-sm text-gray-700 leading-relaxed space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Educator Profile
              </p>
              {batch.teacherBio && batch.teacherBio.trim().length > 0 ? (
                <p className="whitespace-pre-line">{batch.teacherBio}</p>
              ) : (
                <p className="text-gray-500 italic">
                  Instructor profile for {batch.teacher} leading the {batch.name} batch for {batch.subject} ({batch.examYear} A/L).
                </p>
              )}
            </div>
          </div>

          {/* Delivery Mode & Dynamic Timetable Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Delivery Mode Box */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Video size={18} />
                  </div>
                  <span>Class Delivery Mode</span>
                </div>

                <div>
                  <p className="text-base font-bold text-gray-900">
                    {deliveryModeLabel}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {batch.deliveryMode === "ONLINE"
                      ? "Interactive live classes hosted online with recorded replays available 24/7."
                      : batch.deliveryMode === "HYBRID"
                      ? "Attend sessions either physically at the institute or join live online from home."
                      : "Physical in-person classes held at the designated institute lecture theater."}
                  </p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-blue-700 font-semibold flex items-center gap-1.5">
                <Check size={14} />
                <span>HD Livestream & Cloud Recordings</span>
              </div>
            </div>

            {/* Timetable Box */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={18} />
                </div>
                <span>Class Timetable</span>
              </div>

              <div>
                {/* Dynamic Schedule Items from Backend */}
                {batch.schedules && batch.schedules.length > 0 ? (
                  <div className="space-y-2 mt-1">
                    {batch.schedules.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-amber-600 shrink-0" />
                          <span className="font-bold text-gray-900">{slot.dayOfWeek}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-800">
                            {slot.timeText || (slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : "Scheduled")}
                          </span>
                          {slot.location && (
                            <span className="block text-[10px] text-gray-500 flex items-center gap-0.5 justify-end">
                              <MapPin size={10} />
                              <span>{slot.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : batch.scheduleList && batch.scheduleList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {batch.scheduleList.map((slot, index) => (
                      <span
                        key={index}
                        className="text-xs font-bold text-gray-800 bg-amber-50/80 px-3 py-1 rounded-xl border border-amber-200/70"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-base font-bold text-gray-900">
                    {batch.schedule || "Schedule announced soon"}
                  </p>
                )}

                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Recurring live lecture hours. Class calendar & reminders will synchronize to your student dashboard upon enrollment.
                </p>
              </div>
            </div>
          </div>

          {/* Included with Enrollment Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={18} className="text-[#2D9F75]" />
                <span>Included with Enrollment</span>
              </h2>
              <span className="text-xs font-medium text-gray-400">
                All-in-one student access
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="p-2 rounded-xl bg-emerald-100/70 text-[#2D9F75] shrink-0 mt-0.5">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {Number(batch.materialsCount || 0) > 0
                      ? `${Number(batch.materialsCount)} Course Materials & Revision Modules`
                      : `Full Syllabus Theory & Revision Modules`}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Curriculum study guides, lecture notes, and revision packs for {batch.subject}.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="p-2 rounded-xl bg-blue-100/70 text-blue-600 shrink-0 mt-0.5">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {batch.schedules && batch.schedules.length > 0
                      ? `${batch.schedules.length} Scheduled Weekly Lecture Slots`
                      : `Live Lectures & Assessments`}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    {batch.schedule && batch.schedule !== "Schedule not set"
                      ? batch.schedule
                      : `Regular timetable slots synchronized with student calendar.`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="p-2 rounded-xl bg-purple-100/70 text-purple-600 shrink-0 mt-0.5">
                  <Video size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {batch.deliveryMode === "ONLINE"
                      ? "100% Online with 24/7 Replay Access"
                      : batch.deliveryMode === "HYBRID"
                      ? "Hybrid Delivery (In-Person + Live Replays)"
                      : "Classroom Lecture Theater Sessions"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    {batch.deliveryMode === "ONLINE"
                      ? "Interactive live streaming with 24/7 video replay recordings."
                      : batch.deliveryMode === "HYBRID"
                      ? "Attend physically at the institute or join online livestream with recorded replays."
                      : "Direct physical classroom learning and seminar discussions."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="p-2 rounded-xl bg-amber-100/70 text-amber-600 shrink-0 mt-0.5">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    Direct Academic Guidance with {batch.teacher}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                    Direct Q&A during lecture sessions, assessments, and continuous exam preparation for {batch.examYear} A/L.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Enrollment Box */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6 bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/90 shadow-lg space-y-6">
            {/* Price Header */}
            <div>
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                Monthly Tuition Fee
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-gray-900">
                  LKR {Number(batch.monthlyFee || 0).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#2D9F75]" />
                <span>Full curriculum & digital materials included</span>
              </p>
            </div>

            {/* Dynamic Status / Enrollment Action Widget */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              {isApproved ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>You are officially enrolled in this class!</span>
                  </div>

                  <Link
                    href={`/classes/${batch.id}`}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Open Classroom</span>
                    <ChevronRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>

                  <button
                    type="button"
                    onClick={handleLeaveClass}
                    disabled={leaving}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {leaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <span>Leaving Class...</span>
                      </>
                    ) : (
                      <>
                        <LogOut size={14} />
                        <span>Leave This Class</span>
                      </>
                    )}
                  </button>
                </div>
              ) : isPending ? (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                      <Clock size={16} className="text-amber-600" />
                      <span>Pending Teacher Approval</span>
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Your enrollment request has been submitted. Once the instructor confirms your seat, this class will become active in your classroom.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelRequest}
                    disabled={cancelling}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {cancelling ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <span>Cancelling Request...</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        <span>Cancel Enrollment Request</span>
                      </>
                    )}
                  </button>
                </div>
              ) : isRejected ? (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 leading-relaxed">
                    Your previous request was declined or expired. You may submit a new request below.
                  </div>

                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Request Enrollment Again</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl text-sm font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>
                          Enroll in Class • LKR {Number(batch.monthlyFee || 0).toLocaleString()}
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-gray-400 leading-normal">
                    No upfront payment required to request. The educator will review and approve your seat.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Class Highlights */}
            <div className="pt-4 border-t border-gray-100 space-y-3 text-xs">
              <p className="font-bold text-gray-400 uppercase tracking-wider">
                Class Summary
              </p>

              <div className="space-y-2 text-gray-600">
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Subject</span>
                  <span className="font-semibold text-gray-900">{batch.subject}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Exam Target</span>
                  <span className="font-semibold text-gray-900">{batch.examYear} A/L</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Delivery Mode</span>
                  <span className="font-semibold text-gray-900">{batch.deliveryMode}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Instructor</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[140px] text-right">
                    {batch.teacher}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-400">Enrolled Students</span>
                  <span className="font-semibold text-emerald-700">
                    {Number(batch.enrolledCount || 0)} Active
                  </span>
                </div>
              </div>
            </div>

            {/* Help / Reassurance */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                <HelpCircle size={14} className="text-[#2D9F75]" />
                <span>Need assistance?</span>
              </div>
              <p className="leading-relaxed">
                Contact your institution administrative office for questions regarding timetable conflicts or fee arrangements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
