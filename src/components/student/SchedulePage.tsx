"use client";

import { useState, useEffect } from "react";
import { Clock3, MapPin, Video, Loader2 } from "lucide-react";
import { getUpcomingClasses } from "@/services/studentService";
import type { ScheduleItem } from "@/lib/types/student";

export interface ScheduleDayTab {
  id: string;
  dayShort: string;
  dateNum: number;
  monthShort: string;
  fullDateStr: string;
  dayKey: string;
}

const WEEK_DAYS: ScheduleDayTab[] = [
  { id: "mon-25", dayShort: "Mon", dateNum: 25, monthShort: "Aug", fullDateStr: "Mon, Aug 25", dayKey: "Mon" },
  { id: "tue-26", dayShort: "Tue", dateNum: 26, monthShort: "Aug", fullDateStr: "Tue, Aug 26", dayKey: "Tue" },
  { id: "wed-27", dayShort: "Wed", dateNum: 27, monthShort: "Aug", fullDateStr: "Wed, Aug 27", dayKey: "Wed" },
  { id: "thu-28", dayShort: "Thu", dateNum: 28, monthShort: "Aug", fullDateStr: "Thu, Aug 28", dayKey: "Thu" },
  { id: "fri-29", dayShort: "Fri", dateNum: 29, monthShort: "Aug", fullDateStr: "Fri, Aug 29", dayKey: "Fri" },
  { id: "sat-30", dayShort: "Sat", dateNum: 30, monthShort: "Aug", fullDateStr: "Sat, Aug 30", dayKey: "Sat" },
];

function getSubjectColor(accent?: string, subject?: string): "blue" | "green" | "yellow" {
  if (accent === "green" || accent === "yellow" || accent === "blue") {
    return accent;
  }
  if (accent === "coral") return "blue";
  if (subject?.toLowerCase().includes("chem")) return "green";
  if (subject?.toLowerCase().includes("phys")) return "yellow";
  return "blue";
}

export function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>("mon-25");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        setError(null);
        const data = await getUpcomingClasses();
        setSchedules(data || []);
      } catch (err) {
        console.error("Failed to load schedules:", err);
        setError("Failed to load schedule from server.");
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, []);

  const activeDay = WEEK_DAYS.find((d) => d.id === selectedDayId) || WEEK_DAYS[0];

  // Filter classes belonging to the selected day
  const activeDayClasses = schedules.filter((item) => {
    const dayMatch = item.day?.toLowerCase() === activeDay.dayKey.toLowerCase();
    const dateMatch = item.date?.toLowerCase().includes(String(activeDay.dateNum));
    return dayMatch || dateMatch;
  });

  return (
    <div className="schedule-page-wrapper">
      {/* Top Horizontal Week Days Calendar Strip */}
      <div className="schedule-calendar-strip" role="tablist" aria-label="Select day of the week">
        {WEEK_DAYS.map((day) => {
          const isSelected = day.id === selectedDayId;
          const dayClassesCount = schedules.filter((item) => {
            const dayMatch = item.day?.toLowerCase() === day.dayKey.toLowerCase();
            const dateMatch = item.date?.toLowerCase().includes(String(day.dateNum));
            return dayMatch || dateMatch;
          }).length;
          const hasClasses = dayClassesCount > 0;

          return (
            <button
              key={day.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`calendar-day-tab ${isSelected ? "calendar-day-tab-active" : ""}`}
              onClick={() => setSelectedDayId(day.id)}
            >
              <span className="calendar-day-name">{day.dayShort}</span>
              <strong className="calendar-day-number">{day.dateNum}</strong>
              <span className="calendar-day-dot-wrap">
                {hasClasses && (
                  <span className={`calendar-day-dot ${isSelected ? "dot-white" : "dot-blue"}`} />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left classes list + Right glance sidebar */}
      <div className="schedule-main-layout">
        {/* Left Column: Selected Day Classes */}
        <section className="schedule-left-column">
          {/* Day Header Row */}
          <div className="selected-day-header">
            <h2 className="selected-day-title">{activeDay.fullDateStr}</h2>
            <span className="classes-count-pill">
              {activeDayClasses.length === 1
                ? "1 class"
                : `${activeDayClasses.length} classes`}
            </span>
          </div>

          {/* Loading or Classes Cards List */}
          {loading ? (
            <div className="schedule-no-classes-card">
              <Loader2 className="animate-spin text-blue-600 mb-2" size={24} />
              <p>Loading schedule from server...</p>
            </div>
          ) : (
            <div className="schedule-cards-list">
              {activeDayClasses.map((cls, index) => {
                const color = getSubjectColor(cls.accent, cls.subject);
                return (
                  <article
                    className={`schedule-class-card class-card-accent-${color}`}
                    key={cls.id || `${cls.title}-${index}`}
                  >
                    <div className="class-card-inner">
                      <div className="class-card-top-line">
                        <h3 className="class-card-title">{cls.title}</h3>
                        <span
                          className={`schedule-mode-pill ${
                            cls.mode === "In person"
                              ? "mode-pill-inperson"
                              : "mode-pill-online"
                          }`}
                        >
                          {cls.mode === "Online" && <Video size={12} style={{ marginRight: 4 }} />}
                          {cls.mode}
                        </span>
                      </div>

                      <p className="class-card-instructor">
                        {cls.subject ? `${cls.subject} • ` : ""}{cls.teacher}
                      </p>

                      <div className="class-card-meta-line">
                        <span className="meta-item">
                          <Clock3 size={15} />
                          <span>{cls.time}</span>
                        </span>
                        <span className="meta-item">
                          <MapPin size={15} />
                          <span>{cls.location}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}

              {activeDayClasses.length === 0 && (
                <div className="schedule-no-classes-card">
                  <p>No classes scheduled for this day.</p>
                  <span>Enjoy your self-study time!</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Column: Week at a Glance & This Week Count */}
        <aside className="schedule-right-column">
          {/* Widget 1: Week at a glance */}
          <div className="week-glance-card">
            <h3 className="week-glance-title">Week at a glance</h3>
            <div className="week-glance-list">
              {schedules.length === 0 && !loading ? (
                <p className="text-xs text-gray-400 p-2">No weekly classes scheduled.</p>
              ) : (
                schedules.map((item, idx) => {
                  const color = getSubjectColor(item.accent, item.subject);
                  return (
                    <div className="glance-item" key={item.id || idx}>
                      <span className={`glance-color-bar bar-${color}`} />
                      <div className="glance-info">
                        <strong className="glance-item-title">{item.title}</strong>
                        <span className="glance-item-time">
                          {item.day} {item.date ? `${item.date.split(" ")[0]} • ` : "• "}{item.time}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Widget 2: This Week Summary */}
          <div className="this-week-summary-card">
            <span className="this-week-label">THIS WEEK</span>
            <strong className="this-week-number">
              {loading ? "..." : schedules.length > 0 ? (schedules.length < 10 ? `0${schedules.length}` : schedules.length) : "0"}
            </strong>
            <p className="this-week-subtext">classes scheduled</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
