import { StudentSettingsPage } from "@/components/student/StudentSettingsPage";

export const metadata = {
  title: "Profile & Settings | Classroom",
  description: "Manage your student profile details, study stream, and account preferences.",
};

export default function SettingsRoute() {
  return <StudentSettingsPage />;
}
