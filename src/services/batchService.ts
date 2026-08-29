import { fetchApi } from "@/lib/api";

export interface CreateBatchData {
  name: string;
  examYear: string;
  monthlyFee: number;
  deliveryMode: "ONLINE" | "IN_PERSON" | "HYBRID";
  subjectId: string;
}

export interface AvailableBatch {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  schedule: string;
  status: "AVAILABLE" | "PENDING" | "APPROVED" | "REJECTED";
  examYear: string;
  monthlyFee: number;
  deliveryMode: "ONLINE" | "IN_PERSON" | "HYBRID";
}

export function getAvailableBatches() {
  return fetchApi<AvailableBatch[]>("/batches");
}

export function createNewBatch(data: CreateBatchData) {
  return fetchApi("/batches", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
