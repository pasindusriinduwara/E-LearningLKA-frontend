import { fetchApi } from "@/lib/api";
import type { TeacherResultDetail, TeacherResultSummary } from "@/lib/types/results";

export const resultService = {
  list: () => fetchApi<TeacherResultSummary[]>("/results"),
  get: (id: string) => fetchApi<TeacherResultDetail>(`/results/${id}`),
  publish: (id: string) => fetchApi<TeacherResultDetail>(`/results/${id}/publish`, { method: "POST" }),
  unpublish: (id: string) => fetchApi<TeacherResultDetail>(`/results/${id}/unpublish`, { method: "POST" }),
};
