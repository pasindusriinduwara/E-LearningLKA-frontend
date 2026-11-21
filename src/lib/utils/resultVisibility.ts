import type { AssessmentSummary } from "@/services/assessmentService";

export function studentAssessmentStatus(assessment: Pick<AssessmentSummary, "submitted" | "resultPublished">): "To do" | "Awaiting results" | "Graded" {
  if (!assessment.submitted) return "To do";
  return assessment.resultPublished ? "Graded" : "Awaiting results";
}
