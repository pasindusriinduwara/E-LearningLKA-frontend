import { TeacherWelcomeBanner } from "@/app/(teacher)/dashboard/TeacherWelcomeBanner";
import { TeacherStats } from "@/app/(teacher)/dashboard/TeacherStats";
import { TeacherWidgets } from "@/app/(teacher)/dashboard/TeacherWidgets";

export default function TeacherDashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <TeacherWelcomeBanner />
      <TeacherStats />
      <TeacherWidgets />
    </div>
  );
}
