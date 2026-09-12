"use client";

import { useState } from "react";
import {
  X,
  Award,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { assessmentService } from "@/services/assessmentService";
import type { Submission } from "@/lib/types/assignment";

interface TeacherGradingModalProps {
  assessmentId: string;
  totalMarks: number;
  submission: Submission;
  onClose: () => void;
  onGraded: () => void;
}

export function TeacherGradingModal({
  assessmentId,
  totalMarks,
  submission,
  onClose,
  onGraded,
}: TeacherGradingModalProps) {
  const [score, setScore] = useState<string>(
    submission.marks !== null ? String(submission.marks) : ""
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0) {
      setErrorMsg("Please enter a valid marks score (0 or greater)");
      return;
    }
    if (numericScore > totalMarks) {
      setErrorMsg(`Marks cannot exceed total marks of ${totalMarks}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await assessmentService.gradeSubmission(assessmentId, submission.id, {
        scoreObtained: numericScore,
        feedback: feedback.trim(),
      });
      onGraded();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to save grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-6 md:p-7 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-serif">
                Grade Submission
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {submission.studentName}
                </span>
                <span>•</span>
                <span>ID: {submission.studentId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {submission.submittedAt || "Recent"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student Uploaded Paper File */}
          {submission.paperUploadUrl && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Student Answer Document
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Uploaded file / scanned answer paper
                  </p>
                </div>
              </div>

              <a
                href={submission.paperUploadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Download size={14} />
                <span>Open Paper</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Student Typed Essay Text */}
          {submission.answerText && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Online Typed Answer
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-2">
                {submission.answerText}
              </p>
            </div>
          )}

          {/* Score Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Marks Awarded (out of {totalMarks})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max={totalMarks}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder={`e.g. ${Math.round(totalMarks * 0.8)}`}
                required
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm font-semibold transition-all shadow-xs"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                / {totalMarks} Marks
              </span>
            </div>
          </div>

          {/* Teacher Qualitative Feedback */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Feedback & Comments for Student
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback, notes on working steps, or corrections..."
              rows={4}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm transition-all resize-none shadow-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publishing Grade...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Save & Publish Grade</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
