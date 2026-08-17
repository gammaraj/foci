import type { Project, RecurrenceType, Subtask } from "@/lib/types";
import { PROJECT_COLORS } from "@/lib/types";
import { getToday, getTomorrow, formatDateLocal } from "@/lib/dates";

export const MAX_TASK_TITLE = 200;
export const MAX_PROJECT_NAME = 100;
export const MAX_VISIBLE_PROJECT_TABS = 3; // initial floor before width measurement

/** Reorder subtasks by id. Returns a new array, or null when the move is invalid. */
export function reorderSubtasks(
  subtasks: Subtask[],
  draggedId: string,
  targetId: string,
): Subtask[] | null {
  if (draggedId === targetId) return null;
  const fromIdx = subtasks.findIndex((s) => s.id === draggedId);
  const toIdx = subtasks.findIndex((s) => s.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return null;
  const next = [...subtasks];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

/** Stable accent color for every project — uses saved color or a deterministic fallback. */
export function resolveProjectColor(project: Pick<Project, "id" | "color">): string {
  if (project.color) return project.color;
  let hash = 0;
  for (let i = 0; i < project.id.length; i++) {
    hash = (hash * 31 + project.id.charCodeAt(i)) | 0;
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

/** Next palette color with the fewest current uses (avoids a sea of blue). */
export function pickProjectColor(projects: Pick<Project, "color">[]): string {
  const counts = new Map<string, number>(PROJECT_COLORS.map((c) => [c, 0]));
  for (const p of projects) {
    const c = p.color;
    if (!c) continue;
    if (counts.has(c)) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best = PROJECT_COLORS[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const c of PROJECT_COLORS) {
    const n = counts.get(c) ?? 0;
    if (n < bestCount) {
      best = c;
      bestCount = n;
    }
  }
  return best;
}

/** Favorites first, then manual order, then name. */
export function sortProjectsForDisplay(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    if (a.order != null && b.order != null) return a.order - b.order;
    if (a.order != null) return -1;
    if (b.order != null) return 1;
    return a.name.localeCompare(b.name);
  });
}

/** Active (non-archived) projects in tab order. */
export function getActiveProjectsInDisplayOrder(projects: Project[]): Project[] {
  return sortProjectsForDisplay(projects.filter((p) => !p.archived));
}

/** Preview tab order while dragging — cards shift before drop. */
export function getProjectsDragPreview(
  projects: Project[],
  draggedId: string | null,
  targetId: string | null,
): Project[] {
  const sorted = getActiveProjectsInDisplayOrder(projects);
  if (!draggedId || !targetId || draggedId === targetId) return sorted;

  const fromIdx = sorted.findIndex((p) => p.id === draggedId);
  const toIdx = sorted.findIndex((p) => p.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return sorted;

  const preview = [...sorted];
  const [moved] = preview.splice(fromIdx, 1);
  preview.splice(toIdx, 0, moved);
  return preview;
}

/**
 * Reorder projects in the tab bar. Dropping onto a target adopts that project's pin state.
 * Returns updated projects array, or null when the move is invalid.
 */
export function reorderProjects(
  projects: Project[],
  draggedId: string,
  targetId: string,
): Project[] | null {
  if (draggedId === targetId) return null;

  const sorted = getActiveProjectsInDisplayOrder(projects);
  const fromIdx = sorted.findIndex((p) => p.id === draggedId);
  const toIdx = sorted.findIndex((p) => p.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return null;

  const reordered = [...sorted];
  const [moved] = reordered.splice(fromIdx, 1);
  reordered.splice(toIdx, 0, moved);

  const targetFavorite = !!sorted[toIdx].favorite;
  const orderMap = new Map(reordered.map((p, i) => [p.id, i]));

  return projects.map((p) => {
    if (p.archived || !orderMap.has(p.id)) return p;
    const next: Project = { ...p, order: orderMap.get(p.id)! };
    if (p.id === draggedId && !!p.favorite !== targetFavorite) {
      next.favorite = targetFavorite;
    }
    return next;
  });
}

/** Move a project one step up or down in tab order. */
export function moveProjectInDisplayOrder(
  projects: Project[],
  projectId: string,
  direction: "up" | "down",
): Project[] | null {
  const sorted = getActiveProjectsInDisplayOrder(projects);
  const idx = sorted.findIndex((p) => p.id === projectId);
  if (idx === -1) return null;
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= sorted.length) return null;
  return reorderProjects(projects, projectId, sorted[targetIdx].id);
}

/** Short ALL-CAPS codes (CD, BK) — not product names like “Foci”. */
export function isProjectCodeName(name: string): boolean {
  return name.length > 0 && name.length <= 4 && /^[A-Z0-9]+$/.test(name);
}

/** Full name for hover / aria */
export function projectTabTooltip(project: { name: string; description?: string }): string {
  if (project.description?.trim()) {
    return `${project.name} — ${project.description.trim()}`;
  }
  return project.name;
}

/** Visible tab label — expands cryptic ALL-CAPS abbreviations (CD, BK, …) */
export function projectTabLabel(project: { name: string; description?: string }): string {
  const desc = project.description?.trim();
  if (isProjectCodeName(project.name) && desc) {
    const short = desc.length > 18 ? `${desc.slice(0, 18)}…` : desc;
    return `${project.name} — ${short}`;
  }
  return project.name;
}

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
  if (iso === getTomorrow()) return "Tomorrow";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isDueDateOverdue(iso: string): boolean {
  return iso < getToday();
}

/** Returns the number of calendar days a task is overdue (0 if not overdue). */
export function getDaysOverdue(iso: string): number {
  const today = getToday();
  if (iso >= today) return 0;
  const due = new Date(iso + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  return Math.round((now.getTime() - due.getTime()) / 86_400_000);
}

/** Compact overdue chip — minus sign means past due (e.g. "−7d"). */
export function formatOverdueChip(daysLate: number): string {
  return `−${daysLate}d`;
}

/** Accessible / tooltip label for overdue chips. */
export function formatOverdueLabel(daysLate: number): string {
  return `${daysLate} day${daysLate === 1 ? "" : "s"} late`;
}

/** Cards-style intensity: soft outline at 1d → strong fill at 5d+. Shared across views. */
export function overdueDayChipClass(daysLate: number): string {
  if (daysLate >= 5) return "urgency-chip--strong";
  if (daysLate >= 3) return "urgency-chip--mid";
  if (daysLate >= 2) return "urgency-chip--mid";
  return "urgency-chip--soft";
}

/** Shared size for due / overdue meta chips — readable floor (no 10px). */
export const META_CHIP_CLASS =
  "inline-flex items-center justify-center shrink-0 h-5 min-h-[1.25rem] px-1.5 rounded text-xs font-bold tabular-nums leading-none tracking-normal whitespace-nowrap";

/** Left-rail overdue row — no full wash (Cards look). */
export const OVERDUE_ROW_CLASS = "card-row--overdue";

export function openDatePicker(input: HTMLInputElement | null) {
  if (!input) return;
  try {
    // Some browsers only surface the calendar after the input is focused.
    input.focus({ preventScroll: true });
  } catch {
    /* ignore */
  }
  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
  } catch {
    // Already open, blocked, or unsupported — fall through
  }
  try {
    input.click();
  } catch {
    /* ignore */
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
