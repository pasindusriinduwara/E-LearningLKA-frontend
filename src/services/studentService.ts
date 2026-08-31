import { fetchApi } from "@/lib/api";
import type { LearningResource, ScheduleItem, StudentInvoice, StudentProfile } from "@/lib/types/student";

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

export async function getUpcomingClasses(): Promise<ScheduleItem[]> {
  return fetchApi<ScheduleItem[]>("/schedules/upcoming");
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