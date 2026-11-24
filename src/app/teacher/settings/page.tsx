import { TeacherSettingsPage } from "@/components/teacher/TeacherSettingsPage";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata = {
  title: "Teacher Profile & Settings | Classroom",
  description: "Manage your educator profile details, qualifications, and credentials.",
};

export default function TeacherSettingsRoute() {
  return <><TeacherSettingsPage /><ChangePasswordForm /></>;
}
