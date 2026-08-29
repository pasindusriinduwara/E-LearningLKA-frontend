import { BookOpen, CalendarDays } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusPill } from "@/components/ui/StatusPill";
import { ResourceRow } from "@/components/student/ResourceRow";
import { ScheduleRow } from "@/components/student/ScheduleRow";
import { recentMaterials, upcomingClasses } from "@/services/studentService";

export { SchedulePage } from "@/components/student/SchedulePage";


export function AttendancePage() {
  const rows = [...upcomingClasses, ...upcomingClasses].slice(0, 5);
  return <section className="full-view"><SectionHeading eyebrow="Attendance record" title="Attendance" action={<StatusPill tone="success">92% overall</StatusPill>} /><div className="attendance-summary"><div className="attendance-score"><strong>92%</strong><span>Excellent consistency</span><div className="meter-track"><span style={{ width: "92%" }} /></div></div><div className="attendance-stat"><span>Present</span><strong>22</strong></div><div className="attendance-stat"><span>Absent</span><strong>02</strong></div><div className="attendance-stat"><span>Total classes</span><strong>24</strong></div></div><div className="attendance-table"><div className="table-row table-head"><span>Class</span><span>Date</span><span>Status</span></div>{rows.map((item, index) => <div className="table-row" key={`${item.title}-${index}`}><span><strong>{item.title}</strong><small>{item.subject}</small></span><span>{item.date} 2026</span><span><StatusPill tone={index === 1 ? "warning" : "success"}>{index === 1 ? "Late" : "Present"}</StatusPill></span></div>)}</div></section>;
}

export { MaterialsPage } from "@/components/student/MaterialsPage";
export { AssessmentsPage } from "@/components/student/AssessmentsPage";
export { FeesPage } from "@/components/student/FeesPage";



export function StudentPlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="empty-view"><div className="empty-icon"><BookOpen size={24} /></div><h2>{title}</h2><p>{description}</p></section>;
}
