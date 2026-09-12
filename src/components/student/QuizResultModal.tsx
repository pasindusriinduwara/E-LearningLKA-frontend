"use client";

import React from "react";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Clock,
  Check,
  X,
  ArrowLeft,
  Share2,
  FileCheck2,
} from "lucide-react";
import { QuizSubmissionResult } from "@/services/assessmentService";

interface QuizResultModalProps {
  result: QuizSubmissionResult;
  onClose: () => void;
}

export function QuizResultModal({ result, onClose }: QuizResultModalProps) {
  const isPass = (result.percentage || 0) >= 40.0;
  const isDistinction = (result.percentage || 0) >= 75.0;

  const gradeColors: Record<string, string> = {
    "A+": "from-emerald-500 to-teal-600 text-white border-emerald-400/40",
    A: "from-emerald-500 to-green-600 text-white border-emerald-400/40",
    B: "from-blue-500 to-indigo-600 text-white border-blue-400/40",
    C: "from-amber-500 to-yellow-600 text-white border-amber-400/40",
    S: "from-orange-500 to-amber-600 text-white border-orange-400/40",
    F: "from-rose-500 to-red-600 text-white border-rose-400/40",
  };

  const gradeBadgeClass =
    gradeColors[result.grade || "F"] || "from-slate-700 to-slate-800 text-white border-slate-600";

  const formattedDate = result.submittedAt
    ? new Date(result.submittedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Hero Banner */}
        <div
          className={`p-8 text-center relative overflow-hidden bg-gradient-to-b ${
            isDistinction
              ? "from-emerald-950/60 to-slate-900"
              : isPass
              ? "from-blue-950/60 to-slate-900"
              : "from-rose-950/60 to-slate-900"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trophy / Result Icon */}
          <div className="inline-flex p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-inner">
            <Award
              className={`w-10 h-10 ${
                isDistinction
                  ? "text-yellow-400"
                  : isPass
                  ? "text-blue-400"
                  : "text-rose-400"
              }`}
            />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">{result.title}</h2>
          <p className="text-xs text-slate-400 mb-6 flex items-center justify-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Submitted on {formattedDate}</span>
          </p>

          {/* Score Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {/* Grade */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400 block mb-1">Academic Grade</span>
              <span
                className={`inline-block px-3 py-0.5 rounded-lg text-lg font-extrabold bg-gradient-to-r border ${gradeBadgeClass}`}
              >
                {result.grade || "N/A"}
              </span>
            </div>

            {/* Score */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400 block mb-1">Total Score</span>
              <span className="text-lg font-bold text-white">
                {result.scoreObtained} <span className="text-xs text-slate-400">/ {result.totalMarks}</span>
              </span>
            </div>

            {/* Percentage */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400 block mb-1">Percentage</span>
              <span
                className={`text-lg font-bold ${
                  isPass ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {result.percentage}%
              </span>
            </div>

            {/* Correct count */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400 block mb-1">Correct Answers</span>
              <span className="text-lg font-bold text-blue-400">
                {result.correctCount} <span className="text-xs text-slate-400">/ {result.totalQuestions}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Question Breakdown List */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Detailed Question Review
            </h3>
            <span className="text-xs text-slate-500">
              {result.answers ? result.answers.length : 0} Questions Evaluated
            </span>
          </div>

          <div className="space-y-5">
            {result.answers &&
              result.answers.map((ans, idx) => {
                const isCorrect = ans.isCorrect;

                return (
                  <div
                    key={ans.questionId || idx}
                    className={`p-5 rounded-2xl border transition-colors ${
                      isCorrect
                        ? "bg-emerald-950/20 border-emerald-900/50"
                        : "bg-slate-900/80 border-slate-800"
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            isCorrect
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {isCorrect ? "Correct (+ marks)" : "Incorrect"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {ans.marksAwarded} Marks
                      </span>
                    </div>

                    <h4 className="text-base text-white font-medium mb-4 whitespace-pre-wrap">
                      {ans.questionText}
                    </h4>

                    {/* Options list */}
                    <div className="space-y-2">
                      {ans.options &&
                        ans.options.map((opt, optIdx) => {
                          const isStudentSelected = ans.selectedOptionId === opt.id;
                          const isOptionCorrect = opt.isCorrect || ans.correctOptionId === opt.id;
                          const label = optionLabels[optIdx] || String(optIdx + 1);

                          let optStyles = "bg-slate-900 border-slate-800/70 text-slate-400";
                          let badgeStyles = "bg-slate-800 text-slate-400";

                          if (isOptionCorrect) {
                            optStyles = "bg-emerald-950/40 border-emerald-500/60 text-emerald-100 font-medium";
                            badgeStyles = "bg-emerald-600 text-white";
                          } else if (isStudentSelected && !isOptionCorrect) {
                            optStyles = "bg-rose-950/40 border-rose-500/60 text-rose-100 line-through opacity-80";
                            badgeStyles = "bg-rose-600 text-white";
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border text-sm flex items-center gap-3 transition-colors ${optStyles}`}
                            >
                              <div
                                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${badgeStyles}`}
                              >
                                {label}
                              </div>
                              <span className="flex-1">{opt.optionText}</span>

                              {isOptionCorrect && (
                                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold shrink-0">
                                  <Check className="w-4 h-4" />
                                  <span>Correct Answer</span>
                                </span>
                              )}
                              {isStudentSelected && !isOptionCorrect && (
                                <span className="text-xs text-rose-400 flex items-center gap-1 font-semibold shrink-0">
                                  <X className="w-4 h-4" />
                                  <span>Your Choice</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-900/30 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assessments</span>
          </button>
        </div>
      </div>
    </div>
  );
}
