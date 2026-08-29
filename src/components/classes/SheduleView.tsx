import type { ScheduleBlock } from "@/lib/types/class";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function ScheduleView({ schedule }: { schedule: ScheduleBlock[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {DAYS.map((day) => {
        const dayBlocks = schedule.filter((block) => block.day === day);

        return (
          <div key={day} className="flex flex-col gap-4">
            <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              {day}
            </h3>
            
            {dayBlocks.length > 0 ? (
              dayBlocks.map((block) => (
                <div 
                  key={block.id} 
                  className="bg-[#F0FDF4] border border-[#2D9F75]/20 rounded-2xl p-4 shadow-sm"
                >
                  <p className="text-xs font-bold text-[#2D9F75] mb-2">{block.time}</p>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">
                    {block.batchName}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    {block.subject}
                  </p>
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