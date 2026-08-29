export type ClassMode = "Online" | "In person" | "Hybrid";

export interface Batch {
  id: string;
  name: string;
  subject: string;
  medium: string;
  scheduleStr: string;
  mode: ClassMode;
  currentEnrollment: number;
  maxEnrollment: number;
  startDate: string;
}

export interface ScheduleBlock {
  id: string;
  day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  time: string;
  batchName: string;
  subject: string;
}