/** Format a Date as an ISO date string (YYYY-MM-DD) in the local timezone. */
export function formatDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's date as YYYY-MM-DD in the local timezone. */
export function getToday(): string {
  return formatDateLocal(new Date());
}

/** Tomorrow's date as YYYY-MM-DD in the local timezone. */
export function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateLocal(d);
}

/** Yesterday's date as YYYY-MM-DD in the local timezone. */
export function getYesterday(): string {
  return formatDateLocal(new Date(Date.now() - 86400000));
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
