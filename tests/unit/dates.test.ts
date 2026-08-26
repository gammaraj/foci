import { describe, it, expect } from "vitest";
import {
  formatDateLocal,
  getToday,
  getYesterday,
  getStartOfWeek,
  getStartOfMonth,
  timestampToLocalDate,
  addDaysISO,
  enumerateDates,
  diffCalendarDays,
  relativeDayLabel,
  weekdayShort,
  monthDay,
  isWeekend,
  migrateDate,
} from "@/lib/dates";

describe("dates", () => {
  it("formatDateLocal returns YYYY-MM-DD", () => {
    const d = new Date(2026, 4, 19);
    expect(formatDateLocal(d)).toBe("2026-05-19");
  });

  it("getToday matches local date string", () => {
    expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("getYesterday is one day before today", () => {
    const today = new Date(getToday() + "T12:00:00");
    const yesterday = new Date(getYesterday() + "T12:00:00");
    expect(today.getTime() - yesterday.getTime()).toBe(86_400_000);
  });

  it("timestampToLocalDate matches formatDateLocal", () => {
    const d = new Date(2026, 6, 12, 15, 30);
    expect(timestampToLocalDate(d.getTime())).toBe("2026-07-12");
  });

  it("getStartOfWeek returns Monday of the containing week", () => {
    // Sunday Jul 12 2026 → Mon Jul 6
    expect(getStartOfWeek(new Date(2026, 6, 12))).toBe("2026-07-06");
    // Monday Jul 13 2026 → itself
    expect(getStartOfWeek(new Date(2026, 6, 13))).toBe("2026-07-13");
    // Wednesday Jul 15 2026 → Mon Jul 13
    expect(getStartOfWeek(new Date(2026, 6, 15))).toBe("2026-07-13");
  });

  it("getStartOfMonth returns the first of the month", () => {
    expect(getStartOfMonth(new Date(2026, 6, 14))).toBe("2026-07-01");
    expect(getStartOfMonth(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("addDaysISO steps calendar days", () => {
    expect(addDaysISO("2026-03-12", 1)).toBe("2026-03-13");
    expect(addDaysISO("2026-03-31", 1)).toBe("2026-04-01");
    expect(addDaysISO("2026-03-12", -1)).toBe("2026-03-11");
  });

  it("enumerateDates returns an inclusive range", () => {
    expect(enumerateDates("2026-03-12", "2026-03-14")).toEqual([
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
    ]);
    expect(enumerateDates("2026-03-14", "2026-03-12")).toEqual([]);
  });

  it("diffCalendarDays counts signed calendar days", () => {
    expect(diffCalendarDays("2026-03-14", "2026-03-12")).toBe(2);
    expect(diffCalendarDays("2026-03-10", "2026-03-12")).toBe(-2);
  });

  it("relativeDayLabel names today, tomorrow, and other days", () => {
    expect(relativeDayLabel("2026-03-12", "2026-03-12")).toBe("Today");
    expect(relativeDayLabel("2026-03-13", "2026-03-12")).toBe("Tomorrow");
    expect(relativeDayLabel("2026-03-18", "2026-03-12")).toMatch(/Wed,? Mar 18/);
  });

  it("weekdayShort, monthDay, and isWeekend read local calendar fields", () => {
    expect(weekdayShort("2026-03-14")).toBe("Sat");
    expect(monthDay("2026-03-14")).toBe(14);
    expect(isWeekend("2026-03-14")).toBe(true);
    expect(isWeekend("2026-03-16")).toBe(false);
  });

  it("migrateDate converts toDateString leftovers to ISO", () => {
    expect(migrateDate("2026-03-12")).toBe("2026-03-12");
    expect(migrateDate("Wed Mar 12 2026")).toBe("2026-03-12");
  });
});
