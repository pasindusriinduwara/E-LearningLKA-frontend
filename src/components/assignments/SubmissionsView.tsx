import { Eye, EyeOff, Edit3, Trash2 } from "lucide-react";
import type { Assignment, Submission } from "@/lib/types/assignment";

interface SubmissionsViewProps {
  assignment: Assignment;
  submissions: Submission[];
  onToggleHide?: (assignment: Assignment) => void;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
}

export function SubmissionsView({
  assignment,
  submissions,
  onToggleHide,
  onEdit,
  onDelete,
}: SubmissionsViewProps) {
  const isHidden = assignment.hidden || assignment.status === "Hidden";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-bold text-[#2D9F75] uppercase tracking-widest">
              {assignment.batch}
            </p>
            {isHidden && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                <EyeOff size={10} /> Hidden from students
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">
            {assignment.title}
          </h2>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2">
          {onToggleHide && (
            <button
              type="button"
              onClick={() => onToggleHide(assignment)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
                isHidden
                  ? "bg-emerald-50 text-[#2D9F75] border-emerald-200 hover:bg-emerald-100"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{isHidden ? "Unhide" : "Hide"}</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(assignment)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(assignment)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition-colors"
              title="Delete assignment"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center">
            📄
          </div>
          <h3 className="text-sm font-bold text-gray-800">No Submissions Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            When students in this batch complete and submit this assessment, their scores, timestamps, and grade records will appear here automatically.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}