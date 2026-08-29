"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { BatchGrid } from "@/components/classes/BatchGrid";
import { ScheduleView } from "@/components/classes/SheduleView";
import { CreateBatchForm } from "@/components/classes/CreateBatchForm";

import type { ScheduleBlock } from "@/lib/types/class";
import {
  createNewBatch,
  type CreateBatchData,
} from "@/services/batchService";

import {
  getTeacherBatches,
  getTeacherSchedules,
  type TeacherBatch,
} from "@/services/teacherService";

import {
  getSubjects,
  type SubjectOption,
} from "@/services/subjectService";

export default function MyClassesPage() {
  const router = useRouter();

  const [activeView, setActiveView] =
    useState<"batches" | "schedule">("batches");

  const [isCreating, setIsCreating] = useState(false);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  async function loadData() {
    setPageLoading(true);
    setPageError("");

    try {
      const [batchData, subjectData, scheduleData] =
        await Promise.all([
          getTeacherBatches(),
          getSubjects(),
          getTeacherSchedules(),
        ]);

      setBatches(batchData);
      setSubjects(subjectData);
      setSchedule(scheduleData as ScheduleBlock[]);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to load classes"
      );
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateSubmit(data: CreateBatchData) {
    try {
      await createNewBatch(data);
      await loadData();
      setIsCreating(false);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to create batch"
      );
    }
  }

  function handleBatchSelect(batch: TeacherBatch) {
    router.push(`/teacher/classes/${batch.id}`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Teaching
          </p>

          <h1 className="text-4xl font-extrabold text-gray-900 font-serif">
            My Classes
          </h1>
        </div>

        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="bg-[#2D9F75] hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2"
          >
            <Plus size={18} />
            New batch
          </button>
        )}
      </div>

      {isCreating && (
        <CreateBatchForm
          subjects={subjects}
          onCancel={() => setIsCreating(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      <div className="bg-white inline-flex p-1 rounded-xl shadow-sm border border-gray-100">
        <button
          type="button"
          onClick={() => setActiveView("batches")}
          className={`px-6 py-2 rounded-lg text-sm font-semibold ${
            activeView === "batches"
              ? "bg-[#2D9F75] text-white"
              : "text-gray-500"
          }`}
        >
          Batches
        </button>

        <button
          type="button"
          onClick={() => setActiveView("schedule")}
          className={`px-6 py-2 rounded-lg text-sm font-semibold ${
            activeView === "schedule"
              ? "bg-[#2D9F75] text-white"
              : "text-gray-500"
          }`}
        >
          Schedule
        </button>
      </div>

      {pageLoading && (
        <p className="text-sm text-gray-500">
          Loading classes...
        </p>
      )}

      {pageError && (
        <p className="text-sm text-red-600">{pageError}</p>
      )}

      {!pageLoading && !pageError && (
        <>
          {activeView === "batches" ? (
            batches.length > 0 ? (
              <BatchGrid
                batches={batches}
                subjects={subjects}
                onSelect={handleBatchSelect}
              />
            ) : (
              <p className="text-sm text-gray-500">
                No batches found.
              </p>
            )
          ) : (
            <ScheduleView schedule={schedule} />
          )}
        </>
      )}
    </div>
  );
}