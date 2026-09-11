"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Timer,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  CheckCircle2,
  HelpCircle,
  X,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  StudentQuizTakeResponse,
  QuizSubmissionResult,
  assessmentService,
} from "@/services/assessmentService";

interface StudentQuizTakingModalProps {
  assessmentId: string;
  studentId?: string;
  onClose: () => void;
  onSubmitSuccess: (result: QuizSubmissionResult) => void;
}

export function StudentQuizTakingModal({
  assessmentId,
  studentId,
  onClose,
  onSubmitSuccess,
}: StudentQuizTakingModalProps) {
  const [quizData, setQuizData] = useState<StudentQuizTakeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // questionId -> selectedOptionId
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = useState(60 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    assessmentService
      .getAssessmentForTaking(assessmentId)
      .then((res) => {
        if (mounted) {
          setQuizData(res);
          const totalSecs = (res.durationMinutes || 60) * 60;
          setSecondsRemaining(totalSecs);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load quiz questions");
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentId]);

  // Timer countdown
  useEffect(() => {
    if (!quizData || isLoading || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizData, isLoading, isSubmitting]);

  const questions = useMemo(() => quizData?.questions || [], [quizData]);
  const currentQuestion = questions[currentIndex];

  const answeredCount = useMemo(() => {
    return Object.keys(userAnswers).length;
  }, [userAnswers]);

  const progressPercentage = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions.length]);

  // Format Timer MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const isLowTime = secondsRemaining < 300; // < 5 mins
  const isCriticalTime = secondsRemaining < 60; // < 1 min

  function handleSelectOption(questionId: string, optionId: string) {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  function handleToggleFlag(questionId: string) {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }

  async function performSubmit() {
    if (isSubmitting || !quizData) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const payloadAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: userAnswers[q.id] || undefined,
      }));

      const result = await assessmentService.submitQuiz(quizData.id, {
        studentId,
        answers: payloadAnswers,
      });

      onSubmitSuccess(result);
    } catch (err: unknown) {
      alert("Submission failed: " + (err instanceof Error ? err.message : String(err)));
      setIsSubmitting(false);
    }
  }

  function handleAutoSubmit() {
    alert("Time has expired! Submitting your answers automatically now.");
    performSubmit();
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Preparing Assessment</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading secure exam paper and options...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-rose-200 dark:border-rose-900">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Assessment Unavailable</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{error || "No questions found in this assessment."}</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Exam Header */}
      <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
            Q
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate">{quizData.title}</h2>
            <p className="text-xs text-slate-400 truncate">{quizData.batchName} • {quizData.totalMarks} Marks</p>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-mono text-sm font-bold border transition-colors ${
            isCriticalTime
              ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
              : isLowTime
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-slate-800/80 text-emerald-400 border-emerald-500/30"
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Finish & Submit</span>
          </button>
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Exit Exam"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col justify-between max-w-4xl mx-auto w-full">
          <div>
            {/* Question Progress & Order Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-slate-400">
                  {currentQuestion?.marks || 1} Marks
                </span>
              </div>

              <button
                onClick={() => handleToggleFlag(currentQuestion.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  flaggedQuestions[currentQuestion.id]
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedQuestions[currentQuestion.id] ? "Flagged for Review" : "Flag Question"}</span>
              </button>
            </div>

            {/* Question Prompt */}
            <div className="mb-8">
              <h3 className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed whitespace-pre-wrap">
                {currentQuestion?.questionText}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-3.5">
              {currentQuestion?.options.map((opt, optIdx) => {
                const isSelected = userAnswers[currentQuestion.id] === opt.id;
                const label = optionLabels[optIdx] || String(optIdx + 1);

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 group ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500/70 shadow-md shadow-blue-900/20"
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                      }`}
                    >
                      {label}
                    </div>
                    <span
                      className={`text-base flex-1 ${
                        isSelected ? "text-blue-100 font-medium" : "text-slate-200"
                      }`}
                    >
                      {opt.optionText}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-slate-700 bg-transparent"
                      }`}
                    >
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Pagination & Navigation Buttons */}
          <div className="pt-8 mt-8 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none font-medium text-sm transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-900/30 transition-all flex items-center gap-2"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Review & Submit</span>
              </button>
            )}
          </div>
        </main>

        {/* Right Question Navigator Sidebar */}
        <aside className="w-80 border-l border-slate-800/80 bg-slate-900/60 p-6 hidden lg:flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Questions Overview</h4>
              <span className="text-xs font-semibold text-blue-400">
                {answeredCount}/{questions.length} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Number grid */}
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!userAnswers[q.id];
                const isFlagged = !!flaggedQuestions[q.id];

                let btnStyles = "bg-slate-800/80 border-slate-700/60 text-slate-400";
                if (isCurrent) {
                  btnStyles = "bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40 font-bold";
                } else if (isFlagged) {
                  btnStyles = "bg-amber-500/20 text-amber-300 border-amber-500/50";
                } else if (isAnswered) {
                  btnStyles = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl text-xs font-medium border flex items-center justify-center transition-all ${btnStyles}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="pt-6 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" />
              <span>Flagged for review</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
              <span>Unanswered</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Ready to Submit?</h3>
            <p className="text-sm text-slate-300 mb-6">
              You have answered <strong className="text-white">{answeredCount}</strong> of{" "}
              <strong className="text-white">{questions.length}</strong> questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-amber-400 font-medium">
                  ⚠️ You have {questions.length - answeredCount} unanswered questions!
                </span>
              )}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors"
              >
                Back to Questions
              </button>
              <button
                onClick={performSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <span>Submit Exam</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Exit Assessment?</h3>
            <p className="text-sm text-slate-300 mb-6">
              Your exam progress will be lost if you leave without submitting. Are you sure you want to exit?
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors"
              >
                Continue Exam
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-900/40 transition-all"
              >
                Exit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
