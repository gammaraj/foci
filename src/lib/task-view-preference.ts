import type { TaskViewMode } from "@/components/task-list/types";

export type DefaultTaskView = Exclude<TaskViewMode, "plan">;

export const DEFAULT_TASK_VIEW: DefaultTaskView = "card";

export const DEFAULT_TASK_VIEW_OPTIONS: { value: DefaultTaskView; label: string }[] = [
  { value: "card", label: "Cards" },
  { value: "bucket", label: "Buckets" },
  { value: "list", label: "List" },
  { value: "calendar", label: "Calendar" },
];

export interface TaskViewPreferences {
  defaultTaskView: DefaultTaskView;
  lastTaskView: DefaultTaskView | null;
  taskViewExplicit: boolean;
}

export const DEFAULT_TASK_VIEW_PREFERENCES: TaskViewPreferences = {
  defaultTaskView: DEFAULT_TASK_VIEW,
  lastTaskView: null,
  taskViewExplicit: false,
};

const VALID_DEFAULTS = new Set<DefaultTaskView>(["card", "bucket", "list", "calendar"]);

export const DEFAULT_VIEW_CHANGED_EVENT = "foci-default-view-changed";

export function isDefaultTaskView(value: string | null | undefined): value is DefaultTaskView {
  return !!value && VALID_DEFAULTS.has(value as DefaultTaskView);
}

/** Pick the task view on load — last explicit choice, else user default. */
export function resolveInitialTaskView(prefs: TaskViewPreferences): TaskViewMode {
  if (prefs.taskViewExplicit && isDefaultTaskView(prefs.lastTaskView)) {
    return prefs.lastTaskView;
  }
  return prefs.defaultTaskView;
}
