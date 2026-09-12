export type AssignmentStatus = "Open" | "Closed" | "Hidden";
export type SubmissionStatus = "Submitted" | "Pending";

export interface Assignment {
  id: string;
  title: string;
  batch: string;
  status: AssignmentStatus;
  submissionsCount: number;
  totalStudents: number;
  dueDate: string;
  hidden?: boolean;
  totalMarks?: number;
  durationMinutes?: number;
  attachmentUrl?: string;
  instructions?: string;
  submissionType?: string;
  type?: string;
}

export interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  submittedAt: string | null;
  status: SubmissionStatus | string;
  marks: number | null;
  totalMarks: number;
  grade: string | null;
  paperUploadUrl?: string;
  answerText?: string;
  feedback?: string;
}