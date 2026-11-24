import { StudentSettingsPage } from "@/components/student/StudentSettingsPage";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata = {
  title: "Profile & Settings | Classroom",
  description: "Manage your student profile details, study stream, and account preferences.",
};

export default function SettingsRoute() {
  return <><StudentSettingsPage /><ChangePasswordForm /></>;
}
