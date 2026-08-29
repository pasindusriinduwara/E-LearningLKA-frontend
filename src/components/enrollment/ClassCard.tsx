"use client";

import { useState } from "react";
import { Clock, User } from "lucide-react";
import { requestEnrollment } from "@/services/enrollmentService";
import type { AvailableBatch } from "@/services/batchService";

export function ClassCard({
  batch,
}: {
  batch: AvailableBatch;
}) {
  const [status, setStatus] = useState(batch.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEnroll() {
    setError("");
    setLoading(true);

    try {
      await requestEnrollment(batch.id);
      setStatus("PENDING");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Enrollment request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900">
          {batch.name}
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          {batch.subject}
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-xs text-gray-600 gap-2">
            <User size={14} className="text-gray-400" />
            {batch.teacher}
          </div>

          <div className="flex items-center text-xs text-gray-600 gap-2">
            <Clock size={14} className="text-gray-400" />
            {batch.schedule}
          </div>

          <p className="text-xs text-gray-500">
            Exam year: {batch.examYear}
          </p>

          <p className="text-xs text-gray-500">
            Monthly fee: LKR {batch.monthlyFee}
          </p>

          <p className="text-xs text-gray-500">
            Delivery mode: {batch.deliveryMode}
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-600">
          {error}
        </p>
      )}

      {status === "PENDING" ? (
        <button
          disabled
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-amber-50 text-amber-600 border border-amber-100"
        >
          Pending Approval
        </button>
      ) : status === "APPROVED" ? (
        <button disabled className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
          Enrolled
        </button>
      ) : status === "REJECTED" ? (
        <button onClick={handleEnroll} disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
          {loading ? "Processing..." : "Request Again"}
        </button>
      ) : (
        <button
          onClick={handleEnroll}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {loading ? "Processing..." : "Enroll Now"}
        </button>
      )}
    </div>
  );
}
