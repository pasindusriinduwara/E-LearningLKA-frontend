export type DeliveryMode = "In person" | "Online";
export type AccentTone = "coral" | "green" | "yellow";

export interface ScheduleItem {
  id: number | string;
  batchId?: string;
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
  id?: string;
  batchId?: string;
  batchName?: string;
  teacherName?: string;
  title: string;
  subject: string;
  type: string;
  time: string;
  size: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
  createdAt?: string;
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
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export interface UpdateStudentProfilePayload {
  name: string;
  initials?: string;
  phoneNumber?: string;
  exam?: string;
  stream?: string;
  medium?: string;
  dateOfBirth?: string;
}

