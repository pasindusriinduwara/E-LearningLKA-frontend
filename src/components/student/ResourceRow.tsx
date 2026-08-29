import { Download, FileText, PlayCircle } from "lucide-react";
import type { LearningResource } from "@/lib/types/student";

export function ResourceRow({ resource }: { resource: LearningResource }) {
  return (
    <article className="resource-row">
      <div className={`resource-icon resource-${resource.type.toLowerCase()}`}>{resource.type === "Video" ? <PlayCircle size={19} /> : <FileText size={19} />}</div>
      <div className="resource-copy"><h3>{resource.title}</h3><p>{resource.subject} <span className="dot-separator">•</span> {resource.time}</p></div>
      <span className="resource-size">{resource.size}</span>
      <button className="icon-button subtle" type="button" title={`Download ${resource.title}`} aria-label={`Download ${resource.title}`}><Download size={17} /></button>
    </article>
  );
}
