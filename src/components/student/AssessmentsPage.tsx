"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ClipboardCheck,
  Clock3,
  CheckCircle2,
  PlayCircle,
  FileText,
  Search,
  ChevronRight,
  X,
  Award,
  HelpCircle,
  FileCheck,
  Send,
  Timer,
  Loader2,
  BookOpen,
  Calendar,
  GraduationCap,
  Trophy,
} from "lucide-react";
import {
  assessmentService,
  AssessmentSummary,
  QuizSubmissionResult,
} from "@/services/assessmentService";
import { useAuth } from "@/context/AuthContext";
import { StudentQuizTakingModal } from "./StudentQuizTakingModal";
import { QuizResultModal } from "./QuizResultModal";
import { StudentEssaySubmissionModal } from "./StudentEssaySubmissionModal";

export type AssessmentStatus = "To do" | "In progress" | "Graded";

export interface QuestionItem {
  id: number;
  question: string;
  options: string[];
  selectedOption?: number;
}

export interface AssessmentItem {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  type: string;
  questionsCount: number;
  duration: string;
  dueDate: string;
  status: AssessmentStatus;
  progress: number;
  totalMarks: number;
  score?: number;
  grade?: string;
  feedback?: string;
  questions?: QuestionItem[];
}

function getGradeBadgeStyle(grade?: string) {
  switch (grade) {
    case "A+":
    case "A":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "B":
    case "C":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
    case "S":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    case "F":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

function getSubjectBadge(subjectCode: string, subjectName: string) {
  if (subjectCode === "math") {
    return {
      bg: "bg-blue-50/90 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
      dot: "bg-blue-600",
    };
  }
  if (subjectCode === "chem") {
    return {
      bg: "bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
      dot: "bg-emerald-600",
    };
  }
  return {
    bg: "bg-purple-50/90 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
    dot: "bg-purple-600",
  };
}

export function AssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");

  // Quiz Taking Modal State
  const [activeQuizTakingId, setActiveQuizTakingId] = useState<string | null>(null);

  // Essay / Paper Submission Modal State
  const [activeEssaySubmissionId, setActiveEssaySubmissionId] = useState<string | null>(null);

  // Result View Modal State
  const [activeResult, setActiveResult] = useState<QuizSubmissionResult | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const loadAssessments = () => {
    setIsLoading(true);
    assessmentService
      .getStudentAssessments(user?.studentId || user?.id)
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: AssessmentItem[] = data.map((a: AssessmentSummary) => {
            let subj = "Combined Mathematics";
            let code = "math";
            const bName = (a.batchName || "").toLowerCase();
            if (bName.includes("chem")) {
              subj = "Chemistry";
              code = "chem";
            } else if (bName.includes("phys")) {
              subj = "Physics";
              code = "phys";
            }

            let formattedDue = "Open";
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
              subject: subj,
              subjectCode: code,
              teacher: a.batchName || "Instructor",
              type: a.assessmentType === "MCQ_QUIZ" ? "MCQ Quiz" : "Assignment",
              questionsCount: a.questionCount || 0,
              duration: `${a.durationMinutes || 60} mins`,
              dueDate: formattedDue,
              status: isGraded ? "Graded" : "To do",
              progress: isGraded ? 100 : 0,
              totalMarks: a.totalMarks || 100,
              score: a.scoreObtained != null ? Number(a.scoreObtained) : undefined,
              grade: a.grade,
            };
          });
          setAssessments(mapped);
        }
      })
      .catch((err) => {
        console.warn("Failed to load assessments from database:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadAssessments();
  }, [user]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "To do" && item.status === "To do") ||
        (selectedStatus === "In progress" && item.status === "In progress") ||
        (selectedStatus === "Graded" && item.status === "Graded");

      const matchesSubject =
        selectedSubject === "All" || item.subject === selectedSubject;

      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [assessments, searchQuery, selectedStatus, selectedSubject]);

  const stats = useMemo(() => {
    const todo = assessments.filter((a) => a.status === "To do").length;
    const inProgress = assessments.filter((a) => a.status === "In progress").length;
    const graded = assessments.filter((a) => a.status === "Graded").length;
    const total = assessments.length;
    return { todo, inProgress, graded, total };
  }, [assessments]);

  async function handleViewResult(assessmentId: string, itemType?: string) {
    if (itemType === "Assignment" || itemType === "Essay") {
      setActiveEssaySubmissionId(assessmentId);
      return;
    }
    setIsLoadingResult(true);
    try {
      const res = await assessmentService.getStudentSubmission(
        assessmentId,
        user?.studentId || user?.id
      );
      setActiveResult(res);
    } catch (err) {
      console.error("Could not fetch submission review:", err);
      setActiveEssaySubmissionId(assessmentId);
    } finally {
      setIsLoadingResult(false);
    }
  }

  function handleQuizFinished(result: QuizSubmissionResult) {
    setActiveQuizTakingId(null);
    setActiveResult(result);
    // Reload assessments to refresh statuses and counts from live database
    loadAssessments();
  }

  return (
    <div className="assessments-page-wrapper">
      <header className="assessments-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="assessments-eyebrow mb-0">ACADEMIC EVALUATIONS</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Enrolled Classes Only
            </span>
          </div>
          <h1 className="assessments-title">Assessments</h1>
        </div>
        <div className="assessments-new-badge">
          <span>{stats.todo} pending submission</span>
        </div>
      </header>

      {/* Stats Counter Bar */}
      <div className="assessments-stats-grid">
        <button
          type="button"
          className={`assessment-stat-card ${selectedStatus === "To do" ? "assessment-stat-active" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "To do" ? "All" : "To do")}
        >
          <div className="asm-stat-icon asm-stat-yellow">
            <Clock3 size={22} />
          </div>
          <div className="asm-stat-info">
            <strong className="asm-stat-number">{String(stats.todo).padStart(2, "0")}</strong>
            <span className="asm-stat-label">To do</span>
          </div>
        </button>

        <button
          type="button"
          className={`assessment-stat-card ${selectedStatus === "In progress" ? "assessment-stat-active" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "In progress" ? "All" : "In progress")}
        >
          <div className="asm-stat-icon asm-stat-blue">
            <PlayCircle size={22} />
          </div>
          <div className="asm-stat-info">
            <strong className="asm-stat-number">{String(stats.inProgress).padStart(2, "0")}</strong>
            <span className="asm-stat-label">In progress</span>
          </div>
        </button>

        <button
          type="button"
          className={`assessment-stat-card ${selectedStatus === "Graded" ? "assessment-stat-active" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "Graded" ? "All" : "Graded")}
        >
          <div className="asm-stat-icon asm-stat-green">
            <CheckCircle2 size={22} />
          </div>
          <div className="asm-stat-info">
            <strong className="asm-stat-number">{String(stats.graded).padStart(2, "0")}</strong>
            <span className="asm-stat-label">Graded</span>
          </div>
        </button>

        <button
          type="button"
          className="assessment-stat-card"
          onClick={() => setSelectedStatus("All")}
        >
          <div className="asm-stat-icon asm-stat-slate">
            <ClipboardCheck size={22} />
          </div>
          <div className="asm-stat-info">
            <strong className="asm-stat-number">{String(stats.total).padStart(2, "0")}</strong>
            <span className="asm-stat-label">Total assigned</span>
          </div>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="assessments-controls-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search assessments, subjects, batches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="subject-filter-tabs">
          {["All", "To do", "In progress", "Graded"].map((statusTab) => {
            const isActive = selectedStatus === statusTab;
            return (
              <button
                key={statusTab}
                type="button"
                className={`subject-tab ${isActive ? "subject-tab-active" : ""}`}
                onClick={() => setSelectedStatus(statusTab)}
              >
                {statusTab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 size={32} className="animate-spin text-[#2D9F75]" />
          <p className="text-sm font-medium text-gray-500">Loading your assessments from database...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAssessments.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#2D9F75] flex items-center justify-center">
            <BookOpen size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Assessments for Your Classes</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            {searchQuery || selectedStatus !== "All"
              ? "No assessments match your current filter criteria."
              : "You have access strictly to resources of your enrolled classes. No active assignments have been posted for your classes yet."}
          </p>
          {(searchQuery || selectedStatus !== "All") && (
            <button
              type="button"
              className="mt-2 text-xs font-bold text-[#2D9F75] underline"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("All");
                setSelectedSubject("All");
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* Assessments Cards List */}
      {!isLoading && filteredAssessments.length > 0 && (
        <div className="assessments-cards-list">
          {filteredAssessments.map((item) => {
            const isGraded = item.status === "Graded";
            const isInProgress = item.status === "In progress";
            const subjBadge = getSubjectBadge(item.subjectCode, item.subject);

            return (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-300/80 dark:hover:border-indigo-800/80"
              >
                {/* Dynamic Smart Status Accent Stripe */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                    isGraded
                      ? "bg-gradient-to-b from-emerald-500 to-teal-600"
                      : isInProgress
                      ? "bg-gradient-to-b from-amber-400 to-orange-500"
                      : "bg-gradient-to-b from-blue-600 to-indigo-600"
                  }`}
                />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pl-1.5">
                  {/* Main Details */}
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Subject, Type, Status */}
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase border ${subjBadge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${subjBadge.dot}`} />
                        {item.subject}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {item.type}
                      </span>

                      {/* Smart Status Pill */}
                      {isGraded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 ml-auto sm:ml-0">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          Graded
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 ml-auto sm:ml-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 ml-auto sm:ml-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Available
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>

                    {/* Batch */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <GraduationCap size={14} className="text-slate-400 shrink-0" />
                      <span>
                        Batch: <span className="font-medium text-slate-700 dark:text-slate-300">{item.teacher}</span>
                      </span>
                    </div>

                    {/* Smart Spec Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <FileText size={13} className="text-slate-400" />
                        <span>{item.questionsCount} Questions</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <Clock3 size={13} className="text-slate-400" />
                        <span>{item.duration}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <Award size={13} className="text-slate-400" />
                        <span>{item.totalMarks} Marks</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200/70 dark:border-rose-900/50">
                        <Calendar size={13} className="text-rose-500" />
                        <span>Due: {item.dueDate}</span>
                      </span>
                    </div>

                    {/* In Progress Bar */}
                    {isInProgress && (
                      <div className="assessment-inline-progress mt-3">
                        <div className="progress-track-bg">
                          <div className="progress-track-fill" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="progress-track-text">{item.progress}% completed</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Result Capsule */}
                  <div className="flex items-center justify-between lg:justify-end gap-3.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/80 shrink-0">
                    {isGraded ? (
                      <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                        {/* Score Capsule */}
                        {item.score !== undefined && (
                          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">
                                Score
                              </span>
                              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                                {item.score}{" "}
                                <span className="text-xs font-normal text-slate-400">
                                  / {item.totalMarks}
                                </span>
                              </span>
                            </div>

                            {item.grade && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-xs font-black tracking-wide border ${getGradeBadgeStyle(
                                  item.grade
                                )}`}
                              >
                                {item.grade}
                              </span>
                            )}
                          </div>
                        )}

                        {/* View Result Action Button */}
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white dark:bg-slate-800 dark:hover:bg-blue-600 font-semibold text-xs tracking-wide transition-all duration-200 shadow-sm hover:shadow-md active:scale-98 disabled:opacity-50 group"
                          disabled={isLoadingResult}
                          onClick={() => handleViewResult(item.id, item.type)}
                        >
                          <Trophy size={15} className="text-amber-400 group-hover:scale-110 transition-transform" />
                          <span>View Result</span>
                          <ChevronRight
                            size={14}
                            className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                          />
                        </button>
                      </div>
                    ) : item.type === "Assignment" || item.type === "Essay" ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 active:scale-98 w-full lg:w-auto group"
                        onClick={() => setActiveEssaySubmissionId(item.id)}
                      >
                        <FileText size={16} className="group-hover:scale-110 transition-transform" />
                        <span>Open Paper</span>
                        <ChevronRight
                          size={15}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 active:scale-98 w-full lg:w-auto group"
                        onClick={() => setActiveQuizTakingId(item.id)}
                      >
                        <PlayCircle size={17} className="group-hover:scale-110 transition-transform" />
                        <span>Start Quiz</span>
                        <ChevronRight
                          size={15}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modern Student Quiz Taking Studio Modal */}
      {activeQuizTakingId && (
        <StudentQuizTakingModal
          assessmentId={activeQuizTakingId}
          studentId={user?.studentId || user?.id}
          onClose={() => setActiveQuizTakingId(null)}
          onSubmitSuccess={handleQuizFinished}
        />
      )}

      {/* Graded Quiz Result Review Modal */}
      {activeResult && (
        <QuizResultModal
          result={activeResult}
          onClose={() => setActiveResult(null)}
        />
      )}

      {/* Student Essay / Paper Submission Modal */}
      {activeEssaySubmissionId && (
        <StudentEssaySubmissionModal
          assessmentId={activeEssaySubmissionId}
          studentId={user?.studentId || user?.id}
          onClose={() => setActiveEssaySubmissionId(null)}
          onSubmitSuccess={() => {
            setActiveEssaySubmissionId(null);
            loadAssessments();
          }}
        />
      )}
    </div>
  );
}
