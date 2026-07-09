import type { Task } from "@/lib/types";
import { isDueDateOverdue } from "@/components/task-list/utils";

export type BucketSwimlaneId = "overdue" | "dated" | "blocked" | "undated" | "someday";

const SWIMLANE_ORDER: BucketSwimlaneId[] = ["overdue", "dated", "blocked", "undated", "someday"];

export function getBucketSwimlaneId(task: Task): BucketSwimlaneId {
  if (task.someday) return "someday";
  if (task.blocked) return "blocked";
  if (!task.dueDate) return "undated";
  if (isDueDateOverdue(task.dueDate)) return "overdue";
  return "dated";
}

export function sortBucketTasks(tasks: Task[], activeTaskId: string | null): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
    if (b.id === activeTaskId && a.id !== activeTaskId) return 1;

    if (a.order != null && b.order != null && a.order !== b.order) return a.order - b.order;
    if (a.order != null && b.order == null) return -1;
    if (a.order == null && b.order != null) return 1;

    const aOverdue = a.dueDate && !a.blocked && !a.someday && isDueDateOverdue(a.dueDate);
    const bOverdue = b.dueDate && !b.blocked && !b.someday && isDueDateOverdue(b.dueDate);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate < b.dueDate ? -1 : 1;
    }

    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

export function tasksInSwimlane(
  tasks: Task[],
  laneId: BucketSwimlaneId,
  activeTaskId: string | null
): Task[] {
  return sortBucketTasks(tasks, activeTaskId).filter((t) => getBucketSwimlaneId(t) === laneId);
}

/** Card view — swimlane priority first, or manual order once set via card drag. */
export function sortCardTasks(tasks: Task[], activeTaskId: string | null): Task[] {
  const hasManualOrder = tasks.some((t) => t.order != null);
  if (hasManualOrder) {
    return [...tasks].sort((a, b) => {
      if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
      if (b.id === activeTaskId && a.id !== activeTaskId) return 1;
      if (a.order != null && b.order != null && a.order !== b.order) return a.order - b.order;
      if (a.order != null && b.order == null) return -1;
      if (a.order == null && b.order != null) return 1;
      return sortBucketTasks([a, b], activeTaskId)[0].id === a.id ? -1 : 1;
    });
  }
  return SWIMLANE_ORDER.flatMap((laneId) => tasksInSwimlane(tasks, laneId, activeTaskId));
}

/** Reorder tasks within a project card (persists `order` on all open project tasks). */
export function moveCardTaskInProject(
  allTasks: Task[],
  projectId: string,
  draggedTaskId: string,
  targetTaskId: string,
  activeTaskId: string | null
): Task[] | null {
  if (draggedTaskId === targetTaskId) return null;

  const pool = allTasks.filter(
    (t) => t.projectId === projectId && !t.completed && !t.archivedAt
  );
  const sorted = sortCardTasks(pool, activeTaskId);
  const fromIdx = sorted.findIndex((t) => t.id === draggedTaskId);
  const toIdx = sorted.findIndex((t) => t.id === targetTaskId);
  if (fromIdx === -1 || toIdx === -1) return null;

  const reordered = [...sorted];
  const [moved] = reordered.splice(fromIdx, 1);
  reordered.splice(toIdx, 0, moved);

  return applyOrderToProject(allTasks, projectId, reordered.map((t) => t.id));
}

export type BucketDropTarget =
  | { type: "task"; projectId: string; taskId: string; swimlaneId: BucketSwimlaneId }
  | { type: "column"; projectId: string; swimlaneId: BucketSwimlaneId };

function projectLaneIds(
  projectTasks: Task[],
  laneOverrides: Partial<Record<BucketSwimlaneId, string[]>>,
  activeTaskId: string | null
): string[] {
  return SWIMLANE_ORDER.flatMap((lane) => {
    if (laneOverrides[lane]) return laneOverrides[lane]!;
    return tasksInSwimlane(projectTasks, lane, activeTaskId).map((t) => t.id);
  });
}

function applyOrderToProject(tasks: Task[], projectId: string, orderedIds: string[]): Task[] {
  const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
  return tasks.map((t) => {
    if (t.projectId !== projectId || t.completed || t.archivedAt) return t;
    const order = orderMap.get(t.id);
    return order !== undefined ? { ...t, order } : t;
  });
}

/**
 * Apply a bucket drag-drop: reorder within a swimlane or move across projects.
 * Returns updated tasks array, or null if drop is invalid.
 */
