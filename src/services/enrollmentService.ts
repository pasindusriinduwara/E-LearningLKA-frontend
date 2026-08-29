import { fetchApi } from "@/lib/api";

export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BatchEnrollment {
  requestId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
}

export function getBatchEnrollments(batchId: string) {
  return fetchApi<BatchEnrollment[]>(
    `/enrollments/teacher/batches/${batchId}`
  );
}
export interface StudentEnrollmentStatus {
  batchId: string;
  status: EnrollmentStatus;
}

export function getMyEnrollmentStatuses() {
  return fetchApi<StudentEnrollmentStatus[]>("/enrollments/my-status");
}

export interface EnrollmentResponse {
  message: string;
}

export function requestEnrollment(batchId: string) {
  return fetchApi<EnrollmentResponse>("/enrollments/request", {
    method: "POST",
    body: JSON.stringify({
      batchId,
    }),
  });
}
