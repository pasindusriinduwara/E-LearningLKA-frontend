"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ResultStats } from "@/components/results/ResultStats";
import { ResultsTable } from "@/components/results/ResultsTable";
import type { StudentResult, ResultStatsData } from "@/lib/types/result";

const BATCHES = ["A/L Batch A", "A/L Batch B", "A/L Batch C", "O/L Batch A"];

const mockStats: ResultStatsData = {
  classAverage: "189/300",
  highestScore: "223/300",
  passRate: "100%",
  studentsRanked: 6,
};

const mockResults: StudentResult[] = [
  { id: "1", rank: 1, studentName: "Sanduni Rathnayake", studentId: "24086", term1: 87, term2: 91, assignment: 45, total: 223, grade: "A+" },
  { id: "2", rank: 2, studentName: "Nimasha Silva", studentId: "24084", term1: 82, term2: 85, assignment: 43, total: 210, grade: "A" },
  { id: "3", rank: 3, studentName: "Sahan Amarasinghe", studentId: "24081", term1: 78, term2: 80, assignment: 38, total: 196, grade: "B+" },
  { id: "4", rank: 4, studentName: "Amali Perera", studentId: "24082", term1: 72, term2: 76, assignment: 38, total: 186, grade: "B" },
];

export default function ResultsPage() {
  const [activeBatch, setActiveBatch] = useState("A/L Batch B");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Academic Performance</p>
          <h1 className="text-4xl font-extrabold text-gray-900 font-serif">Results</h1>
        </div>
        <button className="bg-[#2D9F75] hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
          <Plus size={18} /> Publish results
        </button>
      </div>

      {/* Stats Cards */}
      <ResultStats stats={mockStats} />

      {/* Batch Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {BATCHES.map((batch) => (
          <button
            key={batch}
            onClick={() => setActiveBatch(batch)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${
              activeBatch === batch
                ? "bg-[#2D9F75] text-white border-[#2D9F75]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm"
            }`}
          >
            {batch}
          </button>
        ))}
      </div>

      {/* Results Table */}
      <ResultsTable results={mockResults} />
    </div>
  );
}