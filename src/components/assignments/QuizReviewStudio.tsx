"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  Layers,
  Sparkles,
  Save,
  Loader2,
} from "lucide-react";
import { ParsedQuestion } from "@/lib/utils/quizParser";
import { assessmentService, SaveQuizPayload } from "@/services/assessmentService";
import { fetchApi } from "@/lib/api";

interface BatchItem {
  id: string;
  name: string;
  subject?: string;
}

interface QuizReviewStudioProps {
  initialQuestions: ParsedQuestion[];
  initialTitle?: string;
  onCancel: () => void;
  onSaved: () => void;
}

export function QuizReviewStudio({
  initialQuestions,
  initialTitle = "Imported MCQ Quiz",
  onCancel,
  onSaved,
}: QuizReviewStudioProps) {
  const [title, setTitle] = useState(initialTitle);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [batchId, setBatchId] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState<ParsedQuestion[]>(initialQuestions);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<BatchItem[]>("/batches")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBatches(data);
          setBatchId(data[0].id);
        }
      })
      .catch((err) => {
        console.warn("Could not load batches:", err);
      });
  }, []);

  // Calculations
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
  const missingAnswerCount = questions.filter((q) => !q.options.some((o) => o.isCorrect)).length;

  // Question editing handlers
  const handlePromptChange = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], questionText: text };
      return copy;
    });
  };

  const handleMarksChange = (qIndex: number, marks: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], marks: Math.max(0.5, marks) };
      return copy;
    });
  };

  const handleSelectCorrectOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const targetQ = { ...copy[qIndex] };
      targetQ.options = targetQ.options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === optIndex,
      }));
      targetQ.hasCorrectAnswer = true;
      targetQ.warning = undefined;
      copy[qIndex] = targetQ;
      return copy;
    });
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const targetQ = { ...copy[qIndex] };
      targetQ.options = [...targetQ.options];
      targetQ.options[optIndex] = { ...targetQ.options[optIndex], text };
      copy[qIndex] = targetQ;
      return copy;
    });
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const targetQ = { ...copy[qIndex] };
      const labels = ["A", "B", "C", "D", "E", "F"];
      const nextLabel = labels[targetQ.options.length] || `Opt${targetQ.options.length + 1}`;
      targetQ.options = [
        ...targetQ.options,
        { label: nextLabel, text: `New option`, isCorrect: false },
      ];
      copy[qIndex] = targetQ;
      return copy;
    });
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const targetQ = { ...copy[qIndex] };
      targetQ.options = targetQ.options.filter((_, idx) => idx !== optIndex);
      targetQ.hasCorrectAnswer = targetQ.options.some((o) => o.isCorrect);
      copy[qIndex] = targetQ;
      return copy;
    });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleAddQuestion = () => {
    const newQ: ParsedQuestion = {
      id: `q_new_${Date.now()}`,
      questionNumber: questions.length + 1,
      questionText: "New question prompt",
      marks: 1,
      confidence: 1,
      hasCorrectAnswer: false,
      warning: "No correct answer selected",
      options: [
        { label: "A", text: "Option A", isCorrect: false },
        { label: "B", text: "Option B", isCorrect: false },
        { label: "C", text: "Option C", isCorrect: false },
        { label: "D", text: "Option D", isCorrect: false },
      ],
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleSaveToLms = async () => {
    setSaveError(null);
    if (!title.trim()) {
      setSaveError("Please specify a quiz title.");
      return;
    }
    if (questions.length === 0) {
      setSaveError("Please provide at least one question.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: SaveQuizPayload = {
        title: title.trim(),
        batchId: batchId,
        assessmentType: "MCQ_QUIZ",
        totalMarks: totalMarks,
        dueDate: dueDate ? `${dueDate}T23:59:59` : undefined,
        durationMinutes: durationMinutes,
        questions: questions.map((q, idx) => ({
          questionText: q.questionText.trim(),
          marks: q.marks,
          displayOrder: idx + 1,
          options: q.options.map((opt) => ({
            optionText: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
            correct: Boolean(opt.isCorrect),
          })),
        })),
      };

      await assessmentService.saveQuiz(payload);
      onSaved();
    } catch (err: unknown) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : "Failed to persist quiz into database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-[#2D9F75] border border-emerald-100">
                Teacher Review Studio
              </span>
              <span className="text-xs text-gray-400">• Draft Mode</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-serif mt-1">Review Extracted Quiz</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSaveToLms}
            disabled={isSaving}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#2D9F75] hover:bg-emerald-600 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving to LMS...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Publish to LMS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* Quiz Metadata Config Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50/70 rounded-2xl border border-gray-100">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Quiz Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            placeholder="e.g. Physics A/L MCQ Unit 2"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Target Batch
          </label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
          >
            {batches.length > 0 ? (
              batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.subject ? `• ${b.subject}` : ""}
                </option>
              ))
            ) : (
              <option value="">A/L 2026 Batch A (Default)</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Calendar size={12} /> Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Clock size={12} /> Duration (Mins)
          </label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            min={5}
            max={300}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Review Metrics Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#2D9F75]" />
            <span className="text-sm font-bold text-gray-900">{questions.length}</span>
            <span className="text-xs text-gray-500">Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            <span className="text-sm font-bold text-gray-900">{totalMarks}</span>
            <span className="text-xs text-gray-500">Total Marks</span>
          </div>
        </div>

        {missingAnswerCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100/70 text-amber-800 rounded-xl text-xs font-semibold">
            <AlertTriangle size={15} className="text-amber-600" />
            <span>
              {missingAnswerCount} {missingAnswerCount === 1 ? "question needs" : "questions need"} correct answer selected
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold">
            <CheckCircle2 size={15} className="text-[#2D9F75]" />
            <span>All answers confirmed & ready!</span>
          </div>
        )}
      </div>

      {/* Question Cards List */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          const hasSelectedAnswer = q.options.some((o) => o.isCorrect);

          return (
            <div
              key={q.id || qIndex}
              className={`p-6 rounded-2xl border transition-all ${
                !hasSelectedAnswer
                  ? "border-amber-300 bg-amber-50/20 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-xs">
                    {qIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Question {qIndex + 1}
                  </span>

                  {!hasSelectedAnswer ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertTriangle size={12} /> Please select correct answer
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-[#2D9F75] border border-emerald-200">
                      <CheckCircle2 size={12} /> Answer Identified
                    </span>
                  )}

                  {q.warning && hasSelectedAnswer && (
                    <span className="text-[11px] text-gray-500 italic bg-gray-100 px-2 py-0.5 rounded-md">
                      {q.warning}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>Marks:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={q.marks}
                      onChange={(e) => handleMarksChange(qIndex, parseFloat(e.target.value) || 1)}
                      className="w-14 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-500 text-center"
                    />
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(qIndex)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Question Text Editor */}
              <div className="mb-5">
                <textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => handlePromptChange(qIndex, e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium text-gray-900 resize-none leading-relaxed"
                  placeholder="Enter question prompt..."
                />
              </div>

              {/* Options Section */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Options (Click radio to mark correct answer)
                </div>

                {q.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      opt.isCorrect
                        ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Radio selector */}
                    <button
                      type="button"
                      onClick={() => handleSelectCorrectOption(qIndex, optIndex)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        opt.isCorrect
                          ? "border-[#2D9F75] bg-[#2D9F75]"
                          : "border-gray-300 hover:border-gray-400 bg-white"
                      }`}
                      title={opt.isCorrect ? "Correct answer" : "Mark as correct answer"}
                    >
                      {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
                    </button>

                    {/* Label badge */}
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        opt.isCorrect
                          ? "bg-[#2D9F75] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {opt.label}
                    </span>

                    {/* Editable text */}
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(qIndex, optIndex, e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none px-2 py-1"
                      placeholder={`Option ${opt.label} text`}
                    />

                    {/* Delete option */}
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteOption(qIndex, optIndex)}
                        className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                        title="Delete option"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Option button */}
                <div className="pt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className="text-xs text-[#2D9F75] hover:text-emerald-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <Plus size={14} /> Add Option
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Question Button */}
      <div className="pt-4 flex flex-col items-center">
        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-[#2D9F75] rounded-2xl text-sm font-semibold text-gray-600 hover:text-[#2D9F75] hover:bg-emerald-50/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Another Question
        </button>
      </div>

      {/* Bottom Floating Bar */}
      <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-gray-500">
          Ready to save <strong className="text-gray-800">{questions.length} questions</strong> for{" "}
          <strong className="text-gray-800">{totalMarks} marks</strong> into PostgreSQL database.
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveToLms}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold text-white bg-[#2D9F75] hover:bg-emerald-600 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Publish Quiz to Students</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
