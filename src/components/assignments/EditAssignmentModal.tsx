"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, Award, EyeOff, Eye, Loader2, Save } from "lucide-react";
import { Assignment } from "@/lib/types/assignment";
import { assessmentService } from "@/services/assessmentService";

interface EditAssignmentModalProps {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditAssignmentModal({
  assignment,
  isOpen,
  onClose,
  onUpdated,
}: EditAssignmentModalProps) {
  const [title, setTitle] = useState(assignment.title);
  const [totalMarks, setTotalMarks] = useState(String(assignment.totalMarks || 100));
  const [durationMinutes, setDurationMinutes] = useState(String(assignment.durationMinutes || 60));
  const [dueDate, setDueDate] = useState(() => {
    try {
      const parsed = new Date(assignment.dueDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
    } catch {}
    return "";
  });
  const [isHidden, setIsHidden] = useState(Boolean(assignment.hidden));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please provide a title");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      await assessmentService.updateAssessment(assignment.id, {
        title: title.trim(),
        totalMarks: parseFloat(totalMarks) || 100,
        durationMinutes: parseInt(durationMinutes, 10) || 60,
        dueDate: dueDate ? `${dueDate}T23:59:59` : undefined,
        hidden: isHidden,
      });

      onUpdated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to update assessment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-serif">Edit Assessment</h2>
            <p className="text-xs text-gray-500">Update details or visibility for students</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Award size={12} /> Total Marks
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                min={1}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Clock size={12} /> Duration (Mins)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min={5}
                max={300}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Visibility toggle box */}
          <div
            onClick={() => setIsHidden(!isHidden)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              isHidden
                ? "bg-amber-50/60 border-amber-300"
                : "bg-emerald-50/50 border-emerald-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isHidden ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-[#2D9F75]"
                }`}
              >
                {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {isHidden ? "Hidden from Students" : "Visible to Students"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {isHidden
                    ? "Students cannot see or attempt this assessment"
                    : "Published and accessible to all enrolled students"}
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={isHidden}
              onChange={() => setIsHidden(!isHidden)}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#2D9F75] hover:bg-emerald-600 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
