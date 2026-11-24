import { getAvailableBatches } from "@/services/batchService";
import { getMyEnrollmentStatuses, type EnrollmentStatus } from "@/services/enrollmentService";
import { getAnnouncements, getRecentMaterials, getStudentProfile, getUpcomingClasses } from "@/services/studentService";
import { upcomingOccurrences } from "@/lib/schedules";

export async function loadStudentDashboard(now = new Date()) {
  const [schedule, materials, notices, profile, batches, access] = await Promise.allSettled([
    getUpcomingClasses(), getRecentMaterials(), getAnnouncements(), getStudentProfile(), getAvailableBatches(), getMyEnrollmentStatuses(),
  ]);
  const failures: string[] = [];
  const checks = [["Schedule", schedule], ["Materials", materials], ["Announcements", notices], ["Profile", profile], ["Classes", batches], ["Class access", access]] as const;
  checks.forEach(([name, result]) => { if (result.status === "rejected") failures.push(name); });
  const approved = new Set(access.status === "fulfilled" ? access.value.filter(item => item.status === "APPROVED").map(item => item.batchId) : []);
  const allowed = (item: { batchId?: string }) => !!item.batchId && approved.has(item.batchId);
  if (access.status === "rejected") ["Schedule", "Materials", "Announcements", "Classes"].forEach(name => { if (!failures.includes(name)) failures.push(name); });
  const statuses = new Map<string, EnrollmentStatus>(access.status === "fulfilled" ? access.value.map(item => [item.batchId,item.status]) : []);
  return {
    failures,
    classes: schedule.status === "fulfilled" ? upcomingOccurrences(schedule.value.filter(allowed), now) : [],
    resources: materials.status === "fulfilled" ? materials.value.filter(allowed) : [],
    announcements: notices.status === "fulfilled" ? notices.value.filter(allowed) : [],
    profile: profile.status === "fulfilled" ? profile.value : null,
    batches: batches.status === "fulfilled" && access.status === "fulfilled" ? batches.value.map(batch => ({ ...batch,status: statuses.get(batch.id) || batch.status })) : [],
  };
}
