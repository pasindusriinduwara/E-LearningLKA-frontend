import type { LearningResource, ScheduleItem, StudentInvoice, StudentProfile } from "@/lib/types/student";

// Replace these local fixtures with Spring Boot service calls as the API modules land.
export const studentProfile: StudentProfile = {
  name: "Sahan Amarasinghe",
  initials: "SA",
  studentId: "24081",
  exam: "A/L 2026",
  stream: "Physical Science",
  medium: "Sinhala medium",
};

export const upcomingClasses: ScheduleItem[] = [
  {
    day: "Today",
    date: "25 AUG",
    title: "Pure Mathematics",
    subject: "Combined Mathematics",
    teacher: "Mr. K. Perera",
    time: "4:30 PM - 6:30 PM",
    location: "Nugegoda Studio 2",
    mode: "In person",
    accent: "coral",
  },
  {
    day: "Tomorrow",
    date: "26 AUG",
    title: "Organic Chemistry",
    subject: "Chemistry",
    teacher: "Ms. A. Fernando",
    time: "3:00 PM - 5:00 PM",
    location: "Live classroom",
    mode: "Online",
    accent: "green",
  },
  {
    day: "Wed",
    date: "27 AUG",
    title: "Physics",
    subject: "Physics",
    teacher: "Mr. R. Silva",
    time: "10:00 AM - 12:00 PM",
    location: "Nugegoda Studio 1",
    mode: "In person",
    accent: "yellow",
  },
];

export const recentMaterials: LearningResource[] = [
  { title: "Integration techniques", subject: "Combined Mathematics", type: "PDF", time: "Added 2 hours ago", size: "2.4 MB" },
  { title: "Electrochemistry lesson 06", subject: "Chemistry", type: "Video", time: "Added yesterday", size: "48 min" },
  { title: "Waves structured essay", subject: "Physics", type: "PDF", time: "Added 3 days ago", size: "1.8 MB" },
];

export const studentInvoices: StudentInvoice[] = [
  { month: "August 2026", batch: "A/L Combined Mathematics", amount: "LKR 3,500", status: "Due 30 Aug" },
  { month: "August 2026", batch: "A/L Chemistry", amount: "LKR 3,000", status: "Paid 02 Aug" },
];
