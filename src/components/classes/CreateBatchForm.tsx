"use client";

import { useState } from "react";
import { Users } from "lucide-react";

export interface SubjectOption {
  id: string;
  name: string;
}

export interface CreateBatchData {
  name: string;
  examYear: string;
  monthlyFee: number;
  deliveryMode: "ONLINE" | "IN_PERSON" | "HYBRID";
  subjectId: string;
}

interface CreateBatchFormProps {
  onCancel: () => void;
  onSubmit: (data: CreateBatchData) => Promise<void> | void;
  subjects: SubjectOption[];
}

export function CreateBatchForm({
  onCancel,
  onSubmit,
  subjects,
}: CreateBatchFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    examYear: "",
    monthlyFee: "",
    deliveryMode: "IN_PERSON" as CreateBatchData["deliveryMode"],
    subjectId: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof formData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = formData.name.trim();
    const examYear = formData.examYear.trim();
    const monthlyFee = Number(formData.monthlyFee);

    if (!name) {
      setError("Batch name is required.");
      return;
    }

    if (!/^\d{4}$/.test(examYear)) {
      setError("Exam year must contain exactly four digits.");
      return;
    }

    if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
      setError("Monthly fee must be greater than zero.");
      return;
    }

    if (!formData.subjectId) {
      setError("Please select a subject.");
      return;
    }

    try {
      setSubmitting(true);

      await onSubmit({
        name,
        examYear,
        monthlyFee,
        deliveryMode: formData.deliveryMode,
        subjectId: formData.subjectId,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create batch."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 text-[#2D9F75] rounded-xl flex items-center justify-center">
          <Users size={20} />
        </div>

        <h2 className="text-xl font-extrabold text-gray-900 font-serif">
          Create new batch
        </h2>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Batch Name
            </label>

            <input
              type="text"
              required
              value={formData.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. A/L Batch A"
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Exam Year
            </label>

            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={4}
              value={formData.examYear}
              onChange={(event) =>
                updateField(
                  "examYear",
                  event.target.value.replace(/\D/g, "")
                )
              }
              placeholder="e.g. 2027"
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Monthly Fee (LKR)
            </label>

            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={formData.monthlyFee}
              onChange={(event) =>
                updateField("monthlyFee", event.target.value)
              }
              placeholder="e.g. 2500"
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Subject
            </label>

            <select
              required
              value={formData.subjectId}
              onChange={(event) =>
                updateField("subjectId", event.target.value)
              }
              disabled={submitting || subjects.length === 0}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900"
            >
              <option value="">
                {subjects.length === 0
                  ? "No subjects available"
                  : "Select a subject"}
              </option>

              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Delivery Mode
            </label>

            <select
              value={formData.deliveryMode}
              onChange={(event) =>
                updateField(
                  "deliveryMode",
                  event.target.value as CreateBatchData["deliveryMode"]
                )
              }
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900"
            >
              <option value="IN_PERSON">In person</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || subjects.length === 0}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2D9F75] rounded-xl disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}