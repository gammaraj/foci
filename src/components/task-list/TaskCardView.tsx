"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PROJECT_ID, type Project, type Task } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { sortCardTasks } from "@/components/task-list/bucket-order";
import { getProjectsDragPreview } from "@/components/task-list/utils";
import {
  formatDueDate,
  getDaysOverdue,
  isDueDateOverdue,
  MAX_TASK_TITLE,
  resolveProjectColor,
} from "@/components/task-list/utils";
import { isActionableOverdue } from "@/lib/task-status";
import { QuickAddForm } from "@/components/task-list/QuickAddForm";
import { TaskEditButton } from "@/components/task-list/TaskEditButton";
import { TaskPriorityBadge } from "@/components/task-list/TaskPriorityBadge";
import { TaskKindBadge } from "@/components/task-list/TaskKindBadge";

const COLLAPSED_PROJECTS_KEY = "foci-collapsed-card-projects";

function loadCollapsedProjectIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(COLLAPSED_PROJECTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id): id is string => typeof id === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function persistCollapsedProjectIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COLLAPSED_PROJECTS_KEY, JSON.stringify([...ids]));
}

interface TaskCardViewProps {
  projects: Project[];
  tasksByProject: Map<string, Task[]>;
  completedCountByProject?: Map<string, number>;
  activeTaskId: string | null;
  isTimerRunning?: boolean;
  expandedTaskId?: string | null;
  editingTaskId?: string | null;
  editTitle?: string;
  dragProjectId?: string | null;
  dragOverProjectId?: string | null;
  onProjectDragStart?: (id: string) => void;
  onProjectDragOver?: (e: React.DragEvent, id: string) => void;
  onProjectDrop?: (targetId: string) => void;
  onProjectDragEnd?: () => void;
  dragTaskId?: string | null;
  dragOverTaskId?: string | null;
  onTaskDragStart?: (taskId: string) => void;
  onTaskDragOver?: (e: React.DragEvent, taskId: string) => void;
  onTaskDrop?: (projectId: string, targetTaskId: string) => void;
  onTaskDragEnd?: () => void;
  onQuickAdd: (title: string, projectId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onToggleTaskDetail?: (taskId: string) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onDeleteTask?: (taskId: string) => void;
  onMoveProject?: (projectId: string, direction: "up" | "down") => void;
  onExpandProject?: (projectId: string) => void;
  onOpenProject?: (projectId: string) => void;
  onToggleProjectFavorite?: (projectId: string) => void;
  hideEmptyProjects?: boolean;
  onToggleHideEmptyProjects?: () => void;
  emptyProjectCount?: number;
  overdueCount?: number;
  onViewOverdue?: () => void;
  /** When true, hide the overdue banner (urgency summary shown in header instead). */
  suppressOverdueBanner?: boolean;
  /** Softer per-project overdue labels when global urgency bar is visible. */
  softProjectOverdueLabels?: boolean;
}

function GripIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M7 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM7 13a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}

function ProjectDragPlaceholder({
  onProjectDrop,
  dragOverProjectId,
}: {
  onProjectDrop?: (targetId: string) => void;
  dragOverProjectId?: string | null;
}) {
  return (
    <div
      aria-hidden
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (dragOverProjectId) onProjectDrop?.(dragOverProjectId);
      }}
      className="rounded-lg border-2 border-dashed border-blue-400/60 dark:border-blue-500/50 bg-blue-50/30 dark:bg-blue-900/10 min-h-[8rem] transition-[opacity,transform] duration-150 ease-out"
    />
  );
}

function overdueSeverity(daysLate: number): "mild" | "medium" | "severe" {
  if (daysLate >= 5) return "severe";
  if (daysLate >= 3) return "medium";
  return "mild";
}

function overdueRowClasses(daysLate: number): string {
  const severity = overdueSeverity(daysLate);
  if (severity === "severe") {
    return "bg-red-200/80 dark:bg-red-950/55 hover:bg-red-200 dark:hover:bg-red-950/70 border-l-red-700 dark:border-l-red-500";
  }
  if (severity === "medium") {
    return "bg-red-100/85 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/55 border-l-red-600 dark:border-l-red-400";
  }
  return "bg-red-50/80 dark:bg-red-950/30 hover:bg-red-50 dark:hover:bg-red-950/45 border-l-red-400 dark:border-l-red-400/80";
}

