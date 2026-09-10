"use client";

import { useState } from "react";
import { Plus, Sparkles, CheckCircle, FileText } from "lucide-react";
import { CreateAssignmentForm } from "@/components/assignments/CreateAssignmentForm";
import { AssignmentListCard } from "@/components/assignments/AssignmentListCard";
import { SubmissionsView } from "@/components/assignments/SubmissionsView";
import { PdfQuizUploadModal } from "@/components/assignments/PdfQuizUploadModal";
import { QuizReviewStudio } from "@/components/assignments/QuizReviewStudio";
import { ParsedQuestion } from "@/lib/utils/quizParser";
import type { Assignment, Submission } from "@/lib/types/assignment";

const initialMockAssignments: Assignment[] = [
  { id: "1", title: "Integration — Practice Set 3", batch: "A/L Batch B", status: "Open", submissionsCount: 18, totalStudents: 32, dueDate: "29 Aug 2026" },
  { id: "2", title: "Differentiation Problems", batch: "A/L Batch A", status: "Closed", submissionsCount: 24, totalStudents: 24, dueDate: "27 Aug 2026" },
  { id: "3", title: "Algebra Worksheet", batch: "O/L Batch A", status: "Open", submissionsCount: 5, totalStudents: 28, dueDate: "30 Aug 2026" },
];

const mockSubmissions: Submission[] = [
  { id: "s1", studentName: "Sahan Amarasinghe", studentId: "24081", submittedAt: "25 Aug, 9:00 AM", status: "Submitted", marks: null, totalMarks: 50, grade: null },
  { id: "s2", studentName: "Amali Perera", studentId: "24082", submittedAt: "24 Aug, 11:30 PM", status: "Submitted", marks: 38, totalMarks: 50, grade: "A" },
  { id: "s3", studentName: "Kasun Fernando", studentId: "24083", submittedAt: "24 Aug, 8:15 PM", status: "Submitted", marks: 32, totalMarks: 50, grade: "B+" },
  { id: "s4", studentName: "Nimasha Silva", studentId: "24084", submittedAt: "25 Aug, 6:00 AM", status: "Submitted", marks: null, totalMarks: 50, grade: null },
  { id: "s5", studentName: "Tharaka Jayasinghe", studentId: "24085", submittedAt: null, status: "Pending", marks: null, totalMarks: 50, grade: null },
  { id: "s6", studentName: "Sanduni Rathnayake", studentId: "24086", submittedAt: "23 Aug, 4:00 PM", status: "Submitted", marks: 45, totalMarks: 50, grade: "A+" },
];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(initialMockAssignments);
  const [isCreating, setIsCreating] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<ParsedQuestion[] | null>(null);
  const [reviewTitle, setReviewTitle] = useState("Imported MCQ Quiz");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>("1");

  const activeAssignment = assignments.find((a) => a.id === activeAssignmentId);

  const handleQuestionsExtracted = (questions: ParsedQuestion[], fileName?: string) => {
    setReviewTitle(fileName ? `${fileName} (Quiz)` : "Imported MCQ Quiz");
    setReviewQuestions(questions);
  };

  const handleQuizSaved = () => {
    const newQuizAssignment: Assignment = {
      id: `quiz_${Date.now()}`,
      title: reviewTitle,
      batch: "A/L Batch A",
      status: "Open",
      submissionsCount: 0,
      totalStudents: 32,
      dueDate: "In 7 days",
    };

    setAssignments((prev) => [newQuizAssignment, ...prev]);
    setActiveAssignmentId(newQuizAssignment.id);
    setReviewQuestions(null);
    setSuccessMsg(`"${reviewTitle}" successfully published and synced with LMS database!`);
    setTimeout(() => setSuccessMsg(null), 6000);
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

            {/* Standard manual create assignment button */}
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
        <CreateAssignmentForm onCancel={() => setIsCreating(false)} />
      )}

      {/* Main Grid View */}
      {!reviewQuestions && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <AssignmentListCard
                key={assignment.id}
                assignment={assignment}
                isActive={assignment.id === activeAssignmentId}
                onClick={() => setActiveAssignmentId(assignment.id)}
              />
            ))}
          </div>

          <div className="lg:col-span-2">
            {activeAssignment && (
              <SubmissionsView
                assignment={activeAssignment}
                submissions={mockSubmissions}
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
    </div>
  );
}