import { fetchApi } from "@/lib/api";

export interface CreateBatchData {
  name: string;
  examYear: string;
  monthlyFee: number;
  deliveryMode: "ONLINE" | "IN_PERSON" | "HYBRID";
  subjectId: string;
}

export interface ScheduleSummary {
  id: string;
  dayOfWeek: string;
  timeText?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  mode?: string;
}

export interface AvailableBatch {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  teacherTitle?: string;
  teacherQualification?: string;
  teacherBio?: string;
  teacherId?: string;
  schedule: string;
  scheduleList?: string[];
  schedules?: ScheduleSummary[];
  status: "AVAILABLE" | "PENDING" | "APPROVED" | "REJECTED";
  examYear: string;
  monthlyFee: number;
  deliveryMode: "ONLINE" | "IN_PERSON" | "HYBRID";
  enrolledCount?: number;
  materialsCount?: number;
  requestId?: string;
}

export function getAvailableBatches() {
  return fetchApi<AvailableBatch[]>("/batches");
}

export async function getBatchById(id: string): Promise<AvailableBatch> {
  try {
    return await fetchApi<AvailableBatch>(`/batches/${id}`);
  } catch (err) {
    const all = await getAvailableBatches();
    const found = all.find((b) => b.id === id);
    if (!found) {
      throw new Error("Class not found");
    }
    return found;
  }
}

export function createNewBatch(data: CreateBatchData) {
  return fetchApi("/batches", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
