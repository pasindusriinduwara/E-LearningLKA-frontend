import { Clock3, MapPin, MoreHorizontal } from "lucide-react";
import type { ScheduleItem } from "@/lib/types/student";
import { StatusPill } from "@/components/ui/StatusPill";

export function ScheduleRow({ item, featured = false }: { item: ScheduleItem; featured?: boolean }) {
  return (
    <article className={`schedule-row ${featured ? "schedule-row-featured" : ""}`}>
      <div className={`date-block date-${item.accent}`}><span>{item.day}</span><strong>{item.date}</strong></div>
      <div className="schedule-info">
        <div className="schedule-title-line"><div><h3>{item.title}</h3><p>{item.subject} <span className="dot-separator">•</span> {item.teacher}</p></div>{featured && <StatusPill tone="warning">Next class</StatusPill>}</div>
        <div className="schedule-meta"><span><Clock3 size={15} />{item.time}</span><span><MapPin size={15} />{item.location}</span><span className={`mode-label mode-${item.mode === "Online" ? "online" : "physical"}`}>{item.mode}</span></div>
      </div>
      <button className="row-more" type="button" title={`More options for ${item.title}`} aria-label={`More options for ${item.title}`}><MoreHorizontal size={19} /></button>
    </article>
  );
}
