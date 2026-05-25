import { describe, it, expect } from "vitest";
import { formatDuration, getNextDueDate, isDueDateOverdue } from "@/components/task-list/utils";

describe("task-list utils", () => {
  it("formatDuration shows hours and minutes", () => {
    expect(formatDuration(45 * 60_000)).toBe("45m");
    expect(formatDuration(90 * 60_000)).toBe("1h 30m");
    expect(formatDuration(120 * 60_000)).toBe("2h");
  });

  it("getNextDueDate advances recurrence", () => {
    expect(getNextDueDate("2026-05-19", "daily")).toBe("2026-05-20");
    expect(getNextDueDate("2026-05-19", "weekly")).toBe("2026-05-26");
  });

  it("isDueDateOverdue compares against today", () => {
    expect(isDueDateOverdue("2000-01-01")).toBe(true);
    expect(isDueDateOverdue("2099-12-31")).toBe(false);
  });
});
