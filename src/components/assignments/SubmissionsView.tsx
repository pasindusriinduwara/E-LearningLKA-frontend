"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Award,
  FileText,
  CheckCircle2,
  Download,
  Clock,
} from "lucide-react";
import type { Assignment, Submission } from "@/lib/types/assignment";
import { TeacherGradingModal } from "./TeacherGradingModal";

interface SubmissionsViewProps {
  assignment: Assignment;
  submissions: Submission[];
  onToggleHide?: (assignment: Assignment) => void;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onRefreshSubmissions?: () => void;
}

export function SubmissionsView({
  assignment,
  submissions,
  onToggleHide,
  onEdit,
  onDelete,
  onRefreshSubmissions,
}: SubmissionsViewProps) {
  const [selectedSubmissionForGrading, setSelectedSubmissionForGrading] = useState<Submission | null>(null);
  const isHidden = assignment.hidden || assignment.status === "Hidden";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-[10px] font-bold text-[#2D9F75] uppercase tracking-widest">
              {assignment.batch}
            </p>
            {isHidden && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                <EyeOff size={10} /> Hidden from students
              </span>
            )}
            {assignment.attachmentUrl && (
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 hover:underline"
              >
                <FileText size={10} /> View Question Paper
              </a>
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-serif">
            {assignment.title}
          </h2>

          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
            <span>Total Marks: <strong className="text-slate-700 dark:text-slate-300">{assignment.totalMarks || 50}</strong></span>
            <span>•</span>
            <span>Submissions: <strong className="text-slate-700 dark:text-slate-300">{submissions.length}</strong></span>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2">
          {onToggleHide && (
            <button
              type="button"
              onClick={() => onToggleHide(assignment)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
                isHidden
                  ? "bg-emerald-50 text-[#2D9F75] border-emerald-200 hover:bg-emerald-100"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{isHidden ? "Unhide" : "Hide"}</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(assignment)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(assignment)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
              title="Delete assignment"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Submissions Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            When students in this batch complete and submit their essay papers or quizzes, their submissions, papers, and score evaluation records will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-bold bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-6 py-4 font-bold">Student</th>
                <th className="px-6 py-4 font-bold">Submitted</th>
                <th className="px-6 py-4 font-bold">Paper / Work</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Marks</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {submissions.map((sub) => {
                const isGraded = sub.status === "Graded";
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{sub.studentName}</div>
                      <div className="text-xs text-slate-400 font-mono">ID: {sub.studentId}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {sub.submittedAt || <span className="text-slate-300">Not submitted</span>}
                    </td>
                    <td className="px-6 py-4">
                      {sub.paperUploadUrl ? (
                        <a
                          href={sub.paperUploadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline"
                        >
                          <FileText size={12} />
                          <span>View PDF</span>
                          <Download size={11} />
                        </a>
                      ) : sub.answerText ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <span>Online Text</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isGraded
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200"
                        }`}
                      >
                        {isGraded ? "Graded" : "Needs Grading"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sub.marks !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {sub.marks}
                            <span className="text-slate-400 font-normal">/{sub.totalMarks}</span>
                          </span>
                          {sub.grade && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {sub.grade}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSubmissionForGrading(sub)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                          isGraded
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                        }`}
                      >
                        <Award size={13} />
                        <span>{isGraded ? "Edit Grade" : "Evaluate & Grade"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Teacher Grading Evaluation Modal */}
      {selectedSubmissionForGrading && (
        <TeacherGradingModal
          assessmentId={assignment.id}
          totalMarks={assignment.totalMarks || 50}
          submission={selectedSubmissionForGrading}
          onClose={() => setSelectedSubmissionForGrading(null)}
          onGraded={() => {
            if (onRefreshSubmissions) {
              onRefreshSubmissions();
            }
          }}
        />
      )}
    </div>
  );
}