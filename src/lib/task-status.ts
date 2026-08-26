import type { Task } from "@/lib/types";
import { isDueDateOverdue } from "@/components/task-list/utils";

export type TaskListSection = "overdue" | "upcoming" | "blocked" | "inbox" | "someday";

export const TASK_LIST_SECTION_ORDER: TaskListSection[] = [
  "overdue",
  "upcoming",
  "blocked",
  "inbox",
  "someday",
];

/** Which list/bucket section a task belongs in. */
export function getTaskListSection(task: Task): TaskListSection {
  if (task.someday) return "someday";
  if (task.blocked) return "blocked";
  if (task.dueDate && isDueDateOverdue(task.dueDate)) return "overdue";
  if (task.dueDate) return "upcoming";
  return "inbox";
}

export function getTaskListSectionOrder(section: TaskListSection): number {
  return TASK_LIST_SECTION_ORDER.indexOf(section);
}

/** Overdue and still actionable — excludes blocked/someday. */
export function isActionableOverdue(task: Task): boolean {
  return getTaskListSection(task) === "overdue";
}
