import { FileText, Clock } from "lucide-react";
import type { Assignment } from "@/lib/types/assignment";

interface AssignmentListCardProps {
  assignment: Assignment;
  isActive: boolean;
  onClick: () => void;
}

export function AssignmentListCard({ assignment, isActive, onClick }: AssignmentListCardProps) {
  const progressPercent = (assignment.submissionsCount / assignment.totalStudents) * 100;
  
  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl p-5 cursor-pointer transition-all border ${
        isActive 
          ? "border-[#2D9F75] bg-emerald-50/30 shadow-sm" 
          : "border-gray-100 bg-white hover:border-emerald-200 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-emerald-100 text-[#2D9F75]" : "bg-gray-50 text-emerald-400"}`}>
          <FileText size={16} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          assignment.status === "Open" 
            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
            : "bg-gray-50 text-gray-500 border-gray-200"
        }`}>
          {assignment.status}
        </span>
      </div>

      <h3 className="text-sm font-bold text-gray-900 mb-1">{assignment.title}</h3>
      <p className="text-xs text-gray-400 mb-4">{assignment.batch}</p>

      <div>
        <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
          <span>Submissions</span>
          <span>{assignment.submissionsCount}/{assignment.totalStudents}</span>
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