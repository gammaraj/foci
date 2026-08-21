import type { TaskViewMode } from "@/components/task-list/types";

/** Public path segment for each layout tab — `/app/cards`, `/app/plan`, … */
export const TASK_VIEW_SEGMENTS = ["cards", "buckets", "list", "calendar", "plan"] as const;
export type TaskViewSegment = (typeof TASK_VIEW_SEGMENTS)[number];

const SEGMENT_TO_MODE: Record<TaskViewSegment, TaskViewMode> = {
  cards: "card",
  buckets: "bucket",
  list: "list",
  calendar: "calendar",
  plan: "plan",
};

const MODE_TO_SEGMENT: Record<TaskViewMode, TaskViewSegment> = {
  card: "cards",
  bucket: "buckets",
  list: "list",
  calendar: "calendar",
  plan: "plan",
};

export function isTaskViewSegment(value: string | null | undefined): value is TaskViewSegment {
  return !!value && (TASK_VIEW_SEGMENTS as readonly string[]).includes(value);
}

export function taskViewFromSegment(segment: string | null | undefined): TaskViewMode | null {
  if (!isTaskViewSegment(segment)) return null;
  return SEGMENT_TO_MODE[segment];
}

export function taskViewSegment(mode: TaskViewMode): TaskViewSegment {
  return MODE_TO_SEGMENT[mode];
}

/** `/app` or `/app/cards` → mode; bare `/app` returns null (use saved prefs). */
export function parseTaskViewFromPath(pathname: string | null | undefined): TaskViewMode | null {
  if (!pathname) return null;
  if (pathname === "/app") return null;
  if (!pathname.startsWith("/app/")) return null;
  const segment = pathname.slice("/app/".length).split("/")[0] ?? "";
  return taskViewFromSegment(segment);
}

export function appViewPath(mode: TaskViewMode): string {
  return `/app/${taskViewSegment(mode)}`;
}

export function isTasksAppPath(pathname: string | null | undefined): boolean {
  return !!pathname && (pathname === "/app" || pathname.startsWith("/app/"));
}

/**
 * True only for `/app` or `/app/{cards|buckets|list|calendar|plan}` with no junk
 * trailing segments. Used so nav can soft-open overlays when TaskList is mounted,
 * and fall back to full navigation on workspace 404 URLs like `/app/cards/1`.
 */
export function isExactTasksAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/app") return true;
  if (!pathname.startsWith("/app/")) return false;
  const parts = pathname.slice("/app/".length).split("/").filter(Boolean);
  return parts.length === 1 && isTaskViewSegment(parts[0]);
}

/** Build `/app/cards?…` (or bare `/app` when mode is omitted). */
export function buildAppHref(
  mode: TaskViewMode | null,
  searchParams: URLSearchParams | string,
  mutate?: (params: URLSearchParams) => void,
): string {
  const params = new URLSearchParams(
    typeof searchParams === "string" ? searchParams : searchParams.toString(),
  );
  mutate?.(params);
  const base = mode ? appViewPath(mode) : "/app";
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}
