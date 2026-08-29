"use client";

import { useState } from "react";
import { Clock3, MapPin, Video } from "lucide-react";

export interface ScheduleDayItem {
  id: string;
  dayShort: string;
  dateNum: number;
  monthShort: string;
  fullDateStr: string;
  hasClasses: boolean;
  classes: ClassScheduleItem[];
}

export interface ClassScheduleItem {
  id: string;
  title: string;
  teacher: string;
  time: string;
  location: string;
  mode: "In person" | "Online";
  subjectColor: "blue" | "green" | "yellow";
}

const scheduleWeekData: ScheduleDayItem[] = [
  {
    id: "mon-25",
    dayShort: "Mon",
    dateNum: 25,
    monthShort: "Aug",
    fullDateStr: "Mon, Aug 25",
    hasClasses: true,
    classes: [
      {
        id: "cls-01",
        title: "Pure Mathematics",
        teacher: "Mr. K. Perera",
        time: "4:30 – 6:30 PM",
        location: "Nugegoda Studio 2",
        mode: "In person",
        subjectColor: "blue",
      },
    ],
  },
  {
    id: "tue-26",
    dayShort: "Tue",
    dateNum: 26,
    monthShort: "Aug",
    fullDateStr: "Tue, Aug 26",
    hasClasses: true,
    classes: [
      {
        id: "cls-02",
        title: "Organic Chemistry",
        teacher: "Ms. A. Fernando",
        time: "3:00 – 5:00 PM",
        location: "Live classroom",
        mode: "Online",
        subjectColor: "green",
      },
      {
        id: "cls-03",
        title: "Combined Maths",
        teacher: "Mr. K. Perera",
        time: "6:00 – 8:00 PM",
        location: "Nugegoda Studio 1",
        mode: "In person",
        subjectColor: "blue",
      },
    ],
  },
  {
    id: "wed-27",
    dayShort: "Wed",
    dateNum: 27,
    monthShort: "Aug",
    fullDateStr: "Wed, Aug 27",
    hasClasses: true,
    classes: [
      {
        id: "cls-04",
        title: "Physics",
        teacher: "Mr. R. Silva",
        time: "10:00 AM – 12:00 PM",
        location: "Nugegoda Studio 1",
        mode: "In person",
        subjectColor: "yellow",
      },
    ],
  },
  {
    id: "thu-28",
    dayShort: "Thu",
    dateNum: 28,
    monthShort: "Aug",
    fullDateStr: "Thu, Aug 28",
    hasClasses: false,
    classes: [],
  },
  {
    id: "fri-29",
    dayShort: "Fri",
    dateNum: 29,
    monthShort: "Aug",
    fullDateStr: "Fri, Aug 29",
    hasClasses: true,
    classes: [
      {
        id: "cls-05",
        title: "Pure Mathematics",
        teacher: "Mr. K. Perera",
        time: "4:30 – 6:30 PM",
        location: "Nugegoda Studio 2",
        mode: "In person",
        subjectColor: "blue",
      },
      {
        id: "cls-06",
        title: "Physics",
        teacher: "Mr. R. Silva",
        time: "2:00 – 4:00 PM",
        location: "Live classroom",
        mode: "Online",
        subjectColor: "yellow",
      },
    ],
  },
  {
    id: "sat-30",
    dayShort: "Sat",
    dateNum: 30,
    monthShort: "Aug",
    fullDateStr: "Sat, Aug 30",
    hasClasses: true,
    classes: [
      {
        id: "cls-07",
        title: "Organic Chemistry",
        teacher: "Ms. A. Fernando",
        time: "9:00 – 11:00 AM",
        location: "Nugegoda Studio 1",
        mode: "In person",
        subjectColor: "green",
      },
    ],
  },
];

const weekAtAGlanceList = [
  { title: "Pure Mathematics", time: "Mon 25 • 4:30 – 6:30 PM", color: "blue" },
  { title: "Organic Chemistry", time: "Tue 26 • 3:00 – 5:00 PM", color: "green" },
  { title: "Combined Maths", time: "Tue 26 • 6:00 – 8:00 PM", color: "blue" },
  { title: "Physics", time: "Wed 27 • 10:00 AM – 12:00 PM", color: "yellow" },
  { title: "Pure Mathematics", time: "Fri 29 • 4:30 – 6:30 PM", color: "blue" },
  { title: "Physics", time: "Fri 29 • 2:00 – 4:00 PM", color: "yellow" },
  { title: "Organic Chemistry", time: "Sat 30 • 9:00 – 11:00 AM", color: "green" },
];

export function SchedulePage() {
  const [selectedDayId, setSelectedDayId] = useState<string>("mon-25");

  const activeDayData =
    scheduleWeekData.find((day) => day.id === selectedDayId) || scheduleWeekData[0];

  return (
    <div className="schedule-page-wrapper">
      {/* Top Horizontal Week Days Calendar Strip */}
      <div className="schedule-calendar-strip" role="tablist" aria-label="Select day of the week">
        {scheduleWeekData.map((day) => {
          const isSelected = day.id === selectedDayId;
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
                {day.hasClasses && (
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
            <h2 className="selected-day-title">{activeDayData.fullDateStr}</h2>
            <span className="classes-count-pill">
              {activeDayData.classes.length === 1
                ? "1 class"
                : `${activeDayData.classes.length} classes`}
            </span>
          </div>

          {/* Classes Cards List */}
          <div className="schedule-cards-list">
            {activeDayData.classes.map((cls) => (
              <article
                className={`schedule-class-card class-card-accent-${cls.subjectColor}`}
                key={cls.id}
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

                  <p className="class-card-instructor">{cls.teacher}</p>

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
            ))}

            {activeDayData.classes.length === 0 && (
              <div className="schedule-no-classes-card">
                <p>No classes scheduled for this day.</p>
                <span>Enjoy your self-study time!</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Week at a Glance & This Week Count */}
        <aside className="schedule-right-column">
          {/* Widget 1: Week at a glance */}
          <div className="week-glance-card">
            <h3 className="week-glance-title">Week at a glance</h3>
            <div className="week-glance-list">
              {weekAtAGlanceList.map((item, idx) => (
                <div className="glance-item" key={idx}>
                  <span className={`glance-color-bar bar-${item.color}`} />
                  <div className="glance-info">
                    <strong className="glance-item-title">{item.title}</strong>
                    <span className="glance-item-time">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: This Week Summary */}
          <div className="this-week-summary-card">
            <span className="this-week-label">THIS WEEK</span>
            <strong className="this-week-number">6</strong>
            <p className="this-week-subtext">classes scheduled</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
