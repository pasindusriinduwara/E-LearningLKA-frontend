import { Pencil, Trash2 } from "lucide-react";
import type { ClassScheduleItem } from "@/lib/types/class";

const DAYS_OF_WEEK = [
  { key: "MONDAY", label: "MON" },
  { key: "TUESDAY", label: "TUE" },
  { key: "WEDNESDAY", label: "WED" },
  { key: "THURSDAY", label: "THU" },
  { key: "FRIDAY", label: "FRI" },
  { key: "SATURDAY", label: "SAT" },
  { key: "SUNDAY", label: "SUN" },
] as const;

interface ScheduleViewProps {
  schedule: ClassScheduleItem[];
  onEdit?: (item: ClassScheduleItem) => void;
  onDelete?: (item: ClassScheduleItem) => void;
}

function getNormalizedDay(item: ClassScheduleItem): string {
  // Check dayOfWeek enum string or legacy day
  const day = (item.dayOfWeek || item.day || "").toUpperCase();
  if (day.startsWith("MON")) return "MONDAY";
  if (day.startsWith("TUE")) return "TUESDAY";
  if (day.startsWith("WED")) return "WEDNESDAY";
  if (day.startsWith("THU")) return "THURSDAY";
  if (day.startsWith("FRI")) return "FRIDAY";
  if (day.startsWith("SAT")) return "SATURDAY";
  if (day.startsWith("SUN")) return "SUNDAY";
  return "";
}

export function ScheduleView({
  schedule,
  onEdit,
  onDelete,
}: ScheduleViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {DAYS_OF_WEEK.map(({ key, label }) => {
        // Filter and sort by start time
        const dayBlocks = (schedule || [])
          .filter((block) => getNormalizedDay(block) === key)
          .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

        return (
          <div key={key} className="flex flex-col gap-4">
            <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              {label}
            </h3>

            {dayBlocks.length > 0 ? (
              dayBlocks.map((block) => (
                <div
                  key={block.id}
                  className="group bg-[#F0FDF4] border border-[#2D9F75]/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: block.accent || "#2D9F75" }}
                  />

                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-bold text-[#2D9F75]">
                      {block.time || "Time not set"}
                    </p>

                    {(onEdit || onDelete) && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(block);
                            }}
                            title="Edit schedule"
                            className="p-1 rounded-lg hover:bg-emerald-100 text-gray-500 hover:text-emerald-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(block);
                            }}
                            title="Delete schedule"
                            className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                    {block.title}
                  </h4>

                  <p className="text-xs font-medium text-gray-600 mb-2">
                    {block.subject}
                  </p>

                  <div className="flex items-center justify-between gap-1 text-[10px] text-gray-500 pt-2 border-t border-emerald-100">
                    <span className="truncate" title={block.location}>
                      📍 {block.location || "TBD"}
                    </span>
                    {block.mode && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase text-[9px]">
                        {block.mode.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 h-32 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-300">Free</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
