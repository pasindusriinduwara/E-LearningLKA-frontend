import { BookOpen, CalendarDays, Check, CircleAlert, Clock3 } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusPill } from "@/components/ui/StatusPill";
import { ResourceRow } from "@/components/student/ResourceRow";
import { ScheduleRow } from "@/components/student/ScheduleRow";
import { recentMaterials, upcomingClasses } from "@/services/studentService";

export function SchedulePage() {
  return <section className="full-view"><SectionHeading eyebrow="25 - 31 August 2026" title="My schedule" action={<button className="outline-button" type="button"><CalendarDays size={16} /> This week</button>} /><div className="full-list">{upcomingClasses.map((item, index) => <ScheduleRow item={item} featured={index === 0} key={`${item.date}-${item.title}`} />)}</div></section>;
}

export function AttendancePage() {
  const rows = [...upcomingClasses, ...upcomingClasses].slice(0, 5);
  return <section className="full-view"><SectionHeading eyebrow="Attendance record" title="Attendance" action={<StatusPill tone="success">92% overall</StatusPill>} /><div className="attendance-summary"><div className="attendance-score"><strong>92%</strong><span>Excellent consistency</span><div className="meter-track"><span style={{ width: "92%" }} /></div></div><div className="attendance-stat"><span>Present</span><strong>22</strong></div><div className="attendance-stat"><span>Absent</span><strong>02</strong></div><div className="attendance-stat"><span>Total classes</span><strong>24</strong></div></div><div className="attendance-table"><div className="table-row table-head"><span>Class</span><span>Date</span><span>Status</span></div>{rows.map((item, index) => <div className="table-row" key={`${item.title}-${index}`}><span><strong>{item.title}</strong><small>{item.subject}</small></span><span>{item.date} 2026</span><span><StatusPill tone={index === 1 ? "warning" : "success"}>{index === 1 ? "Late" : "Present"}</StatusPill></span></div>)}</div></section>;
}

export function MaterialsPage() {
  return <section className="full-view"><SectionHeading eyebrow="Your learning library" title="Materials" action={<button className="outline-button" type="button"><BookOpen size={16} /> Filter</button>} /><div className="materials-list">{[...recentMaterials, ...recentMaterials].map((resource, index) => <ResourceRow key={`${resource.title}-${index}`} resource={resource} />)}</div></section>;
}

export function FeesPage() {
  const invoices = [
    { subject: "Pure Mathematics", teacher: "Mr. K. Perera", period: "August 2026", amount: "Rs. 4,500", due: "31 Aug 2026", status: "Due" },
    { subject: "Organic Chemistry", teacher: "Ms. A. Fernando", period: "August 2026", amount: "Rs. 3,800", due: "31 Aug 2026", status: "Due" },
    { subject: "Pure Mathematics", teacher: "Mr. K. Perera", period: "July 2026", amount: "Rs. 4,500", due: "31 Jul 2026", status: "Paid" },
    { subject: "Organic Chemistry", teacher: "Ms. A. Fernando", period: "July 2026", amount: "Rs. 3,800", due: "31 Jul 2026", status: "Paid" },
  ];
  return <section className="full-view fees-page"><SectionHeading eyebrow="Billing" title="Fees & payments" /><div className="billing-summary"><article className="billing-card billing-outstanding"><span className="billing-label">Total outstanding</span><strong>Rs. 12,800</strong><p>Due this month</p><button className="primary-button" type="button">Pay now</button></article><article className="billing-card billing-paid"><div className="billing-icon"><Check size={20} /></div><span>Paid this term</span><strong>Rs. 11,500</strong><p>All clear ✓</p></article><article className="billing-card billing-overdue"><div className="billing-icon"><CircleAlert size={20} /></div><span>Overdue</span><strong>Rs. 2,500</strong><p>Action required</p></article></div><h2 className="invoice-history-title">Invoice history</h2><div className="invoice-table"><div className="invoice-table-row invoice-table-head"><span>Subject</span><span>Period</span><span>Amount</span><span>Due date</span><span>Status</span></div>{invoices.map((invoice) => <div className="invoice-table-row" key={`${invoice.subject}-${invoice.period}`}><span><strong>{invoice.subject}</strong><small>{invoice.teacher}</small></span><span>{invoice.period}</span><strong>{invoice.amount}</strong><span className="invoice-due"><Clock3 size={16} />{invoice.due}</span><StatusPill tone={invoice.status === "Paid" ? "success" : "warning"}>{invoice.status}</StatusPill></div>)}</div></section>;
}

export function StudentPlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="empty-view"><div className="empty-icon"><BookOpen size={24} /></div><h2>{title}</h2><p>{description}</p></section>;
}
