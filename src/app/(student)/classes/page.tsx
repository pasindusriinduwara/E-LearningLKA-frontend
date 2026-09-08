"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Sparkles,
  User,
  Video,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import {
  getAvailableBatches,
  type AvailableBatch,
} from "@/services/batchService";
import {
  getMyEnrollmentStatuses,
  type EnrollmentStatus,
} from "@/services/enrollmentService";

export default function StudentClassesPage() {
  const [batches, setBatches] = useState<AvailableBatch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"enrolled" | "pending">("enrolled");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStudentClasses() {
      try {
        setLoading(true);
        setError("");

        const [allBatches, myStatuses] = await Promise.all([
          getAvailableBatches(),
          getMyEnrollmentStatuses(),
        ]);

        const statusMap = new Map<string, EnrollmentStatus>(
          myStatuses.map((item) => [item.batchId, item.status])
        );

        const enrichedBatches = allBatches.map((b) => ({
          ...b,
          status: statusMap.get(b.id) || b.status,
        }));

        if (!cancelled) {
          setBatches(enrichedBatches);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load your enrolled classes."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStudentClasses();

    return () => {
      cancelled = true;
    };
  }, []);

  const enrolledBatches = useMemo(() => {
    return batches.filter((b) => b.status === "APPROVED");
  }, [batches]);

  const pendingBatches = useMemo(() => {
    return batches.filter((b) => b.status === "PENDING");
  }, [batches]);

  const displayedBatches = useMemo(() => {
    const list = activeTab === "enrolled" ? enrolledBatches : pendingBatches;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        b.teacher.toLowerCase().includes(q)
    );
  }, [activeTab, enrolledBatches, pendingBatches, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Title & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <GraduationCap size={14} className="text-[#2D9F75]" />
            My Studies
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-serif">
            My Classes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Access your active classrooms, live sessions, recordings, and learning materials.
          </p>
        </div>

        {/* Button to go to Browse/Enroll page */}
        <Link
          href="/enrollment"
          className="inline-flex items-center justify-center gap-2 bg-[#2D9F75] hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all shrink-0 hover:shadow-md"
        >
          <Plus size={18} />
          <span>Enroll in Classes</span>
        </Link>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("enrolled")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === "enrolled"
                ? "bg-[#F0FDF4] text-[#2D9F75] border border-[#2D9F75]/30 shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span>Enrolled Classes</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTab === "enrolled"
                  ? "bg-[#2D9F75] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {enrolledBatches.length}
            </span>
          </button>

          {pendingBatches.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
                activeTab === "pending"
                  ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span>Pending Approval</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  activeTab === "pending"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {pendingBatches.length}
              </span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search class or teacher..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D9F75]/20 focus:border-[#2D9F75]"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-[#2D9F75] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your enrolled classes...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State when no classes found */}
      {!loading && !error && displayedBatches.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-sm my-8">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#2D9F75] mx-auto mb-4">
            <BookOpen size={28} />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {activeTab === "enrolled"
              ? "No enrolled classes yet"
              : "No pending approval requests"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {activeTab === "enrolled"
              ? "Discover available tuition classes and batches taught by expert teachers to enroll and begin your studies."
              : "You do not have any requests pending teacher approval right now."}
          </p>

          <Link
            href="/enrollment"
            className="inline-flex items-center gap-2 bg-[#2D9F75] hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Sparkles size={16} />
            <span>Browse Classes</span>
          </Link>
        </div>
      )}

      {/* Enrolled / Pending Class Cards Grid */}
      {!loading && !error && displayedBatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBatches.map((batch) => {
            const isApproved = batch.status === "APPROVED";
            const isOnlineOrHybrid =
              batch.deliveryMode === "ONLINE" || batch.deliveryMode === "HYBRID";

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Accent bar */}
                <div
                  className={`h-1.5 w-full ${
                    isApproved ? "bg-[#2D9F75]" : "bg-amber-400"
                  }`}
                />

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Badges: Subject & Delivery Mode */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#2D9F75] border border-emerald-100">
                        {batch.subject || "Subject"}
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          batch.deliveryMode === "ONLINE"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : batch.deliveryMode === "HYBRID"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {batch.deliveryMode || "IN PERSON"}
                      </span>
                    </div>

                    {/* Batch Name */}
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2D9F75] transition-colors leading-snug mb-2">
                      {batch.name}
                    </h3>

                    {/* Class Details list */}
                    <div className="space-y-2 mb-4 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-700">
                          {batch.teacher || "Assigned Teacher"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400 shrink-0" />
                        <span>{batch.schedule || "Schedule announced soon"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 shrink-0" />
                        <span>Exam Year: {batch.examYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Banner / Card Actions */}
                  <div className="pt-4 border-t border-gray-100 space-y-2.5">
                    {isApproved ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/classes/${batch.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-[#2D9F75] hover:bg-emerald-700 text-white shadow-sm transition-all"
                          >
                            <span>Enter Class</span>
                            <ChevronRight size={16} />
                          </Link>

                          {isOnlineOrHybrid && (
                            <a
                              href="https://zoom.us/join"
                              target="_blank"
                              rel="noreferrer"
                              title="Join Zoom Meeting"
                              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors shrink-0"
                            >
                              <Video size={18} />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Enrolled
                          </span>
                          <span>Monthly Fee: LKR {batch.monthlyFee}</span>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-full py-2.5 rounded-xl text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200 text-center flex items-center justify-center gap-2">
                          <Clock size={16} />
                          <span>Pending Teacher Approval</span>
                        </div>
                        <p className="text-[11px] text-center text-gray-400">
                          You will gain full access once your teacher approves.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
