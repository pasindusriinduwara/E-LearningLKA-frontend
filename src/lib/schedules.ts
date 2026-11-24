export interface ScheduleDefinition {
  id: string | number;
  batchId?: string;
  title: string;
  dayOfWeek?: string;
  effectiveDate?: string;
  recurrence?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  subject?: string;
  teacher?: string;
  location?: string;
  mode?: string;
  accent?: string;
}
export interface ScheduleOccurrence extends ScheduleDefinition {
  occurrenceId: string;
  dateKey: string;
  day: string;
  date: string;
  subject: string;
  teacher: string;
  location: string;
  time: string;
  mode: "Online" | "In person" | "Hybrid";
  accent: string;
  startSeconds: number;
  endSeconds: number;
}
const DAY = 86_400_000;
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" });
export function colomboDateKey(now: Date = new Date()): string {
  const parts = dateFormat.formatToParts(now);
  return ["year", "month", "day"].map(key => parts.find(p => p.type === key)!.value).join("-");
}
function ordinal(key: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const timestamp = Date.parse(`${key}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0,10) === key ? timestamp / DAY : null;
}
const dateKey = (day: number) => new Date(day * DAY).toISOString().slice(0,10);
const weekday = (day: number) => ((day + 3) % 7 + 7) % 7;
const displayDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
export function getWeekDays(now = new Date(), offset = 0) {
  if (!Number.isInteger(offset)) throw new RangeError("Invalid week offset");
  const today = colomboDateKey(now), day = ordinal(today)!;
  const monday = day - weekday(day) + offset * 7;
  return Array.from({ length: 7 }, (_, index) => {
    const value = monday + index, date = new Date(value * DAY), key = dateKey(value);
    return { dateKey: key, day: DAYS[index].slice(0,1) + DAYS[index].slice(1,3).toLowerCase(), dateNum: date.getUTCDate(), label: displayDate.format(date), isToday: key === today };
  });
}
function seconds(value?: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value || "");
  if (!match || +match[1] > 23 || +match[2] > 59 || +(match[3] || 0) > 59) return null;
  return +match[1] * 3600 + +match[2] * 60 + +(match[3] || 0);
}
function normalized(definition: ScheduleDefinition) {
  const firstDate = ordinal(definition.effectiveDate || "");
  const day = DAYS.indexOf(definition.dayOfWeek || "");
  const start = seconds(definition.startTime), end = seconds(definition.endTime);
  const mode = ({ ONLINE: "Online", IN_PERSON: "In person", HYBRID: "Hybrid" } as const)[definition.mode as "ONLINE" | "IN_PERSON" | "HYBRID"];
  if (firstDate === null || day < 0 || start === null || end === null || end <= start || !mode || !["ONCE","WEEKLY","BI_WEEKLY"].includes(definition.recurrence || "")) return null;
  const first = definition.recurrence === "ONCE" ? firstDate : firstDate + (day - weekday(firstDate) + 7) % 7;
  return { first, start, end, mode, interval: definition.recurrence === "ONCE" ? 0 : definition.recurrence === "BI_WEEKLY" ? 14 : 7 };
}
function occurrence(definition: ScheduleDefinition, day: number, normalizedValue: NonNullable<ReturnType<typeof normalized>>): ScheduleOccurrence {
  const key = dateKey(day);
  const shortDay = DAYS[weekday(day)];
  const formatTime = (value: number) => `${Math.floor(value / 3600) % 12 || 12}:${String(Math.floor(value % 3600 / 60)).padStart(2,"0")} ${value >= 43200 ? "PM" : "AM"}`;
  return { ...definition, occurrenceId: `${definition.id}:${key}`, dateKey: key,
    day: shortDay.slice(0,1) + shortDay.slice(1,3).toLowerCase(), date: displayDate.format(new Date(day * DAY)),
    subject: definition.subject || "", teacher: definition.teacher || "", location: definition.location || "",
    time: `${formatTime(normalizedValue.start)} – ${formatTime(normalizedValue.end)}`,
    mode: normalizedValue.mode, accent: definition.accent || "blue", startSeconds: normalizedValue.start, endSeconds: normalizedValue.end };
}
const sortOccurrences = (a: ScheduleOccurrence, b: ScheduleOccurrence) => a.dateKey.localeCompare(b.dateKey) || a.startSeconds - b.startSeconds || String(a.id).localeCompare(String(b.id));
export function occurrencesForWeek(definitions: readonly ScheduleDefinition[], now = new Date(), offset = 0): ScheduleOccurrence[] {
  const days = getWeekDays(now, offset);
  return definitions.flatMap(definition => {
    const value = normalized(definition); if (!value) return [];
    return days.flatMap(day => {
      const current = ordinal(day.dateKey)!;
      const matches = value.interval ? current >= value.first && (current - value.first) % value.interval === 0 : current === value.first;
      return matches ? [occurrence(definition, current, value)] : [];
    });
  }).sort(sortOccurrences);
}
export function upcomingOccurrences(definitions: readonly ScheduleDefinition[], now = new Date(), limit = 5): ScheduleOccurrence[] {
  const today = ordinal(colomboDateKey(now))!;
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
  const nowSeconds = seconds(time)!;
  return definitions.flatMap(definition => {
    const value = normalized(definition); if (!value) return [];
    let day = value.first;
    if (day < today && value.interval) day += Math.ceil((today - day) / value.interval) * value.interval;
    if (day < today || (day === today && value.end <= nowSeconds)) {
      if (!value.interval) return [];
      day += value.interval;
    }
    return Array.from({ length: value.interval ? limit : 1 }, (_, i) => occurrence(definition, day + i * value.interval, value));
  }).sort(sortOccurrences).slice(0,limit);
}
