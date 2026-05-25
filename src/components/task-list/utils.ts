import type { RecurrenceType } from "@/lib/types";
import { getToday, formatDateLocal } from "@/lib/dates";

export const MAX_TASK_TITLE = 200;
export const MAX_PROJECT_NAME = 100;
export const MAX_VISIBLE_PROJECT_TABS = 6;

export function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDueDate(iso: string): string {
  const today = getToday();
  if (iso === today) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateLocal(tomorrow);
  if (iso === tomorrowStr) return "Tomorrow";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isDueDateOverdue(iso: string): boolean {
  return iso < getToday();
}

export function openDatePicker(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus({ preventScroll: true });
  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  } catch {
    input.click();
  }
}

export function getNextDueDate(currentDue: string | undefined, recurrence: RecurrenceType): string {
  const base = currentDue ? new Date(currentDue + "T00:00:00") : new Date();
  switch (recurrence) {
    case "daily":
      base.setDate(base.getDate() + 1);
      break;
    case "weekly":
      base.setDate(base.getDate() + 7);
      break;
    case "monthly":
      base.setMonth(base.getMonth() + 1);
      break;
    case "yearly":
      base.setFullYear(base.getFullYear() + 1);
      break;
  }
  return formatDateLocal(base);
}
