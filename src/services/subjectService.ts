import { fetchApi } from "@/lib/api";

export interface SubjectOption { id: string; name: string; active?: boolean; }
export function getSubjects() { return fetchApi<SubjectOption[]>("/subjects"); }
export function createSubject(name: string) { return fetchApi<SubjectOption>("/subjects", { method: "POST", body: JSON.stringify({ name }) }); }
