import { fetchApi } from "@/lib/api";
import type { LearningResource, ScheduleItem, StudentInvoice, StudentProfile, UpdateStudentProfilePayload } from "@/lib/types/student";

export interface AnnouncementItem {
  id?: string;
  title: string;
  description: string;
  type: string;
  time: string;
}

export async function getStudentProfile(): Promise<StudentProfile> {
  return fetchApi<StudentProfile>("/students/profile");
}

export async function updateStudentProfile(payload: UpdateStudentProfilePayload): Promise<StudentProfile> {
  return fetchApi<StudentProfile>("/students/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getUpcomingClasses(): Promise<ScheduleItem[]> {
  return fetchApi<ScheduleItem[]>("/schedules/upcoming");
}

export async function getBatchSchedules(batchId: string): Promise<any[]> {
  return fetchApi<any[]>(`/schedules/batch/${batchId}`);
}

export async function getRecentMaterials(): Promise<LearningResource[]> {
  return fetchApi<LearningResource[]>("/materials/recent");
}

export async function getStudentInvoices(): Promise<StudentInvoice[]> {
  return fetchApi<StudentInvoice[]>("/invoices/my-invoices");
}

export async function getAnnouncements(): Promise<AnnouncementItem[]> {
  return fetchApi<AnnouncementItem[]>("/announcements");
}

export async function getBatchMaterials(batchId: string): Promise<LearningResource[]> {
  return fetchApi<LearningResource[]>(`/materials/batch/${batchId}`);
}

export async function getBatchAnnouncements(batchId: string): Promise<AnnouncementItem[]> {
  return fetchApi<AnnouncementItem[]>(`/announcements/batch/${batchId}`);
}