function overdueTitleClass(daysLate: number): string {
  const severity = overdueSeverity(daysLate);
  if (severity === "severe") return "text-red-900 dark:text-red-200 font-semibold";
  if (severity === "medium") return "text-red-800 dark:text-red-200 font-medium";
  return "text-red-700 dark:text-red-300 font-medium";
}

function CardDuePrefix({ task }: { task: Task }) {
  if (!task.dueDate) return null;

  const blocked = !!task.blocked;
  const overdue = !blocked && !task.someday && isDueDateOverdue(task.dueDate);
  const isToday = task.dueDate === getToday();
  const daysLate = overdue ? getDaysOverdue(task.dueDate) : 0;
  const label = formatDueDate(task.dueDate);
  const severity = overdue ? overdueSeverity(daysLate) : null;

  return (
    <span
      className={`shrink-0 font-semibold tabular-nums text-xs ${
        overdue
          ? severity === "severe"
            ? "text-red-800 dark:text-red-200"
            : severity === "medium"
              ? "text-red-700 dark:text-red-300"
              : "text-red-600 dark:text-red-300"
          : blocked
            ? "text-amber-700 dark:text-amber-300"
            : isToday
              ? "text-amber-700 dark:text-amber-300"
              : "text-slate-500 dark:text-slate-400"
      }`}
      title={
        blocked
          ? "Waiting on external blocker"
          : overdue
            ? `Overdue by ${daysLate} day${daysLate === 1 ? "" : "s"} (due ${label})`
            : isToday
              ? "Due today"
              : `Due ${label}`
      }
    >
      [{label}]
    </span>
  );
}

function CardHeaderCounts({
  open,
  completed,
  overdue,
  softOverdueLabel = false,
}: {
  open: number;
  completed: number;
  overdue: number;
  softOverdueLabel?: boolean;
}) {
  if (open === 0 && completed === 0) return null;

  const title = `${open} open · ${completed} completed${overdue > 0 ? ` · ${overdue} overdue` : ""}`;

  return (
    <span className="text-xs app-text-meta tabular-nums leading-snug shrink-0 ml-auto pl-2 text-right" title={title}>
      <span className="text-slate-500 dark:text-slate-400">{open} open</span>
      {overdue > 0 && (
        <>
          <span className="text-slate-400 dark:text-slate-500"> · </span>
          <span
            className={
              softOverdueLabel
                ? "text-amber-700 dark:text-amber-300 font-medium"
                : "text-red-600 dark:text-red-300 font-medium"
            }
          >
            {overdue} late
          </span>
        </>
      )}
    </span>
  );
}

