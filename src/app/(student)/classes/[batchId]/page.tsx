"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  HelpCircle,
  MapPin,
  Megaphone,
  Play,
  PlayCircle,
  TrendingUp,
  Upload,
  User,
  Video,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getAvailableBatches,
  type AvailableBatch,
} from "@/services/batchService";
import { getMyEnrollmentStatuses } from "@/services/enrollmentService";
import {
  getBatchMaterials,
  getBatchAnnouncements,
  getBatchSchedules,
  type AnnouncementItem,
} from "@/services/studentService";
import {
  assessmentService,
  type AssessmentSummary,
  type QuizSubmissionResult,
} from "@/services/assessmentService";
import { StudentQuizTakingModal } from "@/components/student/StudentQuizTakingModal";
import { StudentEssaySubmissionModal } from "@/components/student/StudentEssaySubmissionModal";
import { QuizResultModal } from "@/components/student/QuizResultModal";
import type { LearningResource } from "@/lib/types/student";
import { getEmbedVideoUrl } from "@/lib/videoUtils";

type ClassroomTab = "recordings" | "schedule" | "assignments" | "announcements" | "results";

interface ClassRecording {
  id: string;
  title: string;
  topic: string;
  date: string;
  duration: string;
  videoUrl: string;
  thumbnailColor: string;
}

interface ClassAssignment {
  id: string;
  title: string;
  dueDate: string;
  totalMarks: number;
  status: "To do" | "Submitted" | "Graded";
  fileUrl?: string;
  score?: number;
  grade?: string;
  type?: string;
  instructions?: string;
  isRealAssessment?: boolean;
  feedback?: string;
}

interface ClassResult {
  examName: string;
  date: string;
  marks: number;
  rank: number;
  grade: string;
  feedback: string;
}

