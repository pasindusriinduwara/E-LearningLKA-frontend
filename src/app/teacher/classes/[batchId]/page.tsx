"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Megaphone,
  Monitor,
  Play,
  PlayCircle,
  Plus,
  Trash2,
  Upload,
  Users,
  Video,
  Wallet,
  X,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";

import {
  approveEnrollment,
  getBatchEnrollments,
  getTeacherBatches,
  rejectEnrollment,
  getBatchMaterials,
  createTeacherMaterial,
  uploadTeacherMaterial,
  deleteTeacherMaterial,
  getBatchAnnouncements,
  createTeacherAnnouncement,
  deleteTeacherAnnouncement,
  type BatchEnrollment,
  type TeacherBatch,
  type TeacherMaterial,
  type TeacherAnnouncement,
} from "@/services/teacherService";

import {
  getSubjects,
  type SubjectOption,
} from "@/services/subjectService";

import { ConfirmModal } from "@/components/common/ConfirmModal";
import { getEmbedVideoUrl } from "@/lib/videoUtils";

type ActiveTab = "students" | "recordings" | "materials" | "announcements" | "zoom";

export default function BatchDetailsPage() {
  const router = useRouter();
  const params = useParams<{ batchId: string }>();
  const batchId = params.batchId;

  const [batch, setBatch] = useState<TeacherBatch | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [enrollments, setEnrollments] = useState<BatchEnrollment[]>([]);
  const [materials, setMaterials] = useState<TeacherMaterial[]>([]);
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("students");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal states
  const [isAddRecordingOpen, setIsAddRecordingOpen] = useState(false);
  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState("");

  // Delete confirmation modal
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "material" | "announcement";
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states: Recording
  const [recTitle, setRecTitle] = useState("");
  const [recUrl, setRecUrl] = useState("");
  const [recTopic, setRecTopic] = useState("");
  const [recDuration, setRecDuration] = useState("");
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);

  // Form states: Material
  const [matTitle, setMatTitle] = useState("");
  const [matType, setMatType] = useState<"PDF" | "DOCUMENT" | "LINK">("PDF");
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matUrl, setMatUrl] = useState("");
  const [isSubmittingMat, setIsSubmittingMat] = useState(false);

  // Form states: Announcement
  const [annTitle, setAnnTitle] = useState("");
  const [annDesc, setAnnDesc] = useState("");
  const [annType, setAnnType] = useState("CLASS_UPDATE");
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

  const subjectName = useMemo(() => {
    if (!batch) return "Unknown subject";
    return (
      subjects.find((subject) => subject.id === batch.subjectId)?.name ?? "Unknown subject"
    );
  }, [batch, subjects]);

  const enrolledStudents = useMemo(
    () => enrollments.filter((item) => item.status === "APPROVED"),
    [enrollments]
  );

  const pendingRequests = useMemo(
    () => enrollments.filter((item) => item.status === "PENDING"),
    [enrollments]
  );

  const recordings = useMemo(
    () => materials.filter((m) => m.type === "RECORDING" || m.type === "VIDEO"),
    [materials]
  );

  const regularMaterials = useMemo(
    () => materials.filter((m) => m.type !== "RECORDING" && m.type !== "VIDEO"),
    [materials]
  );

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      const [batchList, subjectList, enrollmentList, materialsList, announcementsList] =
        await Promise.all([
          getTeacherBatches(),
          getSubjects(),
          getBatchEnrollments(batchId),
          getBatchMaterials(batchId).catch(() => []),
          getBatchAnnouncements(batchId).catch(() => []),
        ]);

      const selected = batchList.find((item) => item.id === batchId);
      if (!selected) {
        throw new Error("Batch not found or you do not have permission.");
      }

      setBatch(selected);
      setSubjects(subjectList);
      setEnrollments(enrollmentList);
      setMaterials(materialsList);
      setAnnouncements(announcementsList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load batch details"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (batchId) {
      loadPage();
    }
  }, [batchId]);

  function showBanner(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3500);
  }

  // Handle Enrollment actions
  async function handleApprove(requestId: string) {
    setActionId(requestId);
    setError("");
    try {
      await approveEnrollment(requestId);
      showBanner("Student enrollment approved successfully.");
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(requestId: string) {
    setActionId(requestId);
    setError("");
    try {
      await rejectEnrollment(requestId);
      showBanner("Student enrollment rejected.");
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setActionId(null);
    }
  }

  // Handle Add Recording
  async function handleCreateRecording(e: React.FormEvent) {
    e.preventDefault();
    if (!recTitle.trim() || !recUrl.trim()) return;

    try {
      setIsSubmittingRec(true);
      setError("");
      await createTeacherMaterial({
        batchId,
        title: recTitle.trim(),
        subject: subjectName,
        type: "RECORDING",
        time: recDuration.trim() || "1h 30m",
        size: recTopic.trim() || "Lecture Recording",
        fileUrl: recUrl.trim(),
      });
      showBanner("Class recording published successfully!");
      setIsAddRecordingOpen(false);
      setRecTitle("");
      setRecUrl("");
      setRecTopic("");
      setRecDuration("");
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add recording");
    } finally {
      setIsSubmittingRec(false);
    }
  }

  // Handle Upload Material
  async function handleUploadMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!matTitle.trim()) return;

    try {
      setIsSubmittingMat(true);
      setError("");

      if (matFile) {
        await uploadTeacherMaterial({
          batchId,
          title: matTitle.trim(),
          subject: subjectName,
          file: matFile,
        });
      } else if (matUrl.trim()) {
        await createTeacherMaterial({
          batchId,
          title: matTitle.trim(),
          subject: subjectName,
          type: matType,
          size: "Online Resource",
          time: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          fileUrl: matUrl.trim(),
        });
      } else {
        throw new Error("Please select a file or provide a resource link.");
      }

      showBanner("Material uploaded successfully!");
      setIsUploadMaterialOpen(false);
      setMatTitle("");
      setMatFile(null);
      setMatUrl("");
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload material");
    } finally {
      setIsSubmittingMat(false);
    }
  }

  // Handle Create Announcement
  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitle.trim() || !annDesc.trim()) return;

    try {
      setIsSubmittingAnn(true);
      setError("");
      await createTeacherAnnouncement({
        batchId,
        title: annTitle.trim(),
        description: annDesc.trim(),
        type: annType,
        time: "Just now",
      });
      showBanner("Announcement broadcast to students!");
      setIsCreateAnnouncementOpen(false);
      setAnnTitle("");
      setAnnDesc("");
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post announcement");
    } finally {
      setIsSubmittingAnn(false);
    }
  }

  // Handle Delete Confirmation
  async function handleConfirmDelete() {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      if (itemToDelete.type === "material") {
        await deleteTeacherMaterial(itemToDelete.id);
        showBanner("Material deleted successfully.");
      } else {
        await deleteTeacherAnnouncement(itemToDelete.id);
        showBanner("Announcement removed.");
      }
      setItemToDelete(null);
      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#2D9F75] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-500">Loading batch details...</p>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 my-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-semibold"
        >
          <ArrowLeft size={17} />
          <span>Back</span>
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!batch) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
        <Link href="/teacher/dashboard" className="hover:text-gray-800 transition-colors">
          Teacher portal
        </Link>
        <span>/</span>
        <Link href="/teacher/classes" className="hover:text-gray-800 transition-colors">
          My classes
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{batch.name}</span>
      </div>

      <div>
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to classes</span>
        </Link>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <Check size={18} className="text-[#2D9F75]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest font-bold text-[#2D9F75]">
                {subjectName}
              </span>
              <span>•</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  batch.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600"
                }`}
              >
                {batch.active ? "Active Batch" : "Inactive"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 font-serif leading-tight">
              {batch.name}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://zoom.us/start/videomeeting"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#2D9F75] hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
            >
              <Video size={18} />
              <span>Start Live Class</span>
              <ExternalLink size={14} className="opacity-70" />
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
          <InfoItem icon={<Clock3 size={18} />} label="Exam Year" value={batch.examYear} />
          <InfoItem icon={<Wallet size={18} />} label="Monthly Fee" value={`LKR ${batch.monthlyFee}`} />
          <InfoItem icon={<Monitor size={18} />} label="Delivery Mode" value={batch.deliveryMode || "HYBRID"} />
        </div>
      </section>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Users size={20} />}
          label="Enrolled Students"
          value={enrolledStudents.length}
          color="emerald"
        />
        <SummaryCard
          icon={<Clock3 size={20} />}
          label="Pending Requests"
          value={pendingRequests.length}
          color="amber"
        />
        <SummaryCard
          icon={<PlayCircle size={20} />}
          label="Recordings"
          value={recordings.length}
          color="blue"
        />
        <SummaryCard
          icon={<Megaphone size={20} />}
          label="Announcements"
          value={announcements.length}
          color="purple"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Tabbed Management Container */}
      <section className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 px-6 pt-5 overflow-x-auto scrollbar-none">
          <div className="flex gap-6 min-w-max">
            <TabButton active={activeTab === "students"} onClick={() => setActiveTab("students")}>
              <Users size={16} />
              <span>Students & Requests</span>
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  {pendingRequests.length}
                </span>
              )}
            </TabButton>

            <TabButton active={activeTab === "recordings"} onClick={() => setActiveTab("recordings")}>
              <PlayCircle size={16} />
              <span>Class Recordings</span>
              <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                {recordings.length}
              </span>
            </TabButton>

            <TabButton active={activeTab === "materials"} onClick={() => setActiveTab("materials")}>
              <FileText size={16} />
              <span>Notes & Materials</span>
              <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                {regularMaterials.length}
              </span>
            </TabButton>

            <TabButton active={activeTab === "announcements"} onClick={() => setActiveTab("announcements")}>
              <Megaphone size={16} />
              <span>Announcements</span>
              <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                {announcements.length}
              </span>
            </TabButton>

            <TabButton active={activeTab === "zoom"} onClick={() => setActiveTab("zoom")}>
              <Video size={16} />
              <span>Live Zoom Setup</span>
            </TabButton>
          </div>
        </div>

        <div className="p-6">
          {/* TAB 1: STUDENTS & REQUESTS */}
          {activeTab === "students" && (
            <div className="space-y-6">
              {/* Pending Requests Section */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Action Required: Enrollment Requests ({pendingRequests.length})</span>
                  </h3>

                  <div className="divide-y divide-gray-100 border border-amber-200 rounded-2xl bg-amber-50/30 overflow-hidden">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 hover:bg-amber-50/70 transition-colors"
                      >
                        <StudentRow student={request} status="PENDING" />

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={actionId === request.requestId}
                            onClick={() => handleReject(request.requestId)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            <X size={15} />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionId === request.requestId}
                            onClick={() => handleApprove(request.requestId)}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#2D9F75] hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-colors"
                          >
                            <Check size={15} />
                            <span>Approve Student</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enrolled Students List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 font-serif">
                    Enrolled Students ({enrolledStudents.length})
                  </h3>
                </div>

                {enrolledStudents.length === 0 ? (
                  <EmptyState text="No students currently enrolled in this batch." />
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                    {enrolledStudents.map((student) => (
                      <div
                        key={student.requestId}
                        className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <StudentRow student={student} status="APPROVED" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CLASS RECORDINGS */}
          {activeTab === "recordings" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-serif">Class Video Recordings</h3>
                  <p className="text-xs text-gray-500">
                    Upload Zoom recordings, YouTube unlisted lecture links, or Drive URLs for your students.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddRecordingOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#2D9F75] hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all shrink-0"
                >
                  <Plus size={16} />
                  <span>Publish New Recording</span>
                </button>
              </div>

              {recordings.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl p-8">
                  <PlayCircle size={36} className="text-gray-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-gray-800">No recordings published yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Add your class recordings so students who missed the lecture or need revision can watch anytime.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddRecordingOpen(true)}
                    className="inline-flex items-center gap-2 bg-[#2D9F75] text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    <Plus size={14} />
                    <span>Add First Recording</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recordings.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="h-36 bg-gradient-to-tr from-emerald-700 to-teal-900 p-4 flex flex-col justify-between text-white relative">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                            {rec.time || "Recording"}
                          </span>
                          <span className="text-white/80 text-[11px]">{rec.size || "Lecture Video"}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPreviewVideoUrl(rec.fileUrl || null);
                            setPreviewVideoTitle(rec.title);
                          }}
                          className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-gray-900 flex items-center justify-center mx-auto shadow-lg transition-transform hover:scale-110"
                        >
                          <Play size={20} className="fill-current translate-x-0.5 text-emerald-800" />
                        </button>

                        <span className="text-[11px] text-white/75 truncate">{batch.name}</span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1 leading-snug line-clamp-2">
                            {rec.title}
                          </h4>
                          <p className="text-xs text-gray-400 mb-4">{rec.subject || subjectName}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewVideoUrl(rec.fileUrl || null);
                              setPreviewVideoTitle(rec.title);
                            }}
                            className="text-xs font-bold text-[#2D9F75] hover:underline flex items-center gap-1"
                          >
                            <Play size={12} />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setItemToDelete({
                                id: rec.id,
                                type: "material",
                                title: rec.title,
                              })
                            }
                            title="Delete recording"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTES & MATERIALS */}
          {activeTab === "materials" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-serif">Lecture Notes & Documents</h3>
                  <p className="text-xs text-gray-500">
                    Upload tutorial sheets, lesson summaries, and revision guides.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUploadMaterialOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#2D9F75] hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all shrink-0"
                >
                  <Upload size={16} />
                  <span>Upload Document</span>
                </button>
              </div>

              {regularMaterials.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl p-8">
                  <FileText size={36} className="text-gray-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-gray-800">No documents uploaded yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Upload PDF lecture notes or link external study guides for your students in this batch.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUploadMaterialOpen(true)}
                    className="inline-flex items-center gap-2 bg-[#2D9F75] text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    <Upload size={14} />
                    <span>Upload Document</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl bg-white overflow-hidden">
                  {regularMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D9F75] flex items-center justify-center shrink-0">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{mat.title}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {mat.type || "PDF"} • {mat.size || "Document"} • {mat.time || "Added recently"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {mat.fileUrl && (
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="Download/Open"
                          >
                            <Download size={16} />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setItemToDelete({
                              id: mat.id,
                              type: "material",
                              title: mat.title,
                            })
                          }
                          title="Delete material"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-serif">Batch Announcements</h3>
                  <p className="text-xs text-gray-500">
                    Broadcast urgent updates, homework reminders, and exam schedules to students in this class.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateAnnouncementOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#2D9F75] hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all shrink-0"
                >
                  <Plus size={16} />
                  <span>Post Announcement</span>
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl p-8">
                  <Megaphone size={36} className="text-gray-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-gray-800">No announcements posted</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                    Send an announcement to keep students notified about upcoming papers or changes in schedule.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateAnnouncementOpen(true)}
                    className="inline-flex items-center gap-2 bg-[#2D9F75] text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    <Plus size={14} />
                    <span>Post First Announcement</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              ann.type === "URGENT"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : ann.type === "HOMEWORK"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : ann.type === "EXAM"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {ann.type || "NOTICE"}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">{ann.title}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">{ann.time || "Recently"}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setItemToDelete({
                                id: ann.id,
                                type: "announcement",
                                title: ann.title,
                              })
                            }
                            className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete announcement"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {ann.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ZOOM & LIVE CLASS SETUP */}
          {activeTab === "zoom" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">Zoom & Live Class Settings</h3>
                <p className="text-xs text-gray-500">
                  Configure live meeting details displayed to students on their classroom portal.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Meeting Platform</label>
                  <input
                    type="text"
                    readOnly
                    value="Zoom Cloud Meetings"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Meeting ID</label>
                  <input
                    type="text"
                    readOnly
                    value="812 4492 0192"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Meeting Passcode</label>
                  <input
                    type="text"
                    readOnly
                    value="LK2026"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <a
                    href="https://zoom.us/start/videomeeting"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-[#2D9F75] hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm"
                  >
                    <Video size={16} />
                    <span>Launch Host Meeting</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MODAL 1: ADD RECORDING */}
      {isAddRecordingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-gray-900 font-serif">Publish Class Recording</h4>
              <button
                type="button"
                onClick={() => setIsAddRecordingOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecording} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Lecture Title *</label>
                <input
                  type="text"
                  required
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="e.g. Lecture 09: Complex Numbers Full Review"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Video / Cloud Recording URL *</label>
                <input
                  type="url"
                  required
                  value={recUrl}
                  onChange={(e) => setRecUrl(e.target.value)}
                  placeholder="https://zoom.us/rec/... or https://youtube.com/..."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={recTopic}
                    onChange={(e) => setRecTopic(e.target.value)}
                    placeholder="e.g. Advanced Calculus"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={recDuration}
                    onChange={(e) => setRecDuration(e.target.value)}
                    placeholder="e.g. 2h 15m"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddRecordingOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRec}
                  className="px-5 py-2 text-xs font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingRec ? "Publishing..." : "Publish Recording"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD MATERIAL */}
      {isUploadMaterialOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-gray-900 font-serif">Upload Lecture Note or Material</h4>
              <button
                type="button"
                onClick={() => setIsUploadMaterialOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="e.g. Unit 04 Revision Theory Notes"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">File or Cloud Document</label>
                <input
                  type="file"
                  onChange={(e) => setMatFile(e.target.files?.[0] || null)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">OR provide an external URL below</span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">External Link (Google Drive / Cloud)</label>
                <input
                  type="url"
                  value={matUrl}
                  onChange={(e) => setMatUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUploadMaterialOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMat}
                  className="px-5 py-2 text-xs font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingMat ? "Uploading..." : "Upload Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE ANNOUNCEMENT */}
      {isCreateAnnouncementOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-gray-900 font-serif">Broadcast Announcement</h4>
              <button
                type="button"
                onClick={() => setIsCreateAnnouncementOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Schedule Rescheduling Reminder"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Announcement Category</label>
                <select
                  value={annType}
                  onChange={(e) => setAnnType(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none"
                >
                  <option value="CLASS_UPDATE">General Class Update</option>
                  <option value="URGENT">Urgent Notice</option>
                  <option value="HOMEWORK">Homework / Assignment</option>
                  <option value="EXAM">Examination Notice</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Message Content *</label>
                <textarea
                  required
                  rows={4}
                  value={annDesc}
                  onChange={(e) => setAnnDesc(e.target.value)}
                  placeholder="Write clear instructions or information for your enrolled students..."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateAnnouncementOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAnn}
                  className="px-5 py-2 text-xs font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingAnn ? "Posting..." : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VIDEO PREVIEW */}
      {previewVideoUrl && (() => {
        const videoInfo = getEmbedVideoUrl(previewVideoUrl);
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-950 rounded-2xl max-w-3xl w-full overflow-hidden border border-gray-800 shadow-2xl">
              <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <PlayCircle size={18} className="text-[#2D9F75]" />
                  <h4 className="text-sm font-bold truncate max-w-md">{previewVideoTitle || "Video Preview"}</h4>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={videoInfo.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Open original link"
                  >
                    <span>Open in YouTube</span>
                    <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(null)}
                    className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="aspect-video w-full bg-black flex items-center justify-center">
                {videoInfo.isDirectVideo ? (
                  <video
                    src={videoInfo.embedUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={videoInfo.embedUrl}
                    title={previewVideoTitle}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>

              <div className="p-3 bg-gray-900 text-right">
                <button
                  type="button"
                  onClick={() => setPreviewVideoUrl(null)}
                  className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION MODAL FOR DELETES */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title={itemToDelete?.type === "material" ? "Delete Material?" : "Delete Announcement?"}
        description={`Are you sure you want to delete "${itemToDelete?.title}"? It will no longer be visible to students.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-gray-50/70 p-4 border border-gray-100">
      <div className="flex items-center gap-2 text-[#2D9F75]">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
          {label}
        </span>
      </div>
      <p className="mt-2 font-bold text-gray-900 text-sm">{value}</p>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "emerald" | "amber" | "blue" | "purple";
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 pb-3.5 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
        active
          ? "border-[#2D9F75] text-[#2D9F75]"
          : "border-transparent text-gray-400 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function StudentRow({
  student,
  status,
}: {
  student: BatchEnrollment;
  status: "APPROVED" | "PENDING";
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-bold text-[#2D9F75] shrink-0">
        {student.studentName ? student.studentName.charAt(0).toUpperCase() : "S"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{student.studentName}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>ID: {student.studentNumber}</span>
          <span>•</span>
          <span>Requested: {new Date(student.requestedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <span
        className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
          status === "APPROVED"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-xs sm:text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
      {text}
    </div>
  );
}