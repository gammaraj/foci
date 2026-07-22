import type { Task } from "./types";
import { getToday } from "./dates";

/** Date-scoped daily One Thing pick (Gary Keller). */
export interface OneThingPreference {
  taskId: string;
  /** ISO date YYYY-MM-DD */
  date: string;
}

export type OneThingStatus = "unset" | "active" | "done";

/** Whether a task can be set as today's One Thing. */
export function canBeOneThing(task: Task): boolean {
  return !task.completed && !task.archivedAt && !task.blocked && !task.someday;
}

/**
 * Resolve preference against today's date and the task list.
 * Stale dates, missing/archived tasks → unset.
 * Completed today → done (keep pick for the day).
 */
export function resolveOneThing(
  pref: OneThingPreference | null | undefined,
  tasks: Task[],
  today: string = getToday(),
): { status: OneThingStatus; task: Task | null; pref: OneThingPreference | null } {
  if (!pref?.taskId || !pref.date || pref.date !== today) {
    return { status: "unset", task: null, pref: null };
  }

  const task = tasks.find((t) => t.id === pref.taskId) ?? null;
  if (!task || task.archivedAt) {
    return { status: "unset", task: null, pref: null };
  }

  if (task.completed) {
    return { status: "done", task, pref };
  }

  return { status: "active", task, pref };
}

export function parseOneThingPreference(raw: unknown): OneThingPreference | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const taskId = typeof obj.taskId === "string" ? obj.taskId : null;
  const date = typeof obj.date === "string" ? obj.date : null;
  if (!taskId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { taskId, date };
}
