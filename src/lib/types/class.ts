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

export type DeliveryMode = "ONLINE" | "IN_PERSON" | "HYBRID";
export type RepeatInterval = "ONCE" | "WEEKLY" | "BI_WEEKLY";

// Payload sent to backend when scheduling a class
export interface CreateScheduleData {
  batchId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  mode: DeliveryMode;
  repeat: RepeatInterval;
}

// Model returned by backend for schedules
export interface ClassScheduleItem {
  id: string;
  batchId: string;
  title: string;
  subject: string;
  teacher: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  location: string;
  mode: string;
  accent?: string;
  day?: string;
  dayOfWeek?: string;

}

// Grid display schedule block
export interface ScheduleBlock {
  id: string;
  day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  time: string;
  batchName: string;
  subject: string;
}

// Batch data models
export interface CreateBatchData {
  name: string;
  examYear: string;
  monthlyFee: number;
  deliveryMode: DeliveryMode;
  subjectId: string;
}
