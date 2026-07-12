import type { Task } from "./types";
import { getToday, timestampToLocalDate } from "./dates";

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