export default function StudentClassDetailsPage() {
  const router = useRouter();
  const params = useParams<{ batchId: string }>();
  const batchId = params?.batchId;

  const [batch, setBatch] = useState<AvailableBatch | null>(null);
  const [activeTab, setActiveTab] = useState<ClassroomTab>("recordings");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Live session video modal state
  const { user } = useAuth();
  const [activeRecording, setActiveRecording] = useState<ClassRecording | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ClassAssignment | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedAsgIds, setSubmittedAsgIds] = useState<Set<string>>(new Set());

  // Dynamic Class Data
  const [materials, setMaterials] = useState<LearningResource[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [batchAssessments, setBatchAssessments] = useState<AssessmentSummary[]>([]);
  const [classResults] = useState<ClassResult[]>([]);

  // Assessment Interaction Modals
  const [activeQuizTakingId, setActiveQuizTakingId] = useState<string | null>(null);
  const [activeEssaySubmissionId, setActiveEssaySubmissionId] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<QuizSubmissionResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClassroom() {
      if (!batchId) return;

      try {
        setLoading(true);
        setError("");

        const [batches, myStatuses, batchMats, batchNotices, batchScheds, batchAsgs] = await Promise.all([
          getAvailableBatches(),
          getMyEnrollmentStatuses(),
          getBatchMaterials(batchId).catch(() => []),
          getBatchAnnouncements(batchId).catch(() => []),
          getBatchSchedules(batchId).catch(() => []),
          assessmentService.getBatchAssessments(batchId, user?.studentId || user?.id).catch(() => []),
        ]);

        const currentBatch = batches.find((b) => b.id === batchId);
        if (!currentBatch) {
          throw new Error("Class not found or you do not have permission to view it.");
        }

        const enrollmentStatus = myStatuses.find((s) => s.batchId === batchId)?.status;
        if (enrollmentStatus && enrollmentStatus !== "APPROVED") {
          throw new Error("Your enrollment in this class is pending teacher approval.");
        }

        if (!cancelled) {
          setBatch({
            ...currentBatch,
            status: enrollmentStatus || currentBatch.status,
          });
          setMaterials(batchMats);
          setAnnouncements(batchNotices);
          setSchedules(batchScheds);
          setBatchAssessments(Array.isArray(batchAsgs) ? batchAsgs : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load classroom details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClassroom();

    return () => {
      cancelled = true;
    };
  }, [batchId, user]);

  // 100% Dynamic Recordings uploaded by the teacher
  const classRecordings: ClassRecording[] = useMemo(() => {
    return materials
      .filter((m) => m.type === "RECORDING" || m.type === "VIDEO")
      .map((m, idx) => ({
        id: m.id || `rec-${idx}`,
        title: m.title,
        topic: m.size || "Lecture Recording",
        date: m.time || "Recently published",
        duration: m.time || "Full Session",
        videoUrl: m.fileUrl || "",
        thumbnailColor:
          idx % 3 === 0
            ? "from-emerald-700 to-teal-900"
            : idx % 3 === 1
            ? "from-blue-700 to-cyan-900"
            : "from-purple-700 to-indigo-900",
      }));
  }, [materials]);

  // 100% Dynamic Lecture Notes & PDF Materials
  const lectureNotes = useMemo(() => {
    return materials.filter(
      (m) =>
        m.type !== "RECORDING" &&
        m.type !== "VIDEO" &&
        m.type !== "ASSIGNMENT" &&
        m.type !== "HOMEWORK"
    );
  }, [materials]);

  // 100% Dynamic Assignments from teacher assessments and uploaded materials
  const classAssignments: ClassAssignment[] = useMemo(() => {
    // 1. Published assessments (MCQ Quizzes & Essay Papers) for this class
    const fromAssessments: ClassAssignment[] = batchAssessments.map((a) => {
      let formattedDue = "Open Submission";
      if (a.dueDate) {
        try {
          formattedDue = new Date(a.dueDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        } catch {
          formattedDue = a.dueDate;
        }
      }
      const isGraded = a.submitted || a.status === "Graded";
      return {
        id: a.id,
        title: a.title,
        dueDate: formattedDue,
        totalMarks: a.totalMarks || 100,
        status: isGraded ? ("Graded" as const) : ("To do" as const),
        fileUrl: a.attachmentUrl || a.paperUploadUrl,
        score: a.scoreObtained != null ? Number(a.scoreObtained) : undefined,
        grade: a.grade,
        type: a.assessmentType === "MCQ_QUIZ" ? "MCQ Quiz" : "Assignment",
        instructions: a.instructions,
        isRealAssessment: true,
        feedback: a.feedback,
      };
    });

    // 2. Plus any uploaded materials flagged as assignments
    const fromMaterials: ClassAssignment[] = materials
      .filter((m) => m.type === "ASSIGNMENT" || m.type === "HOMEWORK")
      .map((m, idx) => {
        const id = m.id || `asg-${idx}`;
        return {
          id,
          title: m.title,
          dueDate: m.time || "Open Submission",
          totalMarks: 100,
          status: submittedAsgIds.has(id) ? ("Submitted" as const) : ("To do" as const),
          fileUrl: m.fileUrl,
          type: "Assignment",
          isRealAssessment: false,
        };
      });

    return [...fromAssessments, ...fromMaterials];
  }, [batchAssessments, materials, submittedAsgIds]);

  const allResults: ClassResult[] = useMemo(() => {
    const fromAsg: ClassResult[] = batchAssessments
      .filter((a) => a.submitted || a.status === "Graded")
      .map((a, idx) => ({
        examName: a.title,
        date: a.dueDate ? new Date(a.dueDate).toLocaleDateString("en-GB") : "Recently",
        marks: a.scoreObtained != null ? Number(a.scoreObtained) : 0,
        rank: idx + 1,
        grade: a.grade || "A",
        feedback: a.feedback || "Evaluated by teacher",
      }));
    return [...fromAsg, ...classResults];
  }, [batchAssessments, classResults]);

  function handleOpenSubmitModal(asg: ClassAssignment) {
    setSelectedAssignment(asg);
    setIsSubmitModalOpen(true);
    setSubmissionSuccess(false);
  }

  function handleCompleteSubmission() {
    if (!selectedAssignment) return;
    setSubmittedAsgIds((prev) => new Set(prev).add(selectedAssignment.id));
    setSubmissionSuccess(true);
    setTimeout(() => {
      setIsSubmitModalOpen(false);
      setSelectedAssignment(null);
      setSubmissionSuccess(false);
    }, 1200);
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-9 h-9 border-3 border-[#2D9F75] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-base font-bold text-gray-800">Entering Classroom...</h3>
        <p className="text-xs text-gray-500 mt-1">
          Loading your recordings, materials, timetable, and assignments.
        </p>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Access Restricted</h3>
        <p className="text-xs text-gray-500 mb-6">
          {error || "We could not load the requested classroom."}
        </p>
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 bg-[#2D9F75] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Return to My Classes</span>
        </Link>
      </div>
    );
  }

  const isOnlineOrHybrid = batch.deliveryMode === "ONLINE" || batch.deliveryMode === "HYBRID";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Back Button & Breadcrumbs */}
      <div>
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          <span>Back to My Classes</span>
        </Link>
      </div>

      {/* Classroom Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F392B] via-[#1B5E43] to-[#2D9F75] text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                {batch.subject}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 backdrop-blur-md text-emerald-200 border border-emerald-300/30 uppercase">
                {batch.deliveryMode || "HYBRID"}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90">
                Exam Year: {batch.examYear}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight text-white leading-tight">
              {batch.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100 font-medium pt-1">
              <div className="flex items-center gap-1.5">
                <User size={16} className="text-emerald-300" />
                <span>Instructor: <strong>{batch.teacher}</strong></span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-emerald-300" />
                <span>{batch.schedule || "Regular schedule announced by teacher"}</span>
              </div>
            </div>
          </div>

          {/* Quick Join Zoom / Live Meeting Action */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            {isOnlineOrHybrid ? (
              <>
                <a
                  href="https://zoom.us/join"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 bg-white hover:bg-emerald-50 text-[#0F392B] font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all hover:scale-[1.02]"
                >
                  <Video size={20} className="text-blue-600" />
                  <span>Join Live Zoom Class</span>
                  <ExternalLink size={14} className="text-gray-400" />
                </a>

                <div className="text-[11px] text-emerald-200/90 text-center">
                  Online Class Session • Access for Enrolled Students
                </div>
              </>
            ) : (
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center text-xs space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-white font-bold">
                  <MapPin size={16} className="text-emerald-300" />
                  <span>Physical In-Person Batch</span>
                </div>
                <p className="text-[11px] text-emerald-100/80">Attendance marked on-site</p>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Classroom Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("recordings")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "recordings"
              ? "bg-[#2D9F75] text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <PlayCircle size={16} />
          <span>Recordings & Notes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "schedule"
              ? "bg-[#2D9F75] text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Calendar size={16} />
          <span>Class Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "assignments"
              ? "bg-[#2D9F75] text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <FileText size={16} />
          <span>Assignments</span>
          {classAssignments.filter((a) => a.status === "To do").length > 0 && (
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-800 text-white font-medium">
              {classAssignments.filter((a) => a.status === "To do").length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "announcements"
              ? "bg-[#2D9F75] text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Megaphone size={16} />
          <span>Announcements</span>
          {announcements.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-800 text-white font-medium">
              {announcements.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "results"
              ? "bg-[#2D9F75] text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <TrendingUp size={16} />
          <span>Marks & Results</span>
        </button>
      </div>

      {/* TAB 1: RECORDINGS & NOTES */}
      {activeTab === "recordings" && (
        <div className="space-y-8">
          {/* Lecture Recordings Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-serif">Class Video Recordings</h3>
                <p className="text-xs text-gray-500">Missed a class? Watch full playback recordings with crystal clear audio.</p>
              </div>
            </div>

            {classRecordings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {classRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div
                      className={`h-40 bg-gradient-to-tr ${rec.thumbnailColor} p-4 flex flex-col justify-between text-white relative`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-black/30 backdrop-blur-sm">
                          {rec.duration}
                        </span>
                        <span className="text-white/90">{rec.date}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveRecording(rec)}
                        className="w-12 h-12 rounded-full bg-white/90 text-gray-900 flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform group-hover:bg-white cursor-pointer"
                        title="Play recording"
                      >
                        <Play size={20} className="fill-current translate-x-0.5" />
                      </button>

                      <p className="text-[11px] font-semibold text-white/80 truncate">
                        {rec.topic}
                      </p>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1 leading-snug">
                          {rec.title}
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">{rec.topic}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveRecording(rec)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#F0FDF4] hover:bg-emerald-100 text-[#2D9F75] border border-[#2D9F75]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play size={14} />
                        <span>Watch Recording</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2D9F75] flex items-center justify-center mx-auto mb-3">
                  <Video size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No recordings uploaded yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Your instructor has not published any lecture recordings for this batch yet. New video playbacks will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Lecture Notes & Materials Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">Lecture Notes & Class PDF Materials</h3>
                <p className="text-xs text-gray-500">Download theory summaries, problem sets, and tutorial guidelines.</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {lectureNotes.length > 0 ? (
                lectureNotes.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/80 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span>{item.subject || batch.subject}</span>
                          <span>•</span>
                          <span>{item.size || "Resource"}</span>
                          <span>•</span>
                          <span>{item.time || "Available"}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={item.fileUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </a>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">No lecture notes uploaded</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Course theory slides and documents uploaded by {batch.teacher} will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE & LIVE SESSIONS */}
      {activeTab === "schedule" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">Class Routine & Timetable</h3>
              <p className="text-xs text-gray-500 mb-6">
                Official timetable for {batch.name}. Please ensure you connect 5 minutes prior to start time.
              </p>

              {schedules.length > 0 ? (
                <div className="space-y-3">
                  {schedules.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#2D9F75] text-white flex flex-col items-center justify-center shrink-0 font-bold text-xs">
                        <span className="text-[10px] uppercase opacity-80">{s.dayOfWeek?.slice(0, 3) || "DAY"}</span>
                        <span>{s.dayOfWeek?.slice(0, 3) || "CLS"}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-gray-900">{s.title || "Weekly Lecture"}</h4>
                          <span className="text-xs font-bold text-[#2D9F75] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {s.mode || batch.deliveryMode || "Scheduled"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          {s.time || `${s.startTime || ""} - ${s.endTime || ""}`} • {s.dayOfWeek || "Weekly Session"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5">
                          Location / Mode: <strong>{s.location || s.mode || batch.deliveryMode}</strong> • Instructor: <strong>{s.teacher || batch.teacher}</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : batch.schedule ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#2D9F75] text-white flex items-center justify-center shrink-0 font-bold text-sm">
                    LIVE
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">Scheduled Lecture Routine</h4>
                      <span className="text-xs font-bold text-[#2D9F75] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Regular
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1 font-semibold">
                      {batch.schedule}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Instructor: <strong>{batch.teacher}</strong> • Delivery: <strong>{batch.deliveryMode}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D9F75] flex items-center justify-center mx-auto mb-2">
                    <Clock size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">No schedule routine published</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Timetable entries for this class will appear once published by {batch.teacher}.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Video size={16} className="text-[#2D9F75]" />
                <span>Class Access Details</span>
              </h3>

              {isOnlineOrHybrid ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Platform</span>
                    <span className="font-semibold text-gray-800">Zoom Cloud Meetings</span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Delivery Mode</span>
                    <span className="font-semibold text-gray-800">{batch.deliveryMode}</span>
                  </div>

                  <a
                    href="https://zoom.us/join"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#2D9F75] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs mt-2"
                  >
                    <Video size={16} />
                    <span>Launch Live Meeting</span>
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-gray-800">
                    <MapPin size={16} className="text-[#2D9F75]" />
                    <span>Physical On-Campus Batch</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Classes for this batch are conducted on campus. Please bring your student admission barcode/card to enter the lecture hall.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900 font-serif">Class Assignments</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {batch.name}
                </span>
              </div>
              <p className="text-xs text-gray-500">Submit your solved problem sheets, attempt quizzes, and view instructor feedback.</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {classAssignments.length > 0 ? (
              classAssignments.map((asg) => {
                const isGraded = asg.status === "Graded";
                const isSubmitted = asg.status === "Submitted";
                const isQuiz = asg.type === "MCQ Quiz";

                return (
                  <div key={asg.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{asg.title}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {asg.type || "Assignment"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isGraded
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isSubmitted
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {asg.status}
                        </span>
                        {isGraded && asg.grade && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Grade: {asg.grade} {asg.score != null ? `(${asg.score}/${asg.totalMarks})` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Due: {asg.dueDate} • Total Marks: {asg.totalMarks}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {asg.fileUrl && (
                        <a
                          href={asg.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download size={13} />
                          <span>Paper</span>
                        </a>
                      )}

                      {asg.isRealAssessment ? (
                        isQuiz ? (
                          isGraded ? (
                            <button
                              type="button"
                              onClick={() => {
                                assessmentService.getStudentSubmission(asg.id, user?.studentId || user?.id)
                                  .then(setActiveResult)
                                  .catch(() => alert("Could not load submission result"));
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span>View Result</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveQuizTakingId(asg.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D9F75] hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                            >
                              <Play size={13} />
                              <span>Start Quiz</span>
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveEssaySubmissionId(asg.id)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer ${
                              isGraded
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                                : "bg-[#2D9F75] hover:bg-emerald-700 text-white"
                            }`}
                          >
                            <FileText size={14} />
                            <span>{isGraded ? "View Feedback" : isSubmitted ? "View Submission" : "Open Paper & Submit"}</span>
                          </button>
                        )
                      ) : (
                        isSubmitted ? (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            Pending Teacher Review
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSubmitModal(asg)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D9F75] hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                          >
                            <Upload size={14} />
                            <span>Submit Solution</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <FileText size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No assignments active</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  There are currently no homework problems or assignments assigned for this class.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === "announcements" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">Class Notices & Announcements</h3>
          <p className="text-xs text-gray-500 mb-4">Official updates and alerts broadcast for {batch.name}.</p>

          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((ann, idx) => (
                <div
                  key={ann.id || idx}
                  className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ann.type === "URGENT"
                            ? "bg-red-100 text-red-700"
                            : ann.type === "HOMEWORK"
                            ? "bg-blue-100 text-blue-700"
                            : ann.type === "EXAM"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {ann.type || "NOTICE"}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">{ann.title}</h4>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">{ann.time || "Recently"}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed mt-2 whitespace-pre-wrap">
                    {ann.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2D9F75] flex items-center justify-center mx-auto mb-3">
                  <Megaphone size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">No announcements posted</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Official class reminders and broadcast notices from your instructor will be displayed here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: MARKS & RESULTS */}
      {activeTab === "results" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">Assessment Performance</h3>
          <p className="text-xs text-gray-500 mb-4">Your evaluated papers and term test scores for {batch.name}.</p>

          {allResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-3">Examination / Test</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-center">Score</th>
                    <th className="py-3 px-3 text-center">Batch Rank</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3">Instructor Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {allResults.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-3 font-bold text-gray-900">{r.examName}</td>
                      <td className="py-4 px-3 text-gray-500">{r.date}</td>
                      <td className="py-4 px-3 text-center font-bold text-emerald-600">{r.marks}/100</td>
                      <td className="py-4 px-3 text-center font-semibold">#{r.rank}</td>
                      <td className="py-4 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-gray-600 italic">{r.feedback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <GraduationCap size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">No assessment results released yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Scores, rank analysis, and instructor remarks will appear here after term tests or homework assignments are evaluated.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Video Playback Modal */}
      {activeRecording && (() => {
        const videoInfo = getEmbedVideoUrl(activeRecording.videoUrl);
        const isYouTube = videoInfo.originalUrl.includes("youtube.com") || videoInfo.originalUrl.includes("youtu.be");

        return (
          <div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveRecording(null);
              }
            }}
          >
            <div className="bg-gray-950 rounded-2xl max-w-4xl w-full overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
              <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <PlayCircle size={20} className="text-[#2D9F75]" />
                  <div>
                    <h4 className="text-sm font-bold truncate max-w-md">{activeRecording.title}</h4>
                    <p className="text-[11px] text-gray-400">{activeRecording.topic} • {activeRecording.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {videoInfo.originalUrl && (
                    <a
                      href={videoInfo.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Open original video source"
                    >
                      <span>{isYouTube ? "Open in YouTube" : "Open Video Link"}</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveRecording(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="aspect-video w-full bg-black flex items-center justify-center relative">
                {videoInfo.embedUrl ? (
                  videoInfo.isDirectVideo ? (
                    <video
                      src={videoInfo.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={videoInfo.embedUrl}
                      title={activeRecording.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )
                ) : (
                  <div className="text-center p-8 text-gray-400">
                    <AlertCircle size={36} className="mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm font-bold text-gray-200">Recording Link Unavailable</p>
                    <p className="text-xs text-gray-400 mt-1">
                      No playable video link was found for this class recording.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-900 text-gray-300 text-xs flex items-center justify-between border-t border-gray-800">
                <span>Recorded on: <strong>{activeRecording.date}</strong></span>
                <button
                  type="button"
                  onClick={() => setActiveRecording(null)}
                  className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors cursor-pointer"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Assignment Submit Modal */}
      {isSubmitModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-gray-900">Submit Assignment</h4>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Upload your solution file for <strong>{selectedAssignment.title}</strong>.
            </p>

            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors mb-4 bg-gray-50/50">
              <Upload size={24} className="text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">Drag & drop your file here, or click to browse</p>
              <p className="text-[10px] text-gray-400 mt-1">PDF, DOCX, or Image (Max 25MB)</p>
            </div>

            {submissionSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-bold justify-center">
                <CheckCircle2 size={16} />
                <span>Assignment Submitted Successfully!</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSubmission}
                  className="px-5 py-2 text-xs font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Confirm & Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Quiz Taking Studio Modal */}
      {activeQuizTakingId && (
        <StudentQuizTakingModal
          assessmentId={activeQuizTakingId}
          studentId={user?.studentId || user?.id}
          onClose={() => setActiveQuizTakingId(null)}
          onSubmitSuccess={(result) => {
            setActiveQuizTakingId(null);
            setActiveResult(result);
            if (batchId) {
              assessmentService.getBatchAssessments(batchId, user?.studentId || user?.id)
                .then((data) => setBatchAssessments(Array.isArray(data) ? data : []))
                .catch(console.warn);
            }
          }}
        />
      )}

      {/* Student Essay / Paper Assignment Modal */}
      {activeEssaySubmissionId && (
        <StudentEssaySubmissionModal
          assessmentId={activeEssaySubmissionId}
          studentId={user?.studentId || user?.id}
          onClose={() => setActiveEssaySubmissionId(null)}
          onSubmitSuccess={() => {
            setActiveEssaySubmissionId(null);
            if (batchId) {
              assessmentService.getBatchAssessments(batchId, user?.studentId || user?.id)
                .then((data) => setBatchAssessments(Array.isArray(data) ? data : []))
                .catch(console.warn);
            }
          }}
        />
      )}

      {/* Student Quiz / Assessment Result Review Modal */}
      {activeResult && (
        <QuizResultModal
          result={activeResult}
          onClose={() => setActiveResult(null)}
        />
      )}
    </div>
  );
}
