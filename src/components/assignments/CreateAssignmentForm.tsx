"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Loader2,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  Clock,
  Award,
  BookOpen,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { assessmentService } from "@/services/assessmentService";

interface BatchItem {
  id: string;
  name: string;
  subject?: string;
}

interface CreateAssignmentFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export function CreateAssignmentForm({ onCancel, onSuccess }: CreateAssignmentFormProps) {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [title, setTitle] = useState("");
  const [batchId, setBatchId] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [totalMarks, setTotalMarks] = useState("50");
  const [durationMinutes, setDurationMinutes] = useState("120");
  const [instructions, setInstructions] = useState("");
  const [submissionType, setSubmissionType] = useState<"BOTH" | "FILE_UPLOAD" | "TEXT">("BOTH");

  // Paper Attachment State
  const [paperFileUrl, setPaperFileUrl] = useState<string | null>(null);
  const [paperFileName, setPaperFileName] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingFile(true);
    setErrorMsg(null);

    try {
      const res = await assessmentService.uploadPaper(file);
      setPaperFileUrl(res.url);
      setPaperFileName(res.fileName || file.name);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to upload question paper file");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter an assignment title");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await assessmentService.saveQuiz({
        title: title.trim(),
        batchId: batchId || (undefined as any),
        assessmentType: "ESSAY",
        totalMarks: parseFloat(totalMarks) || 50,
        dueDate: dueDate ? `${dueDate}T23:59:59` : undefined,
        durationMinutes: parseInt(durationMinutes) || 120,
        attachmentUrl: paperFileUrl || undefined,
        instructions: instructions.trim() || undefined,
        submissionType: submissionType,
        questions: [
          {
            questionText: instructions.trim() || title.trim(),
            marks: parseFloat(totalMarks) || 50,
            displayOrder: 1,
            options: [],
          },
        ],
      });

      if (onSuccess) {
        onSuccess();
      } else {
        onCancel();
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-md border border-slate-100 dark:border-slate-800 mb-8 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Essay & Paper Assignment
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-serif">
            New Essay Paper Assignment
          </h2>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Paper Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2026 Combined Maths Essay Paper 01"
            required
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm transition-all shadow-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Target Batch
          </label>
          <div className="relative">
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm appearance-none cursor-pointer transition-all shadow-xs"
            >
              {batches.length > 0 ? (
                batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.subject ? `(${b.subject})` : ""}
                  </option>
                ))
              ) : (
                <option value="">A/L 2026 Batch A (Default)</option>
              )}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Submission Deadline
          </label>
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm transition-all shadow-xs"
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Total Marks
            </label>
            <div className="relative">
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="50"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm transition-all shadow-xs"
              />
              <Award className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Allocated Time (Mins)
            </label>
            <div className="relative">
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="120"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm transition-all shadow-xs"
              />
              <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Question Paper File Dropzone (PDF / DOCX) */}
      <div className="mb-6">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Question Paper Document (PDF / Scanned Paper)
        </label>

        {paperFileUrl ? (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <FileCheck size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {paperFileName || "Attached Question Paper"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Ready for students to download
                  </span>
                  <a
                    href={paperFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Preview document
                  </a>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPaperFileUrl(null);
                setPaperFileName(null);
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              title="Remove document"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {isUploadingFile ? (
              <div className="flex flex-col items-center justify-center py-2">
                <Loader2 size={32} className="animate-spin text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Uploading Question Paper...
                </p>
                <p className="text-[11px] text-slate-400">Storing paper securely on server</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Drop your Question Paper PDF or click to browse
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, Word Documents, and High-Resolution Scans (up to 20MB)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Format Options */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Student Submission Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              submissionType === "BOTH"
                ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-xs ring-2 ring-emerald-500/10"
                : "bg-transparent border-slate-200 dark:border-slate-700 hover:bg-white/50"
            }`}
          >
            <input
              type="radio"
              name="submissionType"
              checked={submissionType === "BOTH"}
              onChange={() => setSubmissionType("BOTH")}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Both Modes</p>
              <p className="text-[10px] text-slate-400">Online Text or Paper Upload</p>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              submissionType === "FILE_UPLOAD"
                ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-xs ring-2 ring-emerald-500/10"
                : "bg-transparent border-slate-200 dark:border-slate-700 hover:bg-white/50"
            }`}
          >
            <input
              type="radio"
              name="submissionType"
              checked={submissionType === "FILE_UPLOAD"}
              onChange={() => setSubmissionType("FILE_UPLOAD")}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">File Upload Only</p>
              <p className="text-[10px] text-slate-400">Scanned PDFs / Worksheets</p>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              submissionType === "TEXT"
                ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-xs ring-2 ring-emerald-500/10"
                : "bg-transparent border-slate-200 dark:border-slate-700 hover:bg-white/50"
            }`}
          >
            <input
              type="radio"
              name="submissionType"
              checked={submissionType === "TEXT"}
              onChange={() => setSubmissionType("TEXT")}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Online Text Only</p>
              <p className="text-[10px] text-slate-400">Typed essay answers</p>
            </div>
          </label>
        </div>
      </div>

      {/* Instructions & Guidelines */}
      <div className="mb-8">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Instructions & Question Guidelines
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter question prompts, step-by-step instructions, or grading criteria for students..."
          rows={4}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm transition-all resize-none shadow-xs"
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploadingFile}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 active:scale-98"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Publishing Paper...</span>
            </>
          ) : (
            <span>Publish Assignment</span>
          )}
        </button>
      </div>
    </form>
  );
}