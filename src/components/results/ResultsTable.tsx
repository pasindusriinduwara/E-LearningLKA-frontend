import type { StudentResult } from "@/lib/types/results";

export function ResultsTable({ results }: { results: StudentResult[] }) {
  const getGradeStyles = (grade: string) => {
    if (grade.includes("A")) return "text-emerald-600 bg-emerald-50";
    if (grade.includes("B")) return "text-blue-600 bg-blue-50";
    if (grade.includes("C")) return "text-amber-600 bg-amber-50";
    return "text-gray-600 bg-gray-50";
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return "text-[#2D9F75]";
    return "text-gray-400";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              <th className="px-6 py-5">Rank</th>
              <th className="px-6 py-5">Student</th>
              <th className="px-6 py-5">Term 1</th>
              <th className="px-6 py-5">Term 2</th>
              <th className="px-6 py-5">Assignment</th>
              <th className="px-6 py-5">Total</th>
              <th className="px-6 py-5">Grade</th>
              <th className="px-6 py-5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {results.map((result) => (
              <tr key={result.id} className="hover:bg-gray-50/50 transition-colors">
                
                <td className="px-6 py-4">
                  <span className={`font-bold font-serif text-lg ${getRankColor(result.rank)}`}>
                    #{result.rank}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{result.studentName}</div>
                  <div className="text-xs text-gray-400">ID {result.studentId}</div>
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {result.term1}<span className="text-gray-400 text-xs">/100</span>
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {result.term2}<span className="text-gray-400 text-xs">/100</span>
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {result.assignment}<span className="text-gray-400 text-xs">/50 +proj</span>
                </td>

                <td className="px-6 py-4">
                  <span className="font-extrabold text-gray-900 text-base">{result.total}</span>
                </td>

                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${getGradeStyles(result.grade)}`}>
                    {result.grade}
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-bold text-[#2D9F75] hover:text-emerald-700 transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}