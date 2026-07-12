/** Format a Date as an ISO date string (YYYY-MM-DD) in the local timezone. */
export function formatDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's date as YYYY-MM-DD in the local timezone. */
export function getToday(): string {
  return formatDateLocal(new Date());
}

/** Yesterday's date as YYYY-MM-DD in the local timezone. */
export function getYesterday(): string {
  return formatDateLocal(new Date(Date.now() - 86400000));
}

/** Local calendar date (YYYY-MM-DD) for a millisecond timestamp. */
export function timestampToLocalDate(ts: number): string {
  return formatDateLocal(new Date(ts));
}
