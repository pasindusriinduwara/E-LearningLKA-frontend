import type { Assignment, Submission } from "@/lib/types/assignment";

interface SubmissionsViewProps {
  assignment: Assignment;
  submissions: Submission[];
}

export function SubmissionsView({ assignment, submissions }: SubmissionsViewProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gray-100">
        <p className="text-[10px] font-bold text-[#2D9F75] uppercase tracking-widest mb-2">
          {assignment.batch}
        </p>
        <h2 className="text-2xl font-bold text-gray-900 font-serif">
          {assignment.title}
        </h2>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              <th className="px-6 py-4 font-bold">Student</th>
              <th className="px-6 py-4 font-bold">Submitted</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Marks</th>
              <th className="px-6 py-4 font-bold">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{sub.studentName}</div>
                  <div className="text-xs text-gray-400">ID {sub.studentId}</div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {sub.submittedAt || <span className="text-gray-300">Not submitted</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    sub.status === "Submitted" 
                      ? "bg-blue-50 text-blue-600" 
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {sub.marks ? (
                    <span className="font-bold text-gray-900">
                      {sub.marks}<span className="text-gray-400 font-normal">/{sub.totalMarks}</span>
                    </span>
                  ) : (
                    <div className="w-10 h-6 border border-gray-200 rounded flex items-center justify-center text-gray-300">
                      —
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {sub.grade ? (
                    <span className={`font-bold ${
                      sub.grade.includes("A") ? "text-emerald-500" : 
                      sub.grade.includes("B") ? "text-green-500" : "text-gray-900"
                    }`}>
                      {sub.grade}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}