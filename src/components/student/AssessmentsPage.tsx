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
} from "lucide-react";
import {
  assessmentService,
  AssessmentSummary,
  QuizSubmissionResult,
} from "@/services/assessmentService";
import { useAuth } from "@/context/AuthContext";
import { StudentQuizTakingModal } from "./StudentQuizTakingModal";
import { QuizResultModal } from "./QuizResultModal";

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

export function AssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");

  // Quiz Taking Modal State
  const [activeQuizTakingId, setActiveQuizTakingId] = useState<string | null>(null);

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

  async function handleViewResult(assessmentId: string) {
    setIsLoadingResult(true);
    try {
      const res = await assessmentService.getStudentSubmission(
        assessmentId,
        user?.studentId || user?.id
      );
      setActiveResult(res);
    } catch (err) {
      console.error("Could not fetch submission review:", err);
      alert("Could not load submission result details.");
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
          <p className="assessments-eyebrow">ACADEMIC EVALUATIONS</p>
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
          <h3 className="text-base font-bold text-gray-800">No Assessments Available</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            {searchQuery || selectedStatus !== "All"
              ? "No assessments match your current filter criteria."
              : "Your teachers haven't assigned any tests or quizzes yet. Check back soon!"}
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
            return (
              <article className="assessment-item-card" key={item.id}>
                <div className="assessment-item-main">
                  <div className="assessment-top-meta">
                    <span
                      className={`subject-tag ${
                        item.subjectCode === "math"
                          ? "subject-tag-math"
                          : item.subjectCode === "chem"
                          ? "subject-tag-chem"
                          : "subject-tag-phys"
                      }`}
                    >
                      {item.subject.toUpperCase()}
                    </span>
                    <span className="assessment-type-pill">{item.type}</span>
                  </div>

                  <h3 className="assessment-card-title">{item.title}</h3>
                  <p className="assessment-card-teacher">Batch: {item.teacher}</p>

                  <div className="assessment-specs-row">
                    <span className="spec-item">
                      <FileText size={14} />
                      <span>{item.questionsCount} Questions</span>
                    </span>
                    <span className="spec-item">
                      <Clock3 size={14} />
                      <span>{item.duration}</span>
                    </span>
                    <span className="spec-item">
                      <Award size={14} />
                      <span>{item.totalMarks} Marks</span>
                    </span>
                    <span className="spec-due-date">
                      <span>Due: {item.dueDate}</span>
                    </span>
                  </div>

                  {item.status === "In progress" && (
                    <div className="assessment-inline-progress">
                      <div className="progress-track-bg">
                        <div className="progress-track-fill" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="progress-track-text">{item.progress}% completed</span>
                    </div>
                  )}
                </div>

                <div className="assessment-item-actions">
                  {item.status === "Graded" ? (
                    <div className="flex items-center gap-3">
                      {item.score !== undefined && (
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                            {item.score} / {item.totalMarks}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Grade {item.grade || "A"}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="review-feedback-btn flex items-center gap-1.5"
                        disabled={isLoadingResult}
                        onClick={() => handleViewResult(item.id)}
                      >
                        <Award size={16} className="text-amber-500" />
                        <span>View Result</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="start-assessment-btn flex items-center gap-1.5"
                      onClick={() => setActiveQuizTakingId(item.id)}
                    >
                      <PlayCircle size={18} />
                      <span>Start Quiz</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
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
    </div>
  );
}
