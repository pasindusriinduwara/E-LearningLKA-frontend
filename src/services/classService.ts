import { fetchApi } from "@/lib/api";
import {
    type CreateScheduleData,
    type ClassScheduleItem
} from "@/lib/types/class";


/**
 * Creates a new class schedule for a teacher's batch
 * POST /api/v1/teacher/schedules
 */
export function createTeacherSchedule(data: CreateScheduleData) {
    return fetchApi<ClassScheduleItem>("/teacher/schedules", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/**
 * Fetches all scheduled classes for the logged-in teacher
 * GET /api/v1/teacher/schedules
 */
export function getTeacherSchedules() {
    return fetchApi<ClassScheduleItem[]>("/teacher/schedules");
}



/**
 * Updates an existing schedule.
 * PUT /api/v1/teacher/schedules/{id}
 */
export function updateTeacherSchedule(id: string, data: CreateScheduleData) {
    return fetchApi<ClassScheduleItem>(`/teacher/schedules/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/**
 * Soft deletes an existing schedule.
 * DELETE /api/v1/teacher/schedules/{id}
 */
export function deleteTeacherSchedule(id: string) {
    return fetchApi<void>(`/teacher/schedules/${id}`, {
        method: "DELETE",
    });
}