function CardTaskRow({
  task,
  projectId,
  activeTaskId,
  isTimerRunning,
  isExpanded,
  isEditing,
  editTitle,
  dragTaskId,
  dragOverTaskId,
  onTaskDragStart,
  onTaskDragOver,
  onTaskDrop,
  onTaskDragEnd,
  onToggleComplete,
  onToggleTaskDetail,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteTask,
}: {
  task: Task;
  projectId: string;
  activeTaskId: string | null;
  isTimerRunning?: boolean;
  isExpanded?: boolean;
  isEditing: boolean;
  editTitle: string;
  dragTaskId?: string | null;
  dragOverTaskId?: string | null;
  onTaskDragStart?: (taskId: string) => void;
  onTaskDragOver?: (e: React.DragEvent, taskId: string) => void;
  onTaskDrop?: (projectId: string, targetTaskId: string) => void;
  onTaskDragEnd?: () => void;
  onToggleComplete?: (taskId: string) => void;
  onToggleTaskDetail?: (taskId: string) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onDeleteTask?: (taskId: string) => void;
}) {
  const [titleExpanded, setTitleExpanded] = useState(false);
  const overdue = isActionableOverdue(task);
  const blocked = !!task.blocked;
  const someday = !!task.someday;
  const isActive = activeTaskId === task.id;
  const dragEnabled = !!onTaskDragStart && !isEditing;
  const isDragging = dragTaskId === task.id;
  const isDragOver = dragOverTaskId === task.id && dragTaskId !== task.id;
  const daysLate = overdue && task.dueDate ? getDaysOverdue(task.dueDate) : 0;
  const overdueLabel = overdue
    ? `Overdue by ${daysLate} day${daysLate === 1 ? "" : "s"}`
    : null;
  const titleTooltip = [overdueLabel, task.dueDate && !overdue ? `Due ${formatDueDate(task.dueDate)}` : null, task.title]
    .filter(Boolean)
    .join(" — ");

  return (
    <div
      draggable={dragEnabled}
      onDragStart={(e) => {
        if (!dragEnabled) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        e.stopPropagation();
        onTaskDragStart?.(task.id);
      }}
      onDragOver={(e) => {
        if (!dragEnabled || !dragTaskId) return;
        e.preventDefault();
        e.stopPropagation();
        onTaskDragOver?.(e, task.id);
      }}
      onDrop={(e) => {
        if (!dragEnabled || !dragTaskId) return;
        e.preventDefault();
        e.stopPropagation();
        onTaskDrop?.(projectId, task.id);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onTaskDragEnd?.();
      }}
      className={`group/row relative rounded-md border-l-[3px] pl-0.5 sm:pl-1 pr-0.5 py-0.5 sm:py-1 min-w-0 transition-colors ${
        isActive
          ? "bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-blue-400/40 border-l-blue-500"
          : isExpanded
            ? "bg-violet-50/50 dark:bg-violet-900/15 border-l-violet-400"
            : overdue
              ? overdueRowClasses(daysLate)
              : blocked
                ? "bg-amber-50/40 dark:bg-amber-950/20 border-l-amber-500 dark:border-l-amber-400"
                : someday
                  ? "border-l-violet-400 dark:border-l-violet-500 hover:bg-blue-50/60 dark:hover:bg-white/[0.03]"
                  : task.dueDate
                    ? task.dueDate === getToday()
                      ? "border-l-amber-400 dark:border-l-amber-500 hover:bg-blue-50/60 dark:hover:bg-white/[0.03]"
                      : "border-l-blue-500 dark:border-l-blue-400 hover:bg-blue-50/60 dark:hover:bg-white/[0.03]"
                    : "border-l-slate-300/60 dark:border-l-slate-600 hover:bg-blue-50/60 dark:hover:bg-white/[0.03]"
      } ${dragEnabled ? "cursor-grab active:cursor-grabbing" : ""} ${
        isDragging ? "opacity-40" : ""
      } ${isDragOver ? "ring-1 ring-inset ring-blue-400/60 dark:ring-blue-500/50" : ""}`}
    >
      <div className="flex items-start sm:items-center gap-1.5 min-h-[1.75rem] sm:min-h-[1.875rem] w-full min-w-0">
        {onToggleComplete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            className="flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 sm:mt-0 rounded border-2 border-slate-300 dark:border-slate-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            aria-label={`Mark "${task.title}" complete`}
          />
        )}
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitleChange?.(e.target.value)}
            onBlur={() => onSaveEdit?.(task.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit?.(task.id);
              if (e.key === "Escape") onCancelEdit?.();
            }}
            maxLength={MAX_TASK_TITLE}
            className="flex-1 min-w-0 text-sm font-medium px-1 py-0 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
            autoFocus
            aria-label="Edit task title"
          />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTitleExpanded((open) => !open);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onToggleTaskDetail?.(task.id);
            }}
            className={`group/title relative flex-1 min-w-0 basis-0 flex items-start sm:items-center gap-1 sm:gap-1.5 text-sm font-normal leading-snug text-left hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-0.5 sm:py-0 ${
              overdue ? overdueTitleClass(daysLate) : "text-slate-700 dark:text-slate-200"
            }`}
            title={titleTooltip}
            aria-expanded={titleExpanded}
            aria-label={titleExpanded ? `Collapse title: ${task.title}` : `Expand title: ${task.title}`}
          >
            {overdue && (
              <span
                className={`shrink-0 inline-flex items-center justify-center min-w-[1.5rem] h-4 px-1 rounded text-[10px] font-bold tabular-nums leading-none ${
                  overdueSeverity(daysLate) === "severe"
                    ? "bg-red-700 text-white"
                    : overdueSeverity(daysLate) === "medium"
                      ? "bg-red-600 text-white"
                      : "bg-red-500 text-white"
                }`}
                title={overdueLabel ?? "Overdue"}
                aria-label={overdueLabel ?? "Overdue"}
              >
                {daysLate}d
              </span>
            )}
            {task.kind && task.kind !== "task" && <TaskKindBadge kind={task.kind} size="compact" />}
            {task.priority != null && <TaskPriorityBadge priority={task.priority} size="compact" />}
            {task.dueDate && <CardDuePrefix task={task} />}
            <span
              className={`min-w-0 break-words sm:break-normal ${
                titleExpanded ? "whitespace-normal" : "line-clamp-2 sm:line-clamp-1 sm:truncate break-all"
              }`}
            >
              {task.title}
            </span>
            {!titleExpanded && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-0 z-30 top-[calc(100%+2px)] hidden w-max max-w-[min(20rem,70vw)] rounded-md border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] px-2.5 py-1.5 text-xs font-normal not-italic text-slate-800 dark:text-slate-100 shadow-lg group-hover/title:block whitespace-normal break-words"
              >
                {overdueLabel ? (
                  <span className="block font-semibold text-red-600 dark:text-red-300 mb-0.5">{overdueLabel}</span>
                ) : null}
                {task.title}
                <span className="block mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  Click to expand · double-click to edit
                </span>
              </span>
            )}
          </button>
        )}
        {!isEditing && (
          <div className="shrink-0 flex items-start sm:items-center gap-0.5 pt-0.5 sm:pt-0">
            {onToggleTaskDetail && (
              <TaskEditButton
                compact
                revealOnHover={!titleExpanded}
                isOpen={isExpanded}
                taskTitle={task.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTaskDetail(task.id);
                }}
              />
            )}
            <div className="hidden sm:flex items-center hover-reveal-desktop focus-within:opacity-100">
              {onStartEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(task);
                  }}
                  className="p-0.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
                  title={`Rename "${task.title}"`}
                  aria-label={`Rename task ${task.title}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              {onDeleteTask && !(isTimerRunning && isActive) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="p-0.5 rounded text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={`Delete "${task.title}"`}
                  aria-label={`Delete task ${task.title}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  projectIndex,
  projectCount,
  tasks,
  completedCount,
  activeTaskId,
  isTimerRunning,
  expandedTaskId,
  editingTaskId,
  editTitle,
  dragProjectId,
  dragOverProjectId,
  onProjectDragStart,
  onProjectDragOver,
  onProjectDrop,
  onProjectDragEnd,
  onMoveProject,
  dragTaskId,
  dragOverTaskId,
  onTaskDragStart,
  onTaskDragOver,
  onTaskDrop,
  onTaskDragEnd,
  onToggleComplete,
  onToggleTaskDetail,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteTask,
  onExpandProject,
  onOpenProject,
  onQuickAdd,
  onToggleProjectFavorite,
  softProjectOverdueLabels = false,
  collapsed = false,
  onToggleCollapsed,
}: {
  project: Project;
  projectIndex: number;
  projectCount: number;
  tasks: Task[];
  completedCount: number;
  activeTaskId: string | null;
  isTimerRunning?: boolean;
  expandedTaskId?: string | null;
  editingTaskId?: string | null;
  editTitle?: string;
  dragProjectId?: string | null;
  dragOverProjectId?: string | null;
  onProjectDragStart?: (id: string) => void;
  onProjectDragOver?: (e: React.DragEvent, id: string) => void;
  onProjectDrop?: (targetId: string) => void;
  onProjectDragEnd?: () => void;
  onMoveProject?: (projectId: string, direction: "up" | "down") => void;
  dragTaskId?: string | null;
  dragOverTaskId?: string | null;
  onTaskDragStart?: (taskId: string) => void;
  onTaskDragOver?: (e: React.DragEvent, taskId: string) => void;
  onTaskDrop?: (projectId: string, targetTaskId: string) => void;
  onTaskDragEnd?: () => void;
  onToggleComplete?: (taskId: string) => void;
  onToggleTaskDetail?: (taskId: string) => void;
  onQuickAdd: (title: string, projectId: string) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onDeleteTask?: (taskId: string) => void;
  onExpandProject?: (projectId: string) => void;
  onOpenProject?: (projectId: string) => void;
  onToggleProjectFavorite?: (projectId: string) => void;
  softProjectOverdueLabels?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const topTasks = sortCardTasks(tasks, activeTaskId).slice(0, 5);
  const remaining = tasks.length - topTasks.length;
  const overdueCount = tasks.filter((t) => isActionableOverdue(t)).length;
  const isPersonal = project.id === DEFAULT_PROJECT_ID;
  const accentColor = resolveProjectColor(project);
  const canReorder = projectCount >= 2 && !!onProjectDragStart;
  const isDragging = dragProjectId === project.id;
  const isDropTarget = dragOverProjectId === project.id && dragProjectId !== project.id;

  useEffect(() => {
    if (showAdd) addInputRef.current?.focus();
  }, [showAdd]);

  const submitQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onQuickAdd(title, project.id);
    setDraft("");
    setShowAdd(false);
  };

  return (
    <article
      id={`project-card-${project.id}`}
      onDragOver={(e) => {
        if (!canReorder || !onProjectDragOver || !dragProjectId) return;
        onProjectDragOver(e, project.id);
      }}
      onDrop={(e) => {
        if (!canReorder || !onProjectDrop || !dragProjectId) return;
        e.preventDefault();
        onProjectDrop(project.id);
      }}
      className={`group/card rounded-lg border px-2.5 py-2 sm:px-3 sm:py-2.5 min-w-0 flex flex-col gap-1 sm:gap-1.5 transition-colors border-slate-200/90 dark:border-[#243350] bg-white/90 dark:bg-[#0f1729]/80 ${isDragging ? "opacity-40" : ""} ${
        isDropTarget ? "ring-2 ring-blue-400/70 ring-offset-1 ring-offset-transparent" : ""
      } ${collapsed ? "bg-slate-50/90 dark:bg-[#0c1422]/90 border-dashed opacity-95" : ""}`}
      style={{
        borderTopWidth: 2,
        borderTopColor: accentColor,
      }}
      data-collapsed={collapsed ? "true" : "false"}
    >
      <header
        className={`flex flex-col gap-0 min-w-0 pb-1 mb-0.5 sm:pb-1.5 border-b border-slate-200/70 dark:border-[#243350]/80 ${
          collapsed ? "pb-0 mb-0 border-b-0" : ""
        }`}
        style={{
          borderBottomColor: collapsed ? "transparent" : `color-mix(in srgb, ${accentColor} 25%, transparent)`,
        }}
      >
        <div className="flex items-center gap-1 min-w-0">
          {onToggleCollapsed ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapsed();
              }}
              className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                collapsed
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a]"
              }`}
              title={
                collapsed
                  ? `Expand ${project.name} (saved preference)`
                  : `Collapse ${project.name} — hides tasks until you expand (saved)`
              }
              aria-label={collapsed ? `Expand ${project.name}` : `Collapse ${project.name}`}
              aria-expanded={!collapsed}
              aria-pressed={collapsed}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : null}
          {canReorder ? (
            <span
              draggable
              onDragStart={(e) => {
                onProjectDragStart?.(project.id);
                e.stopPropagation();
              }}
              onDragEnd={onProjectDragEnd}
              className="hidden sm:inline-flex text-slate-300 dark:text-slate-600 shrink-0 cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 rounded hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a]"
              title="Drag to reorder projects"
              aria-label={`Drag ${project.name} to reorder`}
            >
              <GripIcon />
            </span>
          ) : null}
          {canReorder && onMoveProject ? (
            <div className="sm:hidden flex flex-col shrink-0 -space-y-px -ml-0.5">
              <button
                type="button"
                onClick={() => onMoveProject(project.id, "up")}
                disabled={projectIndex === 0}
                className="p-0 h-4 w-5 flex items-center justify-center rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a] disabled:opacity-30"
                aria-label={`Move ${project.name} up`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onMoveProject(project.id, "down")}
                disabled={projectIndex >= projectCount - 1}
                className="p-0 h-4 w-5 flex items-center justify-center rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a] disabled:opacity-30"
                aria-label={`Move ${project.name} down`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          ) : null}
          {onToggleProjectFavorite ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleProjectFavorite(project.id);
              }}
              className={`flex-shrink-0 p-0.5 sm:touch-target-sm rounded transition-colors ${
                project.favorite
                  ? "text-amber-400 hover:text-amber-500"
                  : "text-slate-300 dark:text-slate-600 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 hover:!opacity-100 focus-visible:opacity-100 hover:text-amber-400"
              }`}
              title={
                project.favorite
                  ? "Pinned — click to unpin (pinned cards appear first)"
                  : "Pin project — show this card first"
              }
              aria-label={project.favorite ? `Unpin ${project.name}` : `Pin ${project.name}`}
              aria-pressed={!!project.favorite}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill={project.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={project.favorite ? 0 : 1.5} aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ) : project.favorite ? (
            <span title="Pinned — appears first in card view" className="flex-shrink-0" aria-hidden>
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          ) : null}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => onOpenProject?.(project.id)}
            className="flex-1 min-w-0 truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight text-left hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            title={`View all tasks in ${project.name}`}
          >
            {project.name}
          </button>
          {isPersonal && (
            <span className="app-caption font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">
              Personal
            </span>
          )}
          <CardHeaderCounts
            open={tasks.length}
            completed={completedCount}
            overdue={overdueCount}
            softOverdueLabel={softProjectOverdueLabels}
          />
        </div>
      </header>

      {collapsed ? (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Collapsed · {tasks.length === 0 ? "no tasks" : `${tasks.length} task${tasks.length === 1 ? "" : "s"} hidden`}
          {overdueCount > 0 ? ` · ${overdueCount} late` : ""} — click to expand
        </button>
      ) : (
        <>
          <div className="flex flex-col gap-0 sm:gap-0.5">
            {topTasks.length === 0 ? (
              <p className="app-text-meta text-slate-400 dark:text-slate-500 py-0.5">No tasks</p>
            ) : (
              topTasks.map((task) => (
                <CardTaskRow
                  key={task.id}
                  task={task}
                  projectId={project.id}
                  activeTaskId={activeTaskId}
                  isTimerRunning={isTimerRunning}
                  isExpanded={expandedTaskId === task.id}
                  isEditing={editingTaskId === task.id}
                  editTitle={editTitle ?? ""}
                  dragTaskId={dragTaskId}
                  dragOverTaskId={dragOverTaskId}
                  onTaskDragStart={onTaskDragStart}
                  onTaskDragOver={onTaskDragOver}
                  onTaskDrop={onTaskDrop}
                  onTaskDragEnd={onTaskDragEnd}
                  onToggleComplete={onToggleComplete}
                  onToggleTaskDetail={onToggleTaskDetail}
                  onStartEdit={onStartEdit}
                  onEditTitleChange={onEditTitleChange}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  onDeleteTask={onDeleteTask}
                />
              ))
            )}
          </div>

          <div className="no-print flex items-center gap-2 pt-0 sm:pt-0.5">
            {remaining > 0 && onExpandProject && (
              <button
                type="button"
                onClick={() => onExpandProject(project.id)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                View all ({remaining} more)
              </button>
            )}
            {!showAdd && (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                + Add
              </button>
            )}
          </div>

          {showAdd && (
            <div className="no-print">
              <QuickAddForm
                draft={draft}
                onDraftChange={setDraft}
                onSubmit={submitQuickAdd}
                inputRef={addInputRef}
                compact
                className="shrink-0"
              />
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default function TaskCardView({
  projects,
  tasksByProject,
  completedCountByProject,
  activeTaskId,
  isTimerRunning,
  expandedTaskId,
  editingTaskId,
  editTitle,
  dragProjectId,
  dragOverProjectId,
  onProjectDragStart,
  onProjectDragOver,
  onProjectDrop,
  onProjectDragEnd,
  dragTaskId,
  dragOverTaskId,
  onTaskDragStart,
  onTaskDragOver,
  onTaskDrop,
  onTaskDragEnd,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteTask,
  onMoveProject,
  onExpandProject,
  onOpenProject,
  onQuickAdd,
  onToggleComplete,
  onToggleTaskDetail,
  onToggleProjectFavorite,
  hideEmptyProjects = true,
  onToggleHideEmptyProjects,
  emptyProjectCount = 0,
  overdueCount = 0,
  onViewOverdue,
  suppressOverdueBanner = false,
  softProjectOverdueLabels = false,
}: TaskCardViewProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setCollapsedIds(loadCollapsedProjectIds());
  }, []);

  const toggleCollapsed = useCallback((projectId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      persistCollapsedProjectIds(next);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedIds(() => {
      const next = new Set<string>();
      persistCollapsedProjectIds(next);
      return next;
    });
  }, []);

  const visibleProjects = useMemo(() => {
    if (!hideEmptyProjects) return projects;
    return projects.filter((p) => (tasksByProject.get(p.id) ?? []).length > 0);
  }, [projects, tasksByProject, hideEmptyProjects]);

  const previewProjects = useMemo(
    () => getProjectsDragPreview(visibleProjects, dragProjectId ?? null, dragOverProjectId ?? null),
    [visibleProjects, dragProjectId, dragOverProjectId],
  );
  const showDragPlaceholder = !!(
    dragProjectId &&
    dragOverProjectId &&
    dragProjectId !== dragOverProjectId
  );
  const collapsedVisibleCount = visibleProjects.filter((p) => collapsedIds.has(p.id)).length;

  return (
    <div className="pb-4 pt-1">
      {(!suppressOverdueBanner && overdueCount > 0) || onToggleHideEmptyProjects || collapsedVisibleCount > 0 ? (
        <div className="px-3 sm:px-4 mb-2 flex flex-wrap items-center gap-2">
          {!suppressOverdueBanner && overdueCount > 0 && onViewOverdue && (
            <button
              type="button"
              onClick={onViewOverdue}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors touch-target-sm !min-h-0"
            >
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold tabular-nums">
                {overdueCount}
              </span>
              overdue — view all
            </button>
          )}
          {onToggleHideEmptyProjects && emptyProjectCount > 0 && (
            <button
              type="button"
              onClick={onToggleHideEmptyProjects}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {hideEmptyProjects
                ? `Show ${emptyProjectCount} empty project${emptyProjectCount === 1 ? "" : "s"}`
                : "Hide empty projects"}
            </button>
          )}
          {collapsedVisibleCount > 0 && (
            <button
              type="button"
              onClick={expandAll}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Expand {collapsedVisibleCount} collapsed
            </button>
          )}
        </div>
      ) : null}

      <div className="px-3 sm:px-4 grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-2 gap-2.5 sm:gap-3.5">
        {previewProjects.map((project, projectIndex) => {
          if (showDragPlaceholder && project.id === dragProjectId) {
            return (
              <ProjectDragPlaceholder
                key={project.id}
                dragOverProjectId={dragOverProjectId}
                onProjectDrop={onProjectDrop}
              />
            );
          }

          return (
            <ProjectCard
              key={project.id}
              project={project}
              projectIndex={projectIndex}
              projectCount={visibleProjects.length}
              tasks={tasksByProject.get(project.id) ?? []}
              completedCount={completedCountByProject?.get(project.id) ?? 0}
              activeTaskId={activeTaskId}
              isTimerRunning={isTimerRunning}
              expandedTaskId={expandedTaskId}
              editingTaskId={editingTaskId}
              editTitle={editTitle}
              dragProjectId={dragProjectId}
              dragOverProjectId={dragOverProjectId}
              onProjectDragStart={onProjectDragStart}
              onProjectDragOver={onProjectDragOver}
              onProjectDrop={onProjectDrop}
              onProjectDragEnd={onProjectDragEnd}
              onMoveProject={onMoveProject}
              dragTaskId={dragTaskId}
              dragOverTaskId={dragOverTaskId}
              onTaskDragStart={onTaskDragStart}
              onTaskDragOver={onTaskDragOver}
              onTaskDrop={onTaskDrop}
              onTaskDragEnd={onTaskDragEnd}
              onToggleComplete={onToggleComplete}
              onToggleTaskDetail={onToggleTaskDetail}
              onStartEdit={onStartEdit}
              onEditTitleChange={onEditTitleChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDeleteTask={onDeleteTask}
              onExpandProject={onExpandProject}
              onOpenProject={onOpenProject}
              onQuickAdd={onQuickAdd}
              onToggleProjectFavorite={onToggleProjectFavorite}
              softProjectOverdueLabels={softProjectOverdueLabels}
              collapsed={collapsedIds.has(project.id)}
              onToggleCollapsed={() => toggleCollapsed(project.id)}
            />
          );
        })}
      </div>

      {hideEmptyProjects && visibleProjects.length === 0 && (
        <p className="px-4 py-6 text-sm text-center text-slate-500 dark:text-slate-400">
          No projects with open tasks.
          {emptyProjectCount > 0 && onToggleHideEmptyProjects && (
            <>
              {" "}
              <button
                type="button"
                onClick={onToggleHideEmptyProjects}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Show {emptyProjectCount} empty
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
