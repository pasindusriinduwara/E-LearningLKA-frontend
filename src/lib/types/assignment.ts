export type AssignmentStatus = "Open" | "Closed";
export type SubmissionStatus = "Submitted" | "Pending";

export interface Assignment {
  id: string;
  title: string;
  batch: string;
  status: AssignmentStatus;
  submissionsCount: number;
  totalStudents: number;
  dueDate: string;
}

export interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  submittedAt: string | null;
  status: SubmissionStatus;
  marks: number | null;
  totalMarks: number;
  grade: string | null;
}