// ===== Types =====

export interface Settings {
  workDuration: number; // in milliseconds
  breakDuration: number; // in milliseconds (was resetThreshold)
  inactivityThreshold: number; // in milliseconds
  dailyGoal: number;
  autoStartEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface DailyGoalData {
  date: string;
  sessionCount: number;
  streak: number;
  lastStreakUpdate: string | null;
}

export interface DayHistory {
  sessionCount: number;
  goalMet: boolean;
  timestamp: number;
}

export interface StreakHistory {
  days: Record<string, DayHistory>;
}

export type TimerMode = "work" | "break" | "idle";

export type TimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "break"
  | "completed";

/** Muted project accents — readable on light/dark without neon saturation. */
export const PROJECT_COLORS = [
  "#6b8cce", // dusty blue
  "#5f9a86", // sage green
  "#c4a35a", // soft amber
  "#c47a7a", // dusty rose
  "#8b7eb8", // muted violet
  "#c486a8", // dusty pink
  "#5e9eab", // slate cyan
  "#c48d62", // soft terracotta
  "#5f9e91", // muted teal
  "#7a7fbf", // soft indigo
];

/** Map previous bright palette → muted (existing saved colors). */
export const LEGACY_PROJECT_COLOR_MAP: Record<string, string> = {
  "#3b82f6": "#6b8cce",
  "#10b981": "#5f9a86",
  "#f59e0b": "#c4a35a",
  "#ef4444": "#c47a7a",
  "#8b5cf6": "#8b7eb8",
  "#ec4899": "#c486a8",
  "#06b6d4": "#5e9eab",
  "#f97316": "#c48d62",
  "#14b8a6": "#5f9e91",
  "#6366f1": "#7a7fbf",
};

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;       // hex color for visual identification
  dueDate?: string;     // ISO date string (YYYY-MM-DD)
  archived?: boolean;   // hide without deleting
  order?: number;       // manual sort order in sidebar
  favorite?: boolean;   // pin to front of project tabs
  createdAt: number;
}

export const ALL_PROJECTS_ID = "__all__";
export const TODAY_FILTER_ID = "__today__";
export const THIS_WEEK_FILTER_ID = "__this_week__";
export const THIS_MONTH_FILTER_ID = "__this_month__";
export const THIS_YEAR_FILTER_ID = "__this_year__";
export const DEFAULT_PROJECT_ID = "__general__";

export const DEFAULT_PROJECT: Project = {
  id: DEFAULT_PROJECT_ID,
  name: "General",
  color: PROJECT_COLORS[0],
  createdAt: 0,
};

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}

export type RecurrenceType = "daily" | "weekly" | "monthly" | "yearly";

export type TaskPriority = 1 | 2 | 3; // 1=High, 2=Medium, 3=Low

/** Lightweight content type so brain-dump notes/questions don't look like actionable tasks. */
export type TaskKind = "task" | "note" | "question";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  sessions: number; // number of sessions spent on this task
  timeSpent: number; // total milliseconds spent on this task
  createdAt: number;
  /** Timestamp when marked complete — used for Done today. Cleared on uncomplete. */
  completedAt?: number;
  projectId: string; // which project this task belongs to
  subtasks?: Subtask[];
  description?: string; // optional task description/notes
  archivedAt?: number; // timestamp when archived, undefined = not archived
  order?: number; // manual sort order for drag-and-drop
  dueDate?: string; // ISO date string (YYYY-MM-DD), undefined = no due date
  recurrence?: RecurrenceType; // if set, task repeats on this schedule
  priority?: TaskPriority; // 1=High, 2=Medium, 3=Low, undefined=None
  /** Waiting on an external blocker — shown separately from overdue. */
  blocked?: boolean;
  /** Intentionally undated / deferred — someday-maybe pile. */
  someday?: boolean;
  /** Content type — defaults to task when unset. */
  kind?: TaskKind;
}

export const DEFAULT_SETTINGS: Settings = {
  workDuration: 30 * 60 * 1000, // 30 minutes
  breakDuration: 5 * 60 * 1000, // 5 minutes
  inactivityThreshold: 1 * 60 * 1000, // 1 minute
  dailyGoal: 3,
  autoStartEnabled: false,
  notificationsEnabled: true,
};
