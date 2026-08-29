import { TrendingUp } from "lucide-react";
import type { ResultStatsData } from "@/lib/types/results";

export function ResultStats({ stats }: { stats: ResultStatsData }) {
  const statCards = [
    { label: "Class average", value: stats.classAverage, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Highest score", value: stats.highestScore, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Pass rate", value: stats.passRate, color: "text-green-500", bg: "bg-green-50" },
    { label: "Students ranked", value: stats.studentsRanked.toString(), color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${stat.bg}`}>
            <TrendingUp size={20} className={stat.color} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-extrabold text-gray-900 font-serif">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}