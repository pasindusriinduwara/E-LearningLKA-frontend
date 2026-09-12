"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Award,
  Clock,
  Download,
  ExternalLink,
  Send,
  Loader2,
  Trash2,
  Trophy,
  BookOpen,
  FileCheck,
} from "lucide-react";
import {
  assessmentService,
  StudentQuizTakeResponse,
  QuizSubmissionResult,
} from "@/services/assessmentService";

interface StudentEssaySubmissionModalProps {
  assessmentId: string;
  studentId?: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function StudentEssaySubmissionModal({
  assessmentId,
  studentId,
  onClose,
  onSubmitSuccess,
}: StudentEssaySubmissionModalProps) {
  const [assessment, setAssessment] = useState<StudentQuizTakeResponse | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<QuizSubmissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");

  // Submission inputs
  const [answerText, setAnswerText] = useState("");
  const [paperUploadUrl, setPaperUploadUrl] = useState<string | null>(null);
  const [paperFileName, setPaperFileName] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      assessmentService.getAssessmentForTaking(assessmentId),
      assessmentService.getStudentSubmission(assessmentId, studentId),
    ]).then(([takeRes, subRes]) => {
      if (!isMounted) return;

      if (takeRes.status === "fulfilled") {
        setAssessment(takeRes.value);
        if (takeRes.value.submissionType === "TEXT") {
          setActiveTab("text");
        }
      }

      if (subRes.status === "fulfilled" && subRes.value) {
        setExistingSubmission(subRes.value);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [assessmentId, studentId]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingFile(true);
    setErrorMsg(null);

    try {
      const res = await assessmentService.uploadPaper(file);
      setPaperUploadUrl(res.url);
      setPaperFileName(res.fileName || file.name);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to upload answer paper file");
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

  const handleSubmit = async () => {
    if (!paperUploadUrl && !answerText.trim()) {
      setErrorMsg("Please upload your answer sheet or write your essay before submitting");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await assessmentService.submitEssay(assessmentId, {
        studentId,
        answerText: answerText.trim() || undefined,
        paperUploadUrl: paperUploadUrl || undefined,
        fileName: paperFileName || undefined,
      });

      onSubmitSuccess();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGraded = existingSubmission && existingSubmission.scoreObtained !== null && existingSubmission.grade !== "Submitted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Essay Assignment
              </span>
              {isGraded ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Graded
                </span>
              ) : existingSubmission ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  Submitted • Pending Evaluation
                </span>
              ) : null}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-serif">
              {assessment?.title || "Essay Paper Assignment"}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-slate-400" />
                <span>{assessment?.batchName || "Batch"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Award size={14} className="text-slate-400" />
                <span>{assessment?.totalMarks || 50} Marks</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <Calendar size={14} />
                <span>Due: {assessment?.dueDate ? new Date(assessment.dueDate).toLocaleDateString("en-GB") : "Open"}</span>
              </span>
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
        <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Loading Assignment Details...
              </p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Graded Result Showcase if Graded */}
              {isGraded && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Evaluation Score & Grade
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Assessed by Instructor
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {existingSubmission?.scoreObtained}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            / {assessment?.totalMarks}
                          </span>
                        </span>
                      </div>
                      {existingSubmission?.grade && (
                        <span className="px-3 py-1 rounded-xl text-sm font-black bg-emerald-600 text-white shadow-xs">
                          Grade {existingSubmission.grade}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Feedback Notes */}
                  {existingSubmission?.title && (
                    <div className="mt-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/50 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                        Teacher Feedback:
                      </span>
                      <p className="italic">
                        {existingSubmission?.title || "Submission graded successfully."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Question Paper Download Banner */}
              {assessment?.attachmentUrl && (
                <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Question Paper Document
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Download or view the official paper to complete your answers
                      </p>
                    </div>
                  </div>

                  <a
                    href={assessment.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow"
                  >
                    <Download size={14} />
                    <span>Download Paper</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Teacher's Instructions Callout */}
              {assessment?.instructions && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Instructions & Question Details
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {assessment.instructions}
                  </p>
                </div>
              )}

              {/* Student Submission Workspace */}
              {!isGraded && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Your Answer Submission
                    </h3>

                    {/* Mode Tabs */}
                    {assessment?.submissionType !== "FILE_UPLOAD" && assessment?.submissionType !== "TEXT" && (
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setActiveTab("file")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "file"
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Attach Paper File
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("text")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "text"
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Write Online Answer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tab Content: File Upload */}
                  {(activeTab === "file" || assessment?.submissionType === "FILE_UPLOAD") && (
                    <div>
                      {paperUploadUrl ? (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <FileCheck size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {paperFileName || "Uploaded Answer Paper"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Ready to submit
                                </span>
                                <a
                                  href={paperUploadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-600 hover:underline font-medium"
                                >
                                  Preview upload
                                </a>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPaperUploadUrl(null);
                              setPaperFileName(null);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Remove file"
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
                          className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                            isDragging
                              ? "border-emerald-500 bg-emerald-50/40"
                              : "border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50/50"
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
                              <Loader2 size={30} className="animate-spin text-emerald-600 mb-2" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Uploading your answer sheet...
                              </p>
                              <p className="text-[11px] text-slate-400">Processing file</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-1">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                                <UploadCloud size={24} />
                              </div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Upload your completed answer sheets or PDF
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                Take photos of handwritten work or export as PDF (up to 20MB)
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Content: Written Text */}
                  {(activeTab === "text" || assessment?.submissionType === "TEXT") && (
                    <div>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type your essay answers, calculations, or structured response here..."
                        rows={7}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white text-sm transition-all shadow-xs resize-none"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-1">
                        <span>Characters: {answerText.length}</span>
                        <span>Words: {answerText.trim() ? answerText.trim().split(/\s+/).length : 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isGraded ? "Close" : "Cancel"}
          </button>

          {!isGraded && (
            <button
              type="button"
              disabled={isSubmitting || isUploadingFile || (!paperUploadUrl && !answerText.trim())}
              onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center gap-2 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting Paper...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>{existingSubmission ? "Resubmit Paper" : "Submit Assignment"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
