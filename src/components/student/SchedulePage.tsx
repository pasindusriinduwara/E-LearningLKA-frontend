"use client";
import { useState, useEffect, useMemo } from "react";
import { Clock3, MapPin, Video, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getUpcomingClasses } from "@/services/studentService";
import { getMyEnrollmentStatuses } from "@/services/enrollmentService";
import { colomboDateKey, getWeekDays, occurrencesForWeek, type ScheduleDefinition } from "@/lib/schedules";

export function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleDefinition[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const [data, statuses] = await Promise.all([getUpcomingClasses(), getMyEnrollmentStatuses()]);
        if (cancelled) return;
        const approved = new Set(statuses.filter(item => item.status === "APPROVED").map(item => item.batchId));
        setSchedules(data.filter(item => item.batchId && approved.has(item.batchId)));
      } catch (failure) {
        if (!cancelled) {
          setSchedules([]);
          setError(failure instanceof Error ? failure.message : "Could not load your schedule.");
        }
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [refresh]);
  useEffect(() => {
    const focus = () => { setNow(new Date()); setRefresh(value => value + 1); };
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    window.addEventListener("focus", focus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, []);
  const days = useMemo(() => getWeekDays(now, weekOffset), [now, weekOffset]);
  const occurrences = useMemo(() => occurrencesForWeek(schedules, now, weekOffset), [schedules, now, weekOffset]);
  const active = days.find(day => day.dateKey === selectedDate) || days.find(day => day.isToday) || days[0];
  const classes = occurrences.filter(item => item.dateKey === active.dateKey);
  function navigate(offset: number) { setWeekOffset(offset); setSelectedDate(null); }
  return <div className="schedule-page-wrapper">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div><h1 className="text-2xl font-bold text-slate-900">My schedule</h1><p className="text-sm text-slate-500">{days[0].label} – {days[6].label}, {days[6].dateKey.slice(0,4)} · Sri Lanka time</p></div>
      <div className="flex gap-2">
        <button onClick={() => navigate(weekOffset - 1)} aria-label="Previous week" className="p-2 rounded-lg border border-slate-200"><ChevronLeft size={18} /></button>
        <button onClick={() => navigate(0)} className="px-3 rounded-lg border border-slate-200 text-sm font-medium">This week</button>
        <button onClick={() => navigate(weekOffset + 1)} aria-label="Next week" className="p-2 rounded-lg border border-slate-200"><ChevronRight size={18} /></button>
      </div>
    </div>
    <div className="schedule-calendar-strip" role="tablist" aria-label="Select schedule date" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
      {days.map(day => <button key={day.dateKey} type="button" role="tab" aria-selected={active.dateKey === day.dateKey} aria-controls="schedule-day-panel" id={`schedule-tab-${day.dateKey}`} onClick={() => setSelectedDate(day.dateKey)} className={`calendar-day-tab ${active.dateKey === day.dateKey ? "calendar-day-tab-active" : ""}`}>
        <span className="calendar-day-name">{day.day}</span><strong className="calendar-day-number">{day.dateNum}</strong>
        <span className="calendar-day-dot-wrap">{!loading && !error && occurrences.some(item => item.dateKey === day.dateKey) && <span className={`calendar-day-dot ${active.dateKey === day.dateKey ? "dot-white" : "dot-blue"}`} />}</span>
      </button>)}
    </div>
    <div className="schedule-main-layout">
      <section className="schedule-left-column" id="schedule-day-panel" role="tabpanel" aria-labelledby={`schedule-tab-${active.dateKey}`}>
        <div className="selected-day-header"><h2 className="selected-day-title">{active.day}, {active.label}</h2><span className="classes-count-pill">{loading || error ? "—" : `${classes.length} ${classes.length === 1 ? "class" : "classes"}`}</span></div>
        {loading ? <div className="schedule-no-classes-card" role="status"><Loader2 className="animate-spin" size={24} /><p>Loading your schedule...</p></div> : error ? <div className="schedule-no-classes-card"><p role="alert" className="text-red-700">{error}</p><button onClick={() => setRefresh(value => value + 1)} className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white">Retry schedule</button></div> : <div className="schedule-cards-list">
          {classes.map(item => <article key={item.occurrenceId} className="schedule-class-card class-card-accent-blue"><div className="class-card-inner">
            <div className="class-card-top-line"><h3 className="class-card-title">{item.title}</h3><span className={`schedule-mode-pill ${item.mode === "In person" ? "mode-pill-inperson" : "mode-pill-online"}`}>{item.mode !== "In person" && <Video size={12} />}{item.mode}</span></div>
            <p className="class-card-instructor">{[item.subject,item.teacher].filter(Boolean).join(" · ")}</p>
            <div className="class-card-meta-line"><span className="meta-item"><Clock3 size={15} />{item.time}</span><span className="meta-item"><MapPin size={15} />{item.location || "Location to be confirmed"}</span></div>
          </div></article>)}
          {classes.length === 0 && <div className="schedule-no-classes-card"><p>No classes scheduled for this date.</p>{active.dateKey === colomboDateKey(now) && <span>Check the rest of your week or browse your classes.</span>}</div>}
        </div>}
      </section>
      <aside className="schedule-right-column"><div className="week-glance-card"><h3 className="week-glance-title">Week at a glance</h3>
        {!loading && !error && occurrences.map(item => <div key={item.occurrenceId} className="glance-item"><span className="glance-color-bar bar-blue" /><div className="glance-info"><strong className="glance-item-title">{item.title}</strong><span className="glance-item-time">{item.day} {item.date} · {item.time}</span></div></div>)}
        {error ? <p className="text-sm text-slate-500">Schedule unavailable.</p> : !loading && !occurrences.length && <p className="text-sm text-slate-500">No classes this week.</p>}
      </div><div className="this-week-summary-card"><span className="this-week-label">SELECTED WEEK</span><strong className="this-week-number">{loading ? "..." : error ? "—" : occurrences.length}</strong><p className="this-week-subtext">classes scheduled</p></div></aside>
    </div>
  </div>;
}
