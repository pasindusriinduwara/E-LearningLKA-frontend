"use client";

import { useState, useEffect } from "react";
import { Calendar, Loader2 } from "lucide-react";
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
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        batchId: batchId || undefined as any,
        assessmentType: "ASSIGNMENT",
        totalMarks: parseFloat(totalMarks) || 50,
        dueDate: dueDate ? `${dueDate}T23:59:59` : undefined,
        durationMinutes: 60,
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
      className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">New assignment</h2>

      {errorMsg && (
        <div className="p-3 mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            required
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Batch</label>
          <div className="relative">
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm appearance-none cursor-pointer"
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
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Due Date</label>
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Marks</label>
          <input
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            placeholder="50"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Describe what students should do..."
          rows={3}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
        ></textarea>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2D9F75] hover:bg-emerald-600 disabled:opacity-50 rounded-xl transition-colors shadow-sm flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <span>Publish</span>
          )}
        </button>
      </div>
    </form>
  );
}