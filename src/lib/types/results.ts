import type { Submission } from "./assignment";

export type StudentResult = Submission;
export interface ResultStatsData { classAverage: string; highestScore: string; passRate: string; studentsRanked: number; }
export interface TeacherResultSummary {
  id: string; batchId: string; batchName: string; title: string; assessmentType: string;
  totalMarks: number; submittedCount: number; gradedCount: number; publishedCount: number; enrolledCount: number;
  average: number | null; highest: number | null; passRate: number | null; lastPublishedAt: string | null;
}
export interface TeacherResultDetail { assessment: TeacherResultSummary; submissions: Submission[]; }
