"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Sparkles, CheckCircle, FileText, Loader2, BookOpen } from "lucide-react";
import { CreateAssignmentForm } from "@/components/assignments/CreateAssignmentForm";
import { AssignmentListCard } from "@/components/assignments/AssignmentListCard";
import { SubmissionsView } from "@/components/assignments/SubmissionsView";
import { PdfQuizUploadModal } from "@/components/assignments/PdfQuizUploadModal";
import { QuizReviewStudio } from "@/components/assignments/QuizReviewStudio";
import { EditAssignmentModal } from "@/components/assignments/EditAssignmentModal";
import { ParsedQuestion } from "@/lib/utils/quizParser";
import { assessmentService } from "@/services/assessmentService";
import type { Assignment, Submission } from "@/lib/types/assignment";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ParsedQuestion[] | null>(null);
  const [reviewTitle, setReviewTitle] = useState("Imported MCQ Quiz");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const loadAssessments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assessmentService.getAllAssessments();
      if (Array.isArray(data)) {
        const mapped: Assignment[] = data.map((a) => {
          let formattedDate = "No due date";
          if (a.dueDate) {
            try {
              formattedDate = new Date(a.dueDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
            } catch {
              formattedDate = a.dueDate;
            }
          }

          let status = (a.status as "Open" | "Closed" | "Hidden") || "Open";
          if (a.hidden) {
            status = "Hidden";
          }

          return {
            id: a.id,
            title: a.title,
            batch: a.batchName || "A/L Batch",
            status: status,
            hidden: Boolean(a.hidden),
            totalMarks: a.totalMarks,
            durationMinutes: a.durationMinutes,
            submissionsCount: a.submissionsCount || 0,
            totalStudents: a.totalStudents || 32,
            dueDate: formattedDate,
          };
        });

        setAssignments(mapped);
        if (mapped.length > 0) {
          setActiveAssignmentId((prev) => (prev && mapped.some((m) => m.id === prev) ? prev : mapped[0].id));
        } else {
          setActiveAssignmentId(null);
        }
      }
    } catch (err) {
      console.warn("Could not load assessments from backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    if (!activeAssignmentId) {
      setSubmissions([]);
      return;
    }
    setIsLoadingSubmissions(true);
    assessmentService
      .getAssessmentSubmissions(activeAssignmentId)
      .then((data) => {
        if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          setSubmissions([]);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch submissions for assessment:", err);
        setSubmissions([]);
      })
      .finally(() => {
        setIsLoadingSubmissions(false);
      });
  }, [activeAssignmentId]);

  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId);

  const handleQuestionsExtracted = (questions: ParsedQuestion[], fileName?: string) => {
    setReviewTitle(fileName ? `${fileName} (Quiz)` : "Imported MCQ Quiz");
    setReviewQuestions(questions);
  };

  const handleQuizSaved = async () => {
    setReviewQuestions(null);
    setSuccessMsg(`"${reviewTitle}" successfully published and saved to LMS!`);
    await loadAssessments();
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleAssignmentCreated = async () => {
    setIsCreating(false);
    setSuccessMsg("Assignment created and published successfully!");
    await loadAssessments();
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleToggleHide = async (assignment: Assignment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await assessmentService.toggleHideAssessment(assignment.id);
      const isNowHidden = !assignment.hidden;
      setSuccessMsg(`"${assignment.title}" is now ${isNowHidden ? "hidden from" : "visible to"} students.`);
      await loadAssessments();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
    }
  };

  const handleDelete = async (assignment: Assignment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
      return;
    }

    try {
      await assessmentService.deleteAssessment(assignment.id);
      setSuccessMsg(`"${assignment.title}" was deleted.`);
      await loadAssessments();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error("Failed to delete assessment:", err);
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Assessments & Quizzes</p>
          <h1 className="text-4xl font-extrabold text-gray-900 font-serif">Assessments</h1>
        </div>

        {!isCreating && !reviewQuestions && (
          <div className="flex items-center gap-3">
            {/* Convert PDF to Quiz button */}
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-[#2D9F75] border border-emerald-200 font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Sparkles size={17} className="text-[#2D9F75]" />
              <span>Convert PDF to Quiz</span>
            </button>

            {/* Manual create assignment button */}
            <button
              onClick={() => setIsCreating(true)}
              className="bg-[#2D9F75] hover:bg-emerald-600 text-white font-medium text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Create assignment</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={20} className="text-[#2D9F75] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Review Studio if PDF questions are extracted */}
      {reviewQuestions && (
        <QuizReviewStudio
          initialQuestions={reviewQuestions}
          initialTitle={reviewTitle}
          onCancel={() => setReviewQuestions(null)}
          onSaved={handleQuizSaved}
        />
      )}

      {/* Manual assignment form */}
      {isCreating && !reviewQuestions && (
        <CreateAssignmentForm
          onCancel={() => setIsCreating(false)}
          onSuccess={handleAssignmentCreated}
        />
      )}

      {/* Loading State */}
      {isLoading && !reviewQuestions && !isCreating && (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 size={32} className="animate-spin text-[#2D9F75]" />
          <p className="text-sm font-medium text-gray-500">Loading assessments from database...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && assignments.length === 0 && !reviewQuestions && !isCreating && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#2D9F75] flex items-center justify-center">
            <BookOpen size={30} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-serif">No Assessments Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              You haven&apos;t created any assignments or quizzes yet. Upload a PDF exam paper to convert it into an LMS quiz or create an assignment manually.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-[#2D9F75] border border-emerald-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Sparkles size={16} />
              <span>Convert PDF to Quiz</span>
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-[#2D9F75] hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Create Assignment</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      {!isLoading && assignments.length > 0 && !reviewQuestions && !isCreating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <AssignmentListCard
                key={assignment.id}
                assignment={assignment}
                isActive={assignment.id === activeAssignmentId}
                onClick={() => setActiveAssignmentId(assignment.id)}
                onToggleHide={(a, e) => handleToggleHide(a, e)}
                onDelete={(a, e) => handleDelete(a, e)}
              />
            ))}
          </div>

          <div className="lg:col-span-2">
            {activeAssignment && (
              <SubmissionsView
                assignment={activeAssignment}
                submissions={submissions}
                onToggleHide={(a) => handleToggleHide(a)}
                onEdit={(a) => handleEdit(a)}
                onDelete={(a) => handleDelete(a)}
              />
            )}
          </div>
        </div>
      )}

      {/* PDF Upload Modal */}
      <PdfQuizUploadModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onQuestionsExtracted={handleQuestionsExtracted}
      />

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          isOpen={Boolean(editingAssignment)}
          onClose={() => setEditingAssignment(null)}
          onUpdated={async () => {
            setSuccessMsg("Assignment updated successfully!");
            await loadAssessments();
            setTimeout(() => setSuccessMsg(null), 5000);
          }}
        />
      )}
    </div>
  );
}