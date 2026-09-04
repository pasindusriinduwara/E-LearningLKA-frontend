"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock3,
  Wallet,
  Monitor,
  Users,
  X,
} from "lucide-react";

import {
  approveEnrollment,
  getBatchEnrollments,
  getTeacherBatches,
  rejectEnrollment,
  type BatchEnrollment,
  type TeacherBatch,
} from "@/services/teacherService";

import {
  getSubjects,
  type SubjectOption,
} from "@/services/subjectService";

type Tab = "enrolled" | "requests";

export default function BatchDetailsPage() {
  const router = useRouter();
  const params = useParams<{ batchId: string }>();
  const batchId = params.batchId;

  const [batch, setBatch] = useState<TeacherBatch | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [enrollments, setEnrollments] = useState<BatchEnrollment[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("enrolled");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const subjectName = useMemo(() => {
    if (!batch) return "Unknown subject";

    return (
      subjects.find((subject) => subject.id === batch.subjectId)
        ?.name ?? "Unknown subject"
    );
  }, [batch, subjects]);

  const enrolledStudents = enrollments.filter(
    (item) => item.status === "APPROVED"
  );

  const pendingRequests = enrollments.filter(
    (item) => item.status === "PENDING"
  );

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      const [batchList, subjectList, enrollmentList] =
        await Promise.all([
          getTeacherBatches(),
          getSubjects(),
          getBatchEnrollments(batchId),
        ]);

      const selected = batchList.find(
        (item) => item.id === batchId
      );

      if (!selected) {
        throw new Error("Batch not found");
      }

      setBatch(selected);
      setSubjects(subjectList);
      setEnrollments(enrollmentList);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load batch details"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (batchId) {
      loadPage();
    }
  }, [batchId]);

  async function handleApprove(requestId: string) {
    setActionId(requestId);
    setError("");

    try {
      await approveEnrollment(requestId);
      await loadPage();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to approve request"
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(requestId: string) {
    setActionId(requestId);
    setError("");

    try {
      await rejectEnrollment(requestId);
      await loadPage();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to reject request"
      );
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-sm text-gray-500">
          Loading batch details...
        </p>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!batch) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button
          type="button"
          onClick={() => router.back()}
          className="hover:text-gray-800"
        >
          Teacher portal
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => router.back()}
          className="hover:text-gray-800"
        >
          My classes
        </button>
        <span>/</span>
        <span className="text-gray-800">{batch.name}</span>
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={18} />
        Back to classes
      </button>

      <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-[#2D9F75]">
              Batch details
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-gray-900 font-serif">
              {batch.name}
            </h1>

            <p className="mt-2 text-gray-500">{subjectName}</p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${batch.active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-gray-100 text-gray-500"
              }`}
          >
            {batch.active ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoItem
            icon={<Clock3 size={18} />}
            label="Exam year"
            value={batch.examYear}
          />

          <InfoItem
            icon={<Wallet size={18} />}
            label="Monthly fee"
            value={`LKR ${batch.monthlyFee}`}
          />

          <InfoItem
            icon={<Monitor size={18} />}
            label="Delivery mode"
            value={batch.deliveryMode}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard
          icon={<Users size={21} />}
          label="Enrolled students"
          value={enrolledStudents.length}
          color="emerald"
        />

        <SummaryCard
          icon={<Clock3 size={21} />}
          label="Pending requests"
          value={pendingRequests.length}
          color="amber"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <section className="bg-white rounded-2xl border border-gray-100">
        <div className="border-b border-gray-100 px-5 pt-5">
          <div className="flex gap-6">
            <TabButton
              active={activeTab === "enrolled"}
              onClick={() => setActiveTab("enrolled")}
            >
              Enrolled Students
            </TabButton>

            <TabButton
              active={activeTab === "requests"}
              onClick={() => setActiveTab("requests")}
            >
              Enrollment Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                  {pendingRequests.length}
                </span>
              )}
            </TabButton>
          </div>
        </div>

        <div className="p-5">
          {activeTab === "enrolled" ? (
            enrolledStudents.length === 0 ? (
              <EmptyState text="No enrolled students found." />
            ) : (
              <div className="space-y-3">
                {enrolledStudents.map((student) => (
                  <StudentRow
                    key={student.requestId}
                    student={student}
                    status="APPROVED"
                  />
                ))}
              </div>
            )
          ) : pendingRequests.length === 0 ? (
            <EmptyState text="No pending enrollment requests." />
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.requestId}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-gray-100 p-4"
                >
                  <StudentRow
                    student={request}
                    status="PENDING"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionId === request.requestId}
                      onClick={() =>
                        handleReject(request.requestId)
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                    >
                      <X size={15} />
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={actionId === request.requestId}
                      onClick={() =>
                        handleApprove(request.requestId)
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-[#2D9F75] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <Check size={15} />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-[#2D9F75]">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
          {label}
        </span>
      </div>
      <p className="mt-2 font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "emerald" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${color === "emerald"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-amber-50 text-amber-600"
          }`}
      >
        {icon}
      </div>

      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 pb-3 text-sm font-semibold ${active
        ? "border-[#2D9F75] text-[#2D9F75]"
        : "border-transparent text-gray-400"
        }`}
    >
      {children}
    </button>
  );
}

function StudentRow({
  student,
  status,
}: {
  student: BatchEnrollment;
  status: "APPROVED" | "PENDING";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-bold text-[#2D9F75]">
        {student.studentName.charAt(0).toUpperCase()}
      </div>

      <div>
        <p className="font-semibold text-gray-900">
          {student.studentName}
        </p>

        <p className="text-xs text-gray-500">
          Student ID: {student.studentNumber}
        </p>

        <p className="text-xs text-gray-400">
          Requested:{" "}
          {new Date(student.requestedAt).toLocaleString()}
        </p>
      </div>

      <span
        className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${status === "APPROVED"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-amber-50 text-amber-600"
          }`}
      >
        {status}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}