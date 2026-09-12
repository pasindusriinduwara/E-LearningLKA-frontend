"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, Sparkles, Loader2, FileCheck, ArrowRight } from "lucide-react";
import { assessmentService } from "@/services/assessmentService";
import { ParsedQuestion, SAMPLE_EXAM_TEXT } from "@/lib/utils/quizParser";

interface PdfQuizUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsExtracted: (questions: ParsedQuestion[], fileName?: string) => void;
}

export function PdfQuizUploadModal({
  isOpen,
  onClose,
  onQuestionsExtracted,
}: PdfQuizUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".pdf") && !file.type.includes("pdf")) {
        setErrorMsg("Please select a valid PDF file.");
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMsg("Please drop a valid .pdf file.");
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleProcess = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      let questions: ParsedQuestion[] = [];

      if (activeTab === "file") {
        if (!selectedFile) {
          setErrorMsg("Please choose a PDF file first.");
          setIsLoading(false);
          return;
        }
        questions = await assessmentService.parsePdfFile(selectedFile);
      } else {
        if (!pastedText.trim()) {
          setErrorMsg("Please enter or paste exam text.");
          setIsLoading(false);
          return;
        }
        questions = await assessmentService.parseRawText(pastedText);
      }

      if (questions.length === 0) {
        setErrorMsg("Could not detect any questions. Please check the format or paste exam text.");
        setIsLoading(false);
        return;
      }

      onQuestionsExtracted(
        questions,
        selectedFile ? selectedFile.name.replace(/\.pdf$/i, "") : "Imported Quiz"
      );
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to extract questions from PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setActiveTab("text");
    setPastedText(SAMPLE_EXAM_TEXT);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-serif">Convert PDF to LMS Quiz</h2>
              <p className="text-xs text-gray-500">Extracts MCQs, options, and answers for teacher review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100">
          <button
            onClick={() => { setActiveTab("file"); setErrorMsg(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "file"
                ? "border-[#2D9F75] text-[#2D9F75]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <UploadCloud size={16} /> Upload PDF
          </button>
          <button
            onClick={() => { setActiveTab("text"); setErrorMsg(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "text"
                ? "border-[#2D9F75] text-[#2D9F75]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <FileText size={16} /> Paste Quiz Text
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === "file" ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                selectedFile
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#2D9F75] flex items-center justify-center">
                    <FileCheck size={26} />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to convert
                  </p>
                  <span className="inline-block mt-2 text-xs font-semibold text-[#2D9F75] underline">
                    Click to choose a different PDF
                  </span>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Drop your quiz / exam PDF here, or <span className="text-[#2D9F75]">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports standard MCQ exam papers with options (A-D) & answer keys
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Exam / Quiz Text Content
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-[#2D9F75] hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles size={13} /> Load Sample Exam
                </button>
              </div>
              <textarea
                rows={9}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste questions here, for example:&#10;&#10;1. What is the capital of France?&#10;a) London&#10;b) Paris&#10;c) Berlin&#10;d) Madrid&#10;Answer: b"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs font-mono resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Quick Info callout */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
            <span className="text-blue-500 font-bold mt-0.5">ℹ️</span>
            <div>
              <p className="font-semibold text-blue-900">100% Free & Safe Review Workflow</p>
              <p className="text-blue-700 mt-0.5">
                Questions are never published directly. You will be able to review, adjust marks, and pick correct answers in the next step.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900"
          >
            Need an example? Click here
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcess}
              disabled={isLoading || (activeTab === "file" && !selectedFile) || (activeTab === "text" && !pastedText.trim())}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#2D9F75] hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Extracting Questions...</span>
                </>
              ) : (
                <>
                  <span>Extract & Review</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
