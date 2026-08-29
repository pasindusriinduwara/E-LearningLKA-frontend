"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateAssignmentForm } from "@/components/assignments/CreateAssignmentForm";
import { AssignmentListCard } from "@/components/assignments/AssignmentListCard";
import { SubmissionsView } from "@/components/assignments/SubmissionsView";
import type { Assignment, Submission } from "@/lib/types/assignment";

// Mock Data
const mockAssignments: Assignment[] = [
  { id: "1", title: "Integration — Practice Set 3", batch: "A/L Batch B", status: "Open", submissionsCount: 18, totalStudents: 32, dueDate: "29 Aug 2026" },
  { id: "2", title: "Differentiation Problems", batch: "A/L Batch A", status: "Closed", submissionsCount: 24, totalStudents: 24, dueDate: "27 Aug 2026" },
  { id: "3", title: "Algebra Worksheet", batch: "O/L Batch A", status: "Open", submissionsCount: 5, totalStudents: 28, dueDate: "30 Aug 2026" },
];

const mockSubmissions: Submission[] = [
  { id: "s1", studentName: "Sahan Amarasinghe", studentId: "24081", submittedAt: "25 Aug, 9:00 AM", status: "Submitted", marks: null, totalMarks: 50, grade: null },
  { id: "s2", studentName: "Amali Perera", studentId: "24082", submittedAt: "24 Aug, 11:30 PM", status: "Submitted", marks: 38, totalMarks: 50, grade: "A" },
  { id: "s3", studentName: "Kasun Fernando", studentId: "24083", submittedAt: "24 Aug, 8:15 PM", status: "Submitted", marks: 32, totalMarks: 50, grade: "B+" },
  { id: "s4", studentName: "Nimasha Silva", studentId: "24084", submittedAt: "25 Aug, 6:00 AM", status: "Submitted", marks: null, totalMarks: 50, grade: null },
  { id: "s5", studentName: "Tharaka Jayasinghe", studentId: "24085", submittedAt: null, status: "Pending", marks: null, totalMarks: 50, grade: null },
  { id: "s6", studentName: "Sanduni Rathnayake", studentId: "24086", submittedAt: "23 Aug, 4:00 PM", status: "Submitted", marks: 45, totalMarks: 50, grade: "A+" },
];

export default function AssignmentsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>("1");

  const activeAssignment = mockAssignments.find(a => a.id === activeAssignmentId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Assessments</p>
          <h1 className="text-4xl font-extrabold text-gray-900 font-serif">Assignments</h1>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#2D9F75] hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={18} /> Create assignment
          </button>
        )}
      </div>

      {/* Conditional Create Form */}
      {isCreating && (
        <CreateAssignmentForm onCancel={() => setIsCreating(false)} />
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assignment List */}
        <div className="space-y-4">
          {mockAssignments.map((assignment) => (
            <AssignmentListCard 
              key={assignment.id}
              assignment={assignment}
              isActive={assignment.id === activeAssignmentId}
              onClick={() => setActiveAssignmentId(assignment.id)}
            />
          ))}
        </div>

        {/* Right Column: Submissions View */}
        <div className="lg:col-span-2">
          {activeAssignment && (
            <SubmissionsView 
              assignment={activeAssignment} 
              submissions={mockSubmissions} 
            />
          )}
        </div>
      </div>
    </div>
  );
}