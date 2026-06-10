import type { Task } from "@/lib/types";
import { isDueDateOverdue } from "@/components/task-list/utils";

export type BucketSwimlaneId = "overdue" | "dated" | "undated";

const SWIMLANE_ORDER: BucketSwimlaneId[] = ["overdue", "dated", "undated"];

export function getBucketSwimlaneId(task: Task): BucketSwimlaneId {
  if (!task.dueDate) return "undated";
  if (isDueDateOverdue(task.dueDate)) return "overdue";
  return "dated";
}

/** Same sort as bucket columns — active task first, then due grouping, then manual order. */
export function sortBucketTasks(tasks: Task[], activeTaskId: string | null): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.id === activeTaskId && b.id !== activeTaskId) return -1;
    if (b.id === activeTaskId && a.id !== activeTaskId) return 1;

    const aOverdue = a.dueDate && isDueDateOverdue(a.dueDate);
    const bOverdue = b.dueDate && isDueDateOverdue(b.dueDate);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate < b.dueDate ? -1 : 1;
    }

    if (a.order != null && b.order != null) return a.order - b.order;
    if (a.order != null) return -1;
    if (b.order != null) return 1;
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

  const targetPool = openTasks.filter(
    (t) => t.projectId === targetProjectId && t.id !== draggedTaskId
  );
  const targetLaneIds = tasksInSwimlane(targetPool, effectiveLaneId, activeTaskId).map((t) => t.id);

  let insertAt = targetLaneIds.length;
  if (target.type === "task") {
    const dropLaneIds = tasksInSwimlane(targetPool, targetSwimlaneId, activeTaskId).map((t) => t.id);
    const dropIdx = dropLaneIds.indexOf(target.taskId);
    if (!crossProject && targetSwimlaneId === effectiveLaneId && dropIdx >= 0) {
      insertAt = dropIdx;
    } else if (crossProject && targetSwimlaneId === effectiveLaneId && dropIdx >= 0) {
      insertAt = dropIdx;
    }
  }

  const nextTargetLaneIds = [...targetLaneIds];
  nextTargetLaneIds.splice(insertAt, 0, draggedTaskId);

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
