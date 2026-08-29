export type DeliveryMode = "In person" | "Online";
export type AccentTone = "coral" | "green" | "yellow";

export interface ScheduleItem {
  id: number;
  day: string;
  date: string;
  title: string;
  subject: string;
  teacher: string;
  time: string;
  location: string;
  mode: DeliveryMode;
  accent: AccentTone;
}

export interface LearningResource {
  title: string;
  subject: string;
  type: "PDF" | "Video";
  time: string;
  size: string;
}

export interface StudentInvoice {
  month: string;
  batch: string;
  amount: string;
  status: string;
}

export interface StudentProfile {
  name: string;
  initials: string;
  studentId: string;
  exam: string;
  stream: string;
  medium: string;
}
