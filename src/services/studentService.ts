import type { ClassScheduleItem } from "@/lib/types/class";
import type { ScheduleDefinition } from "@/lib/schedules";
import { fetchApi } from "@/lib/api";
import type { LearningResource, StudentProfile, UpdateStudentProfilePayload } from "@/lib/types/student";

export interface AnnouncementItem {
  id?: string;
  batchId?: string;
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

export async function getUpcomingClasses(): Promise<ScheduleDefinition[]> {
  return fetchApi<ScheduleDefinition[]>("/schedules/upcoming");
}

export async function getBatchSchedules(batchId: string): Promise<ClassScheduleItem[]> {
  return fetchApi<ClassScheduleItem[]>(`/schedules/batch/${batchId}`);
}

export async function getRecentMaterials(): Promise<LearningResource[]> {
  return fetchApi<LearningResource[]>("/materials/recent");
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