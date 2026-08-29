"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ClassCard } from "@/components/enrollment/ClassCard";
import {
  getAvailableBatches,
  type AvailableBatch,
} from "@/services/batchService";
import { getMyEnrollmentStatuses } from "@/services/enrollmentService";

export default function EnrollmentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [batches, setBatches] = useState<AvailableBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBatches() {
      try {
        setLoading(true);
        setError("");

        const [data, enrollmentStatuses] = await Promise.all([
          getAvailableBatches(),
          getMyEnrollmentStatuses(),
        ]);

        const statusByBatch = new Map(
          enrollmentStatuses.map((item) => [item.batchId, item.status])
        );

        const batchesWithStatus = data.map((batch) => ({
          ...batch,
          status: statusByBatch.get(batch.id) || batch.status,
        }));

        if (!cancelled) {
          setBatches(batchesWithStatus);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load classes."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBatches();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return batches;
    }

    return batches.filter((batch) =>
      batch.name.toLowerCase().includes(query) ||
      batch.subject.toLowerCase().includes(query) ||
      batch.teacher.toLowerCase().includes(query) ||
      batch.examYear.toLowerCase().includes(query)
    );
  }, [batches, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          Discover
        </p>

        <h1 className="text-4xl font-extrabold text-gray-900 font-serif">
          Enroll in Classes
        </h1>
      </div>

      <div className="relative w-full max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search subjects or teachers..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
        />
      </div>

      {loading && (
        <p className="text-sm text-gray-500">
          Loading classes...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && filteredBatches.length === 0 && (
        <p className="text-sm text-gray-500">
          No classes found.
        </p>
      )}

      {!loading && !error && filteredBatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => (
            <ClassCard
              key={batch.id}
              batch={batch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
