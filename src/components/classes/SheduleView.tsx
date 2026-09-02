import type { ClassScheduleItem } from "@/lib/types/class";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

// Helper to normalize any day format ("Friday", "Fri", "FRI", or date string) to 3-letter code
function getNormalizedDay(item: ClassScheduleItem): string {
  if (item.day) {
    const d = item.day.toUpperCase();
    if (d.startsWith("MON")) return "MON";
    if (d.startsWith("TUE")) return "TUE";
    if (d.startsWith("WED")) return "WED";
    if (d.startsWith("THU")) return "THU";
    if (d.startsWith("FRI")) return "FRI";
    if (d.startsWith("SAT")) return "SAT";
    if (d.startsWith("SUN")) return "SUN";
  }

  // Fallback: Calculate day from date string (e.g. "2026-09-04")
  if (item.date) {
    const parsed = new Date(item.date);
    if (!isNaN(parsed.getTime())) {
      const dayIndex = parsed.getDay(); // 0 = Sun, 1 = Mon, ...
      const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      return map[dayIndex];
    }
  }

  return "";
}

export function ScheduleView({ schedule }: { schedule: ClassScheduleItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {DAYS.map((day) => {
        const dayBlocks = (schedule || []).filter(
          (block) => getNormalizedDay(block) === day
        );

        return (
          <div key={day} className="flex flex-col gap-4">
            <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              {day}
            </h3>

            {dayBlocks.length > 0 ? (
              dayBlocks.map((block) => (
                <div
                  key={block.id}
                  className="bg-[#F0FDF4] border border-[#2D9F75]/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Accent strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: block.accent || "#2D9F75" }}
                  />

                  {/* Time */}
                  <p className="text-xs font-bold text-[#2D9F75] mb-1.5">
                    {block.time || "Time not set"}
                  </p>

                  {/* Topic / Title */}
                  <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                    {block.title}
                  </h4>

                  {/* Batch / Subject */}
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    {block.subject}
                  </p>

                  {/* Location & Mode */}
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
