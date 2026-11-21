import { FileText, Clock, EyeOff, Eye, Trash2 } from "lucide-react";
import type { Assignment } from "@/lib/types/assignment";

interface AssignmentListCardProps {
  assignment: Assignment;
  isActive: boolean;
  onClick: () => void;
  onToggleHide?: (assignment: Assignment, e: React.MouseEvent) => void;
  onDelete?: (assignment: Assignment, e: React.MouseEvent) => void;
}

export function AssignmentListCard({
  assignment,
  isActive,
  onClick,
  onToggleHide,
  onDelete,
}: AssignmentListCardProps) {
  const progressPercent =
    assignment.totalStudents > 0
      ? (assignment.submissionsCount / assignment.totalStudents) * 100
      : 0;

  const isHidden = assignment.hidden || assignment.status === "Hidden";

  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl p-5 cursor-pointer transition-all border relative ${
        isActive
          ? "border-[#2D9F75] bg-emerald-50/30 shadow-sm"
          : "border-gray-100 bg-white hover:border-emerald-200 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isActive
              ? "bg-emerald-100 text-[#2D9F75]"
              : "bg-gray-50 text-emerald-400"
          }`}
        >
          <FileText size={16} />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Status Badge */}
          {isHidden ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
              <EyeOff size={10} /> Hidden
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                assignment.status === "Open"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              {assignment.status}
            </span>
          )}

          {/* Quick Action Buttons */}
          {onToggleHide && (
            <button
              type="button"
              onClick={(e) => onToggleHide(assignment, e)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
              title={isHidden ? "Unhide for students" : "Hide from students"}
            >
              {isHidden ? <Eye size={13} className="text-[#2D9F75]" /> : <EyeOff size={13} />}
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => onDelete(assignment, e)}
              className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete assignment"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{assignment.title}</h3>
      <p className="text-xs text-gray-400 mb-3">{assignment.batch}</p>

      <div>
        <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
          <span>Submissions</span>
          <span>
            {assignment.submissionsCount}/{assignment.totalStudents}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-[#2D9F75] rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <Clock size={12} />
          Due {assignment.dueDate}
        </div>
      </div>
    </div>
  );
}