export function applyBucketDrop(
  allTasks: Task[],
  draggedTaskId: string,
  target: BucketDropTarget,
  activeTaskId: string | null
): Task[] | null {
  const dragged = allTasks.find((t) => t.id === draggedTaskId);
  if (!dragged || dragged.completed || dragged.archivedAt) return null;

  const sourceProjectId = dragged.projectId;
  const targetProjectId = target.projectId;
  const crossProject = sourceProjectId !== targetProjectId;
  const targetSwimlaneId = target.swimlaneId;

  if (!crossProject) {
    if (getBucketSwimlaneId(dragged) !== targetSwimlaneId) return null;
    if (target.type === "task" && target.taskId === draggedTaskId) return null;
  }

  const openTasks = allTasks.filter((t) => !t.completed && !t.archivedAt);

  const draggedLaneId = getBucketSwimlaneId(dragged);
  const effectiveLaneId = crossProject ? draggedLaneId : targetSwimlaneId;

  const targetProjectOpen = openTasks.filter((t) => t.projectId === targetProjectId);
  let nextTargetLaneIds: string[];

  if (target.type === "task") {
    const fullLaneIds = tasksInSwimlane(targetProjectOpen, effectiveLaneId, activeTaskId).map(
      (t) => t.id
    );

    if (!crossProject) {
      const fromIdx = fullLaneIds.indexOf(draggedTaskId);
      const toIdx = fullLaneIds.indexOf(target.taskId);
      if (fromIdx === -1 || toIdx === -1) return null;
      nextTargetLaneIds = [...fullLaneIds];
      nextTargetLaneIds.splice(fromIdx, 1);
      nextTargetLaneIds.splice(toIdx, 0, draggedTaskId);
    } else if (targetSwimlaneId === effectiveLaneId) {
      const withoutDragged = fullLaneIds.filter((id) => id !== draggedTaskId);
      const insertAt = withoutDragged.indexOf(target.taskId);
      if (insertAt === -1) return null;
      nextTargetLaneIds = [...withoutDragged];
      nextTargetLaneIds.splice(insertAt, 0, draggedTaskId);
    } else {
      nextTargetLaneIds = [...fullLaneIds.filter((id) => id !== draggedTaskId), draggedTaskId];
    }
  } else {
    const targetLaneIds = tasksInSwimlane(
      targetProjectOpen.filter((t) => t.id !== draggedTaskId),
      effectiveLaneId,
      activeTaskId
    ).map((t) => t.id);
    nextTargetLaneIds = [...targetLaneIds, draggedTaskId];
  }

  let updated = allTasks.map((t) =>
    t.id === draggedTaskId ? { ...t, projectId: targetProjectId } : t
  );

  const targetOpen = updated.filter(
    (t) => !t.completed && !t.archivedAt && t.projectId === targetProjectId
  );
  updated = applyOrderToProject(
    updated,
    targetProjectId,
    projectLaneIds(targetOpen, { [effectiveLaneId]: nextTargetLaneIds }, activeTaskId)
  );

  if (crossProject) {
    const sourceOpen = updated.filter(
      (t) => !t.completed && !t.archivedAt && t.projectId === sourceProjectId
    );
    updated = applyOrderToProject(
      updated,
      sourceProjectId,
      projectLaneIds(sourceOpen, {}, activeTaskId)
    );
  } else {
    const sameProjectOpen = updated.filter(
      (t) => !t.completed && !t.archivedAt && t.projectId === sourceProjectId
    );
    const laneOverrides: Partial<Record<BucketSwimlaneId, string[]>> = {
      [effectiveLaneId]: nextTargetLaneIds,
    };
    updated = applyOrderToProject(
      updated,
      sourceProjectId,
      projectLaneIds(sameProjectOpen, laneOverrides, activeTaskId)
    );
  }

  return updated;
}

/** Move a task up/down within its project swimlane. */
export function moveBucketTaskInLane(
  allTasks: Task[],
  taskId: string,
  direction: "up" | "down",
  activeTaskId: string | null
): Task[] | null {
  const task = allTasks.find((t) => t.id === taskId);
  if (!task || task.completed || task.archivedAt) return null;

  const laneId = getBucketSwimlaneId(task);
  const pool = allTasks.filter(
    (t) => t.projectId === task.projectId && !t.completed && !t.archivedAt
  );
  const laneTasks = tasksInSwimlane(pool, laneId, activeTaskId);
  const idx = laneTasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return null;

  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= laneTasks.length) return null;

  const reordered = [...laneTasks];
  [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];

  const laneOverrides: Partial<Record<BucketSwimlaneId, string[]>> = {
    [laneId]: reordered.map((t) => t.id),
  };

  return applyOrderToProject(
    allTasks,
    task.projectId,
    projectLaneIds(pool, laneOverrides, activeTaskId)
  );
}
