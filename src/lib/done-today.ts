import type { Task } from "./types";
import {
  getStartOfMonth,
  getStartOfWeek,
  getToday,
  timestampToLocalDate,
} from "./dates";

/** Non-archived tasks completed on the given local calendar day. */
export function isDoneToday(task: Task, today: string = getToday()): boolean {
  if (!task.completed || task.archivedAt) return false;
  if (task.completedAt == null) return false;
  return timestampToLocalDate(task.completedAt) === today;
}

/** Completed tasks finished today, newest first. */
export function getDoneTodayTasks(tasks: Task[], today: string = getToday()): Task[] {
  return tasks
    .filter((t) => isDoneToday(t, today))
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
}

/** Completed but not done today (older, or missing completedAt). */
export function getEarlierCompletedTasks(tasks: Task[], today: string = getToday()): Task[] {
  return tasks
    .filter((t) => t.completed && !t.archivedAt && !isDoneToday(t, today))
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt));
}

export interface DoneTodaySummary {
  count: number;
  sessions: number;
  timeSpent: number;
}

/** Aggregate wins for today's completed tasks. */
export function summarizeDoneToday(
  tasks: Task[],
  today: string = getToday(),
): DoneTodaySummary {
  const done = getDoneTodayTasks(tasks, today);
  return {
    count: done.length,
    sessions: done.reduce((sum, t) => sum + (t.sessions || 0), 0),
    timeSpent: done.reduce((sum, t) => sum + (t.timeSpent || 0), 0),
  };
}

export interface DoneProgressSummary {
  today: number;
  week: number;
  month: number;
  /** Whole days since the last completion, or null if none yet. */
  idleDays: number | null;
}

/**
 * Today / this week / this month completion counts for the header tally.
 * "This week" is clipped to the current month so week never exceeds month
 * when the Mon–Sun week spills into the prior month.
 */
export function summarizeDoneProgress(
  tasks: Task[],
  today: string = getToday(),
): DoneProgressSummary {
  const calendarWeekStart = getStartOfWeek(new Date(`${today}T12:00:00`));
  const monthStart = getStartOfMonth(new Date(`${today}T12:00:00`));
  const weekStart = calendarWeekStart > monthStart ? calendarWeekStart : monthStart;
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  let latestDay: string | null = null;
  for (const task of tasks) {
    if (!task.completed || task.archivedAt || task.completedAt == null) continue;
    const day = timestampToLocalDate(task.completedAt);
    if (day === today) todayCount += 1;
    if (day >= weekStart) weekCount += 1;
    if (day >= monthStart) monthCount += 1;
    if (!latestDay || day > latestDay) latestDay = day;
  }
  let idleDays: number | null = null;
  if (latestDay) {
    const t0 = new Date(`${today}T12:00:00`).getTime();
    const t1 = new Date(`${latestDay}T12:00:00`).getTime();
    idleDays = Math.max(0, Math.round((t0 - t1) / 86_400_000));
  }
  return { today: todayCount, week: weekCount, month: monthCount, idleDays };
}

/**
 * Mouth curve for the done-bar mascot: positive = smile, negative = frown.
 * Happier with more finishes today; sadder for each idle day.
 */
export function doneMascotSmile(todayCount: number, idleDays: number | null): number {
  if (todayCount > 0) return Math.min(2.6, 1.6 + Math.min(todayCount, 4) * 0.25);
  if (idleDays == null) return 0.5;
  if (idleDays <= 0) return 1.4;
  return Math.max(-2.5, 0.9 - idleDays * 0.7);
}

export function doneMascotCaption(todayCount: number, idleDays: number | null): string {
  if (todayCount > 0) {
    return todayCount === 1
      ? "Dot is happy — 1 task done today"
      : `Dot is happy — ${todayCount} tasks done today`;
  }
  if (idleDays == null) return "Dot is ready when you finish a task";
  if (idleDays <= 1) return "Dot is waiting for today’s first finish";
  if (idleDays === 2) return "Dot misses a checkmark — 2 days quiet";
  return `Dot is a bit sad — ${idleDays} days without a finish`;
}

/** Per-task focus meta for Done rows, e.g. "25m · 1 session". */
export function formatDoneTaskMeta(task: Pick<Task, "timeSpent" | "sessions">): string | null {
  const parts: string[] = [];
  if ((task.timeSpent || 0) > 0) {
    const totalMin = Math.floor(task.timeSpent / 60000);
    if (totalMin < 60) parts.push(`${totalMin}m`);
    else {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      parts.push(m > 0 ? `${h}h ${m}m` : `${h}h`);
    }
  }
  if ((task.sessions || 0) > 0) {
    parts.push(`${task.sessions} session${task.sessions === 1 ? "" : "s"}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Toast copy after completing a task — emphasizes today's tally. */
export function doneTodayToastMessage(
  doneTodayCount: number,
  options?: { recurring?: boolean },
): string {
  const countPart =
    doneTodayCount <= 1
      ? "1 task done today"
      : `${doneTodayCount} tasks done today`;
  if (options?.recurring) {
    return `${countPart} · next occurrence created`;
  }
  return countPart;
}

const DAY_RECAP_KEY_PREFIX = "foci_day_recap_seen_";

export function hasSeenDayRecap(today: string = getToday()): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    return localStorage.getItem(DAY_RECAP_KEY_PREFIX + today) === "1";
  } catch {
    return true;
  }
}

export function markDayRecapSeen(today: string = getToday()): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(DAY_RECAP_KEY_PREFIX + today, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Show the soft day recap once per day starting at the 3rd completion. */
export function shouldShowDayRecap(doneTodayCount: number, today: string = getToday()): boolean {
  return doneTodayCount >= 3 && !hasSeenDayRecap(today);
}
