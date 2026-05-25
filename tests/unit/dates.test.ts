import { describe, it, expect } from "vitest";
import { formatDateLocal, getToday, getYesterday } from "@/lib/dates";

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
});
