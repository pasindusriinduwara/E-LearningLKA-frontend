import { fetchApi } from "@/lib/api";

export interface TeacherProfile {
  id: string;
  userId: string;
  title: string;
  name: string;
  qualification?: string;
  bio?: string;
}

export interface TeacherDashboardSummary {
  activeBatches: number;
  totalStudents: number;
  scheduledClasses: number;
  uploadedMaterials: number;
}

export interface TeacherBatch {
  id: string;
  instituteId?: string;
  subjectId: string;
  teacherId: string;
  name: string;
  examYear: string;
  monthlyFee: number;
  deliveryMode: string;
  active: boolean;
}

export interface BatchEnrollment {
  requestId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
}

export interface TeacherMaterial {
  id: string;
  batchId: string;
  title: string;
  subject?: string;
  type?: string;
  time?: string;
  size?: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
}

export interface MaterialUploadResponse {
  id: string;
  batchId: string;
  title: string;
  type: string;
  fileUrl: string;
}

export function getTeacherProfile() {
  return fetchApi<TeacherProfile>("/teacher/profile");
}

export function getTeacherDashboard() {
  return fetchApi<TeacherDashboardSummary>("/teacher/dashboard");
}

export function getTeacherBatches() {
  return fetchApi<TeacherBatch[]>("/teacher/batches");
}

export function getTeacherSchedules() {
  return fetchApi("/teacher/schedules");
}

export function getTeacherStudents() {
  return fetchApi("/teacher/students");
}

export function getTeacherMaterials() {
  return fetchApi<TeacherMaterial[]>("/teacher/materials");
}

export function getTeacherAnnouncements() {
  return fetchApi("/teacher/announcements");
}

export function getBatchEnrollments(batchId: string) {
  return fetchApi<BatchEnrollment[]>(
    `/enrollments/teacher/batches/${batchId}`
  );
}

export function approveEnrollment(requestId: string) {
  return fetchApi<{ message: string }>(
    `/enrollments/teacher/requests/${requestId}/approve`,
    {
      method: "PUT",
    }
  );
}

export function rejectEnrollment(requestId: string) {
  return fetchApi<{ message: string }>(
    `/enrollments/teacher/requests/${requestId}/reject`,
    {
      method: "PUT",
    }
  );
}

/**
 * Upload a learning material for a teacher batch.
 */
export function uploadTeacherMaterial(data: {
  batchId: string;
  title: string;
  subject?: string;
  file: File;
}) {
  const formData = new FormData();

  formData.append("batchId", data.batchId);
  formData.append("title", data.title);

  if (data.subject?.trim()) {
    formData.append("subject", data.subject.trim());
  }

  formData.append("file", data.file);

  return fetchApi<MaterialUploadResponse>(
    "/teacher/materials/upload",
    {
      method: "POST",
      body: formData,
    }
  );
}