import { describe, it, expect, vi } from "vitest";
import type { Task } from "@/lib/types";
import { DEFAULT_PROJECT_ID } from "@/lib/types";
import {
  doneTodayToastMessage,
  formatDoneTaskMeta,
  getDoneTodayTasks,
  getEarlierCompletedTasks,
  isDoneToday,
  markDayRecapSeen,
  shouldShowDayRecap,
  summarizeDoneProgress,
  summarizeDoneToday,
} from "@/lib/done-today";
import { formatDateLocal, getStartOfMonth, getStartOfWeek } from "@/lib/dates";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Test",
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: 1,
    projectId: DEFAULT_PROJECT_ID,
    ...overrides,
  };
}

describe("done-today", () => {
  const todayStart = new Date();
  todayStart.setHours(12, 0, 0, 0);
  const todayTs = todayStart.getTime();
  const yesterdayTs = todayTs - 86_400_000;

  it("isDoneToday requires completedAt on local today", () => {
    expect(isDoneToday(makeTask({ completed: true, completedAt: todayTs }))).toBe(true);
    expect(isDoneToday(makeTask({ completed: true, completedAt: yesterdayTs }))).toBe(false);
    expect(isDoneToday(makeTask({ completed: true }))).toBe(false);
    expect(isDoneToday(makeTask({ completed: false, completedAt: todayTs }))).toBe(false);
    expect(
      isDoneToday(makeTask({ completed: true, completedAt: todayTs, archivedAt: todayTs })),
    ).toBe(false);
  });

  it("getDoneTodayTasks sorts newest first", () => {
    const older = makeTask({ id: "a", completed: true, completedAt: todayTs - 1000 });
    const newer = makeTask({ id: "b", completed: true, completedAt: todayTs });
    const earlier = makeTask({ id: "c", completed: true, completedAt: yesterdayTs });
    expect(getDoneTodayTasks([older, earlier, newer]).map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("getEarlierCompletedTasks excludes done today", () => {
    const today = makeTask({ id: "a", completed: true, completedAt: todayTs });
    const earlier = makeTask({ id: "b", completed: true, completedAt: yesterdayTs });
    const legacy = makeTask({ id: "c", completed: true });
    expect(getEarlierCompletedTasks([today, earlier, legacy]).map((t) => t.id)).toEqual([
      "b",
      "c",
    ]);
  });

  it("doneTodayToastMessage emphasizes tally", () => {
    expect(doneTodayToastMessage(1)).toBe("1 task done today");
    expect(doneTodayToastMessage(3)).toBe("3 tasks done today");
    expect(doneTodayToastMessage(2, { recurring: true })).toBe(
      "2 tasks done today · next occurrence created",
    );
  });

  it("summarizeDoneToday aggregates count sessions and time", () => {
    const tasks = [
      makeTask({ id: "a", completed: true, completedAt: todayTs, sessions: 1, timeSpent: 25 * 60000 }),
      makeTask({ id: "b", completed: true, completedAt: todayTs, sessions: 2, timeSpent: 10 * 60000 }),
      makeTask({ id: "c", completed: true, completedAt: yesterdayTs, sessions: 9, timeSpent: 99 * 60000 }),
    ];
    expect(summarizeDoneToday(tasks)).toEqual({
      count: 2,
      sessions: 3,
      timeSpent: 35 * 60000,
    });
  });

  it("summarizeDoneProgress counts today week and month", () => {
    const today = formatDateLocal(todayStart);
    const weekStart = getStartOfWeek(todayStart);
    const monthStart = getStartOfMonth(todayStart);
    const olderThanWeek = new Date(`${weekStart}T12:00:00`);
    olderThanWeek.setDate(olderThanWeek.getDate() - 1);
    const olderThanMonth = new Date(`${monthStart}T12:00:00`);
    olderThanMonth.setDate(olderThanMonth.getDate() - 1);

    const tasks = [
      makeTask({ id: "today", completed: true, completedAt: todayTs }),
      makeTask({ id: "yesterday", completed: true, completedAt: yesterdayTs }),
      makeTask({ id: "last-week", completed: true, completedAt: olderThanWeek.getTime() }),
      makeTask({ id: "last-month", completed: true, completedAt: olderThanMonth.getTime() }),
      makeTask({ id: "open", completed: false, completedAt: todayTs }),
    ];

    const progress = summarizeDoneProgress(tasks, today);
    expect(progress.today).toBe(1);
    expect(progress.week).toBeGreaterThanOrEqual(1);
    expect(progress.month).toBeGreaterThanOrEqual(progress.week);
    expect(progress.month).toBe(
      tasks.filter((t) => {
        if (!t.completed || t.completedAt == null) return false;
        const day = formatDateLocal(new Date(t.completedAt));
        return day >= monthStart && day <= today;
      }).length,
    );
  });

  it("formatDoneTaskMeta joins time and sessions", () => {
    expect(formatDoneTaskMeta({ timeSpent: 0, sessions: 0 })).toBeNull();
    expect(formatDoneTaskMeta({ timeSpent: 25 * 60000, sessions: 0 })).toBe("25m");
    expect(formatDoneTaskMeta({ timeSpent: 0, sessions: 1 })).toBe("1 session");
    expect(formatDoneTaskMeta({ timeSpent: 25 * 60000, sessions: 2 })).toBe("25m · 2 sessions");
  });

  it("shouldShowDayRecap gates on count and prior dismiss", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
    expect(shouldShowDayRecap(2)).toBe(false);
    expect(shouldShowDayRecap(3)).toBe(true);
    markDayRecapSeen();
    expect(shouldShowDayRecap(5)).toBe(false);
    vi.unstubAllGlobals();
  });
});
