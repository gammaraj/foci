/** Format a Date as an ISO date string (YYYY-MM-DD) in the local timezone. */
export function formatDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parse YYYY-MM-DD as a local calendar Date (midnight). */
export function parseLocalDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Add `n` calendar days to a YYYY-MM-DD string. */
export function addDaysISO(dateStr: string, n: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatDateLocal(d);
}

/** Inclusive range of YYYY-MM-DD strings from `from` through `to`. */
export function enumerateDates(from: string, to: string): string[] {
  if (from > to) return [];
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDaysISO(cur, 1);
  }
  return out;
}

/** Calendar days from `b` to `a` (negative if `a` is earlier). */
export function diffCalendarDays(a: string, b: string): number {
  return Math.round((parseLocalDate(a).getTime() - parseLocalDate(b).getTime()) / 86_400_000);
}

/** "Today", "Tomorrow", or a short weekday + month + day label. */
export function relativeDayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  if (diffCalendarDays(dateStr, today) === 1) return "Tomorrow";
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function weekdayShort(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}

export function monthDay(dateStr: string): number {
  return parseLocalDate(dateStr).getDate();
}

export function isWeekend(dateStr: string): boolean {
  const day = parseLocalDate(dateStr).getDay();
  return day === 0 || day === 6;
}

/** Today's date as YYYY-MM-DD in the local timezone. */
export function getToday(): string {
  return formatDateLocal(new Date());
}

/** Tomorrow's date as YYYY-MM-DD in the local timezone. */
export function getTomorrow(): string {
  return addDaysISO(getToday(), 1);
}

/** Yesterday's date as YYYY-MM-DD in the local timezone. */
export function getYesterday(): string {
  return addDaysISO(getToday(), -1);
}

/** Local calendar date (YYYY-MM-DD) for a millisecond timestamp. */
export function timestampToLocalDate(ts: number): string {
  return formatDateLocal(new Date(ts));
}

/** Monday of the local week containing `d` (YYYY-MM-DD). Matches Stats heatmap week. */
export function getStartOfWeek(d: Date = new Date()): string {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = day.getDay(); // 0 = Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  day.setDate(day.getDate() + mondayOffset);
  return formatDateLocal(day);
}

/** First day of the local month containing `d` (YYYY-MM-DD). */
export function getStartOfMonth(d: Date = new Date()): string {
  return formatDateLocal(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Migrate old toDateString() format ("Wed Mar 12 2026") to ISO ("2026-03-12"). */
export function migrateDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) return formatDateLocal(parsed);
  return getToday();
}
