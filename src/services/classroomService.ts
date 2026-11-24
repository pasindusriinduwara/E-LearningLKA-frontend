import { getBatchById } from "@/services/batchService";
import { assessmentService } from "@/services/assessmentService";
import { getBatchAnnouncements, getBatchMaterials, getBatchSchedules } from "@/services/studentService";

export async function getApprovedClassroomBatch(batchId: string) {
  const batch = await getBatchById(batchId);
  if (batch.status !== "APPROVED") {
    throw new Error(batch.status === "PENDING"
      ? "Your teacher must approve your request before you can access this class."
      : "You do not have access to this class. Please contact your teacher to allow access.");
  }
  return batch;
}

export async function getStudentClassroom(batchId: string, studentId?: string) {
  // Check current access before requesting any classroom content.
  const batch = await getApprovedClassroomBatch(batchId);
  const [materials, announcements, schedules, assessments] = await Promise.all([
    getBatchMaterials(batchId),
    getBatchAnnouncements(batchId),
    getBatchSchedules(batchId),
    assessmentService.getBatchAssessments(batchId, studentId),
  ]);
  return { batch, materials, announcements, schedules, assessments };
}
