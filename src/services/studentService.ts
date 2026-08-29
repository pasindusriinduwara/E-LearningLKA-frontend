import { fetchApi } from "@/lib/api";
import type { LearningResource, ScheduleItem, StudentInvoice, StudentProfile } from "@/lib/types/student";

export interface AnnouncementItem {
  id?: string;
  title: string;
  description: string;
  type: string;
  time: string;
}

// 1. Fetch Student Profile
export async function getStudentProfile(studentId = "24081"): Promise<StudentProfile> {
  return fetchApi<StudentProfile>(`/students/profile?studentId=${studentId}`);
}

// 2. Fetch Upcoming Classes
export async function getUpcomingClasses(): Promise<ScheduleItem[]> {
  return fetchApi<ScheduleItem[]>("/schedules/upcoming");
}

// 3. Fetch Recent Learning Materials
export async function getRecentMaterials(): Promise<LearningResource[]> {
  return fetchApi<LearningResource[]>("/materials/recent");
}

// 4. Fetch Student Invoices
export async function getStudentInvoices(): Promise<StudentInvoice[]> {
  return fetchApi<StudentInvoice[]>("/invoices/my-invoices");
}

// 5. Fetch Announcements / Notices
export async function getAnnouncements(): Promise<AnnouncementItem[]> {
  return fetchApi<AnnouncementItem[]>("/announcements");
}
