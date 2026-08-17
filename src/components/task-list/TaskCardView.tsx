"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project, Task } from "@/lib/types";
import { getToday, getTomorrow } from "@/lib/dates";
import { sortCardTasks } from "@/components/task-list/bucket-order";
import { getProjectsDragPreview } from "@/components/task-list/utils";
import {
  formatDueDate,
  formatOverdueChip,
  formatOverdueLabel,
  getDaysOverdue,
  isDueDateOverdue,
  MAX_TASK_TITLE,
  OVERDUE_ROW_CLASS,
  overdueDayChipClass,
  META_CHIP_CLASS,
  resolveProjectColor,
} from "@/components/task-list/utils";
import { isActionableOverdue } from "@/lib/task-status";
import { QuickAddForm } from "@/components/task-list/QuickAddForm";
import { TaskEditButton } from "@/components/task-list/TaskEditButton";
import { TaskTitleButton } from "@/components/task-list/TaskTitleButton";
import { TaskPriorityBadge } from "@/components/task-list/TaskPriorityBadge";
import { TaskKindBadge } from "@/components/task-list/TaskKindBadge";
import { OneThingBadge } from "@/components/task-list/OneThingBadge";
import { DoneTodaySection } from "@/components/task-list/DoneTodaySection";
import { AddProjectButton } from "@/components/task-list/AddProjectButton";

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
  /** Tasks completed today per project (Done today reel). */
  doneTodayByProject?: Map<string, Task[]>;
  activeTaskId: string | null;
  /** Today's One Thing task id (active pick only). */
  oneThingTaskId?: string | null;
  isTimerRunning?: boolean;
  expandedTaskId?: string | null;
  expandedSubtasksTaskId?: string | null;
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
  onToggleSubtasks?: (taskId: string) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onDeleteTask?: (taskId: string) => void;
  onMoveProject?: (projectId: string, direction: "up" | "down") => void;
  onExpandProject?: (projectId: string) => void;
  onOpenProject?: (projectId: string) => void;
  onToggleProjectFavorite?: (projectId: string) => void;
  /** Render subtasks (or other content) under each task row. */
  renderBelowTask?: (task: Task) => React.ReactNode;
  hideEmptyProjects?: boolean;
  onToggleHideEmptyProjects?: () => void;
  emptyProjectCount?: number;
  overdueCount?: number;
  onViewOverdue?: () => void;
  /** When true, hide the overdue banner (urgency summary shown in header instead). */
  suppressOverdueBanner?: boolean;
  /** Soft flash highlight for jump-to-card (e.g. most-late CTA). */
  highlightProjectId?: string | null;
  /** Keep these projects visible even when empty (e.g. just created). */
  forceVisibleProjectIds?: ReadonlySet<string>;
  /** Open the Quick Add form for this project card. */
  autoQuickAddProjectId?: string | null;
  /** Controlled Cards search (desktop lives in When/Layout; mobile keeps an in-view field). */
  cardQuery?: string;
  onCardQueryChange?: (value: string) => void;
  /** Empty-state CTA — opens Projects create. */
  onAddProject?: () => void;
}

function CardTaskMoreMenu({
  taskTitle,
  canRename,
  canDelete,
  onRename,
  onDelete,
}: {
  taskTitle: string;
  canRename: boolean;
  canDelete: boolean;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!canRename && !canDelete) return null;

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 140);
    }
    setOpen((v) => !v);
  };

  return (
    <div className={`relative shrink-0 ${open ? "" : "hover-reveal-desktop"}`} ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className={`inline-flex items-center justify-center p-1 rounded-md border transition-colors ${
          open
            ? "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#1a2d4a] border-slate-300 dark:border-[#3a5070]"
            : "text-slate-500 dark:text-slate-400 border-slate-200/90 dark:border-[#2a3f5f]/80 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/90 dark:hover:bg-[#1a2d4a]"
        }`}
        aria-label={`More actions for "${taskTitle}"`}
        aria-expanded={open}
        aria-haspopup="menu"
        title="More"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute right-0 z-40 min-w-[8.5rem] py-1 rounded-lg border border-slate-200 dark:border-[#3a5070] bg-white dark:bg-[#131d30] shadow-lg ${
            openUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          role="menu"
        >
          {canRename && onRename && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onRename();
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
            >
              Rename
            </button>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDelete();
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
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

/** Cards view: left accent only — full washes overwhelm the grid. */
function cardOverdueRowClass(): string {
  return OVERDUE_ROW_CLASS;
}

/** Chip + left rail carry urgency; titles stay readable slate. */
function overdueTitleClass(daysLate: number): string {
  if (daysLate >= 5) return "text-slate-800 dark:text-slate-100 font-semibold";
  return "text-slate-700 dark:text-slate-200 font-medium";
}

function CardDuePrefix({ task }: { task: Task }) {
  if (!task.dueDate) return null;

  const blocked = !!task.blocked;
  const overdue = !blocked && !task.someday && isDueDateOverdue(task.dueDate);
  // Overdue cards already show the Nd chip — skip duplicate [date] prefix.
  if (overdue) return null;

  const isToday = task.dueDate === getToday();
  const isTomorrow = task.dueDate === getTomorrow();
  const label = formatDueDate(task.dueDate);

  const tone = blocked
    ? "bg-amber-100/90 dark:bg-amber-950/45 text-amber-800 dark:text-amber-200 border-amber-200/80 dark:border-amber-700/45"
    : isToday
      ? "bg-amber-100/95 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 border-amber-300/90 dark:border-amber-600/55"
      : isTomorrow
        ? "bg-amber-50/95 dark:bg-amber-950/35 text-amber-800 dark:text-amber-200 border-amber-200/80 dark:border-amber-700/45"
        : "bg-slate-100/90 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-[#2a3f5f]/80";

  return (
    <span
      className={`${META_CHIP_CLASS} border ${tone}`}
      title={
        blocked
          ? "Waiting on external blocker"
          : isToday
            ? "Due today"
            : isTomorrow
              ? "Due tomorrow"
              : `Due ${label}`
      }
    >
      {label}
    </span>
  );
}

function CardHeaderCounts({
  open,
  completed,
  overdue,
}: {
  open: number;
  completed: number;
  overdue: number;
}) {
  if (open === 0 && completed === 0) return null;

  const title = `${open} open · ${completed} completed${overdue > 0 ? ` · ${overdue} overdue` : ""}`;

  return (
    <span className="text-xs app-text-meta tabular-nums leading-snug shrink-0 ml-auto pl-2 text-right" title={title}>
      <span className="text-slate-500 dark:text-slate-400">{open} open</span>
      {overdue > 0 && (
        <>
          <span className="text-slate-400 dark:text-slate-500"> · </span>
          <span className="urgency-text--mild font-medium">
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
  isOneThing = false,
  isTimerRunning,
  isExpanded,
  subtasksExpanded = false,
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
  onToggleSubtasks,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteTask,
}: {
  task: Task;
  projectId: string;
  activeTaskId: string | null;
  isOneThing?: boolean;
  isTimerRunning?: boolean;
  isExpanded?: boolean;
  subtasksExpanded?: boolean;
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
  onToggleSubtasks?: (taskId: string) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onDeleteTask?: (taskId: string) => void;
}) {
  const overdue = isActionableOverdue(task);
  const blocked = !!task.blocked;
  const isActive = activeTaskId === task.id;
  const dragEnabled = !!onTaskDragStart && !isEditing;
  const isDragging = dragTaskId === task.id;
  const isDragOver = dragOverTaskId === task.id && dragTaskId !== task.id;
  const daysLate = overdue && task.dueDate ? getDaysOverdue(task.dueDate) : 0;
  const overdueLabel = overdue ? formatOverdueLabel(daysLate) : null;
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
      className={`group/row relative rounded-md pl-0.5 sm:pl-1 pr-0.5 py-0.5 sm:py-1 min-w-0 transition-colors border border-transparent ${
        isActive
          ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400/40 border-blue-200/80 dark:border-transparent"
          : isExpanded
            ? "bg-violet-50/70 dark:bg-violet-900/15 border-violet-200/70 dark:border-transparent"
            : overdue
              ? cardOverdueRowClass()
              : blocked
                ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-transparent"
                : "hover:bg-slate-100/90 dark:hover:bg-white/[0.03] hover:border-slate-200/90 dark:hover:border-transparent"
      } ${dragEnabled ? "cursor-grab active:cursor-grabbing" : ""} ${
        isDragging ? "opacity-40" : ""
      } ${isDragOver ? "ring-1 ring-inset ring-blue-400/60 dark:ring-blue-500/50" : ""}`}
    >
      <div className="flex items-start sm:items-center gap-1 min-h-[2rem] sm:min-h-[2rem] w-full min-w-0">
        {onToggleComplete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 -ml-1 rounded-md hover:bg-slate-100/90 dark:hover:bg-white/[0.06] transition-colors"
            aria-label={`Mark "${task.title}" complete`}
          >
            <span
              className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-500 group-hover/row:border-blue-500 dark:group-hover/row:border-blue-400"
              aria-hidden
            />
          </button>
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
            className="flex-1 min-w-0 text-sm font-medium px-1 py-0 border border-blue-300 dark:border-blue-600 rounded bg-white text-slate-900 dark:bg-[#131d30] dark:text-white outline-none"
            autoFocus
            aria-label="Edit task title"
          />
        ) : (
          <TaskTitleButton
            title={task.title}
            onOpen={onToggleTaskDetail ? () => onToggleTaskDetail(task.id) : undefined}
            onRename={onStartEdit ? () => onStartEdit(task) : undefined}
            titleAttr={titleTooltip}
            className={`group/title relative flex-1 min-w-0 basis-0 flex items-start sm:items-center gap-1 sm:gap-1.5 text-sm font-normal leading-snug text-left hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-0.5 sm:py-0 ${
              overdue ? overdueTitleClass(daysLate) : "text-slate-700 dark:text-slate-200"
            }`}
          >
            {overdue && (
              <span
                className={`${META_CHIP_CLASS} ${overdueDayChipClass(daysLate)}`}
                title={overdueLabel ?? "Overdue"}
                aria-label={overdueLabel ?? "Overdue"}
              >
                {formatOverdueChip(daysLate)}
              </span>
            )}
            {task.kind && task.kind !== "task" && <TaskKindBadge kind={task.kind} size="compact" />}
            {isOneThing && <OneThingBadge size="compact" />}
            {task.priority != null && <TaskPriorityBadge priority={task.priority} size="compact" />}
            {task.dueDate && <CardDuePrefix task={task} />}
            <span className="min-w-0 line-clamp-2 break-words [overflow-wrap:anywhere]">{task.title}</span>
          </TaskTitleButton>
        )}
        {!isEditing && (
          <div className="shrink-0 flex items-start sm:items-center gap-0.5 pt-0.5 sm:pt-0 self-start">
            {(task.subtasks?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Details pane already includes subtasks — badge closes it.
                  if (isExpanded) onToggleTaskDetail?.(task.id);
                  else (onToggleSubtasks ?? onToggleTaskDetail)?.(task.id);
                }}
                className={`inline-flex items-center px-1.5 py-0.5 text-xs font-semibold tabular-nums rounded-md border transition-colors ${
                  subtasksExpanded || isExpanded
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 border-violet-300 dark:border-violet-700"
                    : "bg-violet-50 dark:bg-violet-900/25 text-violet-600 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-900/40"
                }`}
                title={
                  subtasksExpanded || isExpanded
                    ? `Hide subtasks (${task.subtasks!.filter((s) => s.completed).length}/${task.subtasks!.length})`
                    : `Show subtasks (${task.subtasks!.filter((s) => s.completed).length}/${task.subtasks!.length})`
                }
                aria-expanded={subtasksExpanded || !!isExpanded}
                aria-label={`${task.subtasks!.filter((s) => s.completed).length} of ${task.subtasks!.length} subtasks complete. ${subtasksExpanded || isExpanded ? "Hide" : "Show"} subtasks.`}
              >
                {task.subtasks!.filter((s) => s.completed).length}/{task.subtasks!.length}
              </button>
            )}
            {onToggleTaskDetail && (
              <span className={isExpanded ? "" : "hover-reveal-desktop"}>
                <TaskEditButton
                  compact
                  isOpen={isExpanded}
                  taskTitle={task.title}
                  className="!p-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTaskDetail(task.id);
                  }}
                />
              </span>
            )}
            <CardTaskMoreMenu
              taskTitle={task.title}
              canRename={!!onStartEdit}
              canDelete={!!onDeleteTask && !(isTimerRunning && isActive)}
              onRename={onStartEdit ? () => onStartEdit(task) : undefined}
              onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
            />
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
  doneTodayTasks = [],
  activeTaskId,
  oneThingTaskId = null,
  isTimerRunning,
  expandedTaskId,
  expandedSubtasksTaskId,
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
  onToggleSubtasks,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteTask,
  onExpandProject,
  onOpenProject,
  onQuickAdd,
  onToggleProjectFavorite,
  renderBelowTask,
  collapsed = false,
  onToggleCollapsed,
  highlighted = false,
  autoQuickAdd = false,
}: {
  project: Project;
  projectIndex: number;
  projectCount: number;
  tasks: Task[];
  completedCount: number;
  doneTodayTasks?: Task[];
  activeTaskId: string | null;
  oneThingTaskId?: string | null;
  isTimerRunning?: boolean;
  expandedTaskId?: string | null;
  expandedSubtasksTaskId?: string | null;
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
  onToggleSubtasks?: (taskId: string) => void;
  onQuickAdd: (title: string, projectId: string) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onDeleteTask?: (taskId: string) => void;
  onExpandProject?: (projectId: string) => void;
  onOpenProject?: (projectId: string) => void;
  onToggleProjectFavorite?: (projectId: string) => void;
  renderBelowTask?: (task: Task) => React.ReactNode;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  highlighted?: boolean;
  autoQuickAdd?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const touchOverIdRef = useRef<string | null>(null);
  const topTasks = sortCardTasks(tasks, activeTaskId).slice(0, 5);
  const remaining = tasks.length - topTasks.length;
  const overdueCount = tasks.filter((t) => isActionableOverdue(t)).length;
  const accentColor = resolveProjectColor(project);
  const canReorder = projectCount >= 2 && !!onProjectDragStart;
  const isDragging = dragProjectId === project.id;
  const isDropTarget = dragOverProjectId === project.id && dragProjectId !== project.id;

  useEffect(() => {
    if (showAdd) addInputRef.current?.focus();
  }, [showAdd]);

  useEffect(() => {
    if (!autoQuickAdd) return;
    setShowAdd(true);
  }, [autoQuickAdd]);

  const submitQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onQuickAdd(title, project.id);
    setDraft("");
    setShowAdd(false);
  };

  const projectUnderTouch = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    return el?.closest<HTMLElement>("[data-project-card-id]")?.dataset.projectCardId ?? null;
  };

  return (
    <article
      id={`project-card-${project.id}`}
      data-project-card-id={project.id}
      onDragOver={(e) => {
        if (!canReorder || !onProjectDragOver || !dragProjectId) return;
        onProjectDragOver(e, project.id);
      }}
      onDrop={(e) => {
        if (!canReorder || !onProjectDrop || !dragProjectId) return;
        e.preventDefault();
        onProjectDrop(project.id);
      }}
      className={`group/card project-surface project-accent-edge rounded-2xl px-2 py-2 sm:px-3.5 sm:py-3 min-w-0 flex flex-col gap-1 sm:gap-2 transition-[colors,box-shadow] duration-300 ${isDragging ? "opacity-40" : ""} ${
        isDropTarget ? "ring-2 ring-blue-400/70 ring-offset-1 ring-offset-transparent" : ""
      } ${collapsed ? "bg-slate-100/95 dark:bg-[#121c2e] border-dashed opacity-95" : ""} ${
        project.favorite && !collapsed
          ? "ring-1 ring-amber-400/50 dark:ring-amber-500/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]"
          : ""
      } ${
        highlighted
          ? "ring-2 ring-[var(--urgency-chip)] dark:ring-rose-400 shadow-[0_0_0_4px_color-mix(in_srgb,var(--urgency-chip)_22%,transparent)]"
          : ""
      }`}
      style={{ ["--project-accent" as string]: accentColor } as React.CSSProperties}
      data-collapsed={collapsed ? "true" : "false"}
    >
      <header
        className={`flex flex-col gap-0 min-w-0 pb-1 mb-0.5 sm:pb-1.5 border-b border-slate-200/70 dark:border-[#243350]/80 ${
          collapsed ? "pb-0 mb-0 border-b-0" : ""
        }`}
        style={{
          borderBottomColor: collapsed ? "transparent" : `color-mix(in srgb, ${accentColor} 32%, #94a3b8)`,
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
              onTouchStart={(e) => {
                if (!onProjectDragStart) return;
                e.stopPropagation();
                touchOverIdRef.current = project.id;
                onProjectDragStart(project.id);
              }}
              onTouchMove={(e) => {
                if (!onProjectDragStart || !onProjectDragOver) return;
                const touch = e.touches[0];
                if (!touch) return;
                const overId = projectUnderTouch(touch.clientX, touch.clientY);
                if (!overId || overId === touchOverIdRef.current) return;
                touchOverIdRef.current = overId;
                onProjectDragOver(
                  { preventDefault() {}, stopPropagation() {} } as React.DragEvent,
                  overId,
                );
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                const targetId = touchOverIdRef.current;
                touchOverIdRef.current = null;
                if (targetId && targetId !== project.id) onProjectDrop?.(targetId);
                else onProjectDragEnd?.();
              }}
              onTouchCancel={() => {
                touchOverIdRef.current = null;
                onProjectDragEnd?.();
              }}
              className="hidden sm:inline-flex text-slate-300 dark:text-slate-600 shrink-0 cursor-grab active:cursor-grabbing touch-none p-1.5 -ml-0.5 rounded hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a]"
              title="Drag to reorder projects"
              aria-label={`Drag ${project.name} to reorder`}
            >
              <GripIcon />
            </span>
          ) : null}
          {canReorder && onMoveProject ? (
            <div className="sm:hidden flex flex-col shrink-0 -space-y-0.5 -ml-0.5">
              <button
                type="button"
                onClick={() => onMoveProject(project.id, "up")}
                disabled={projectIndex === 0}
                className="p-0 h-5 w-5 flex items-center justify-center rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a] disabled:opacity-30"
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
                className="p-0 h-5 w-5 flex items-center justify-center rounded-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a] disabled:opacity-30"
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
              className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                project.favorite
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 hover:bg-amber-200/90 dark:hover:bg-amber-900/50"
                  : "text-slate-400 dark:text-slate-500 hover:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-950/30"
              }`}
              title={
                project.favorite
                  ? "Pinned — click to unpin (pinned cards appear first)"
                  : "Pin — keep this project at the top"
              }
              aria-label={project.favorite ? `Unpin ${project.name}` : `Pin ${project.name} to top`}
              aria-pressed={!!project.favorite}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill={project.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={project.favorite ? 0 : 1.5} aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ) : project.favorite ? (
            <span
              title="Pinned — appears first in card view"
              className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400"
              aria-hidden
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          ) : null}
          <span
            className="project-accent-swatch w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
            title={`${project.name} color — change in Projects`}
            aria-label={`${project.name} color`}
          />
          <button
            type="button"
            onClick={() => {
              if (collapsed) onToggleCollapsed?.();
              onOpenProject?.(project.id);
            }}
            className="flex-1 min-w-0 truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight text-left hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            title={`View all tasks in ${project.name}`}
          >
            {project.name}
          </button>
          <CardHeaderCounts
            open={tasks.length}
            completed={completedCount}
            overdue={overdueCount}
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
          {overdueCount > 0 ? ` · ${overdueCount} late` : ""}
          {doneTodayTasks.length > 0 ? ` · ${doneTodayTasks.length} done today` : ""} — click to expand
        </button>
      ) : (
        <>
          <div className="flex-1 flex flex-col gap-0 sm:gap-0.5 min-h-0">
            {topTasks.length === 0 ? (
              <p className="app-text-meta text-slate-400 dark:text-slate-500 py-0.5">No tasks</p>
            ) : (
              topTasks.map((task) => (
                <div key={task.id} className="min-w-0">
                  <CardTaskRow
                    task={task}
                    projectId={project.id}
                    activeTaskId={activeTaskId}
                    isOneThing={oneThingTaskId === task.id}
                    isTimerRunning={isTimerRunning}
                    isExpanded={expandedTaskId === task.id}
                    subtasksExpanded={expandedSubtasksTaskId === task.id}
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
                    onToggleSubtasks={onToggleSubtasks}
                    onStartEdit={onStartEdit}
                    onEditTitleChange={onEditTitleChange}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                    onDeleteTask={onDeleteTask}
                  />
                  {renderBelowTask?.(task)}
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-2 border-t border-slate-200/60 dark:border-[#243350]/70 space-y-1.5">
            {onToggleComplete && doneTodayTasks.length > 0 ? (
              <DoneTodaySection
                tasks={doneTodayTasks.slice(0, 5)}
                onToggleComplete={onToggleComplete}
                compact
                flush
              />
            ) : null}

            <div className="no-print flex flex-wrap items-center gap-2">
              {!showAdd && (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-300/90 dark:border-blue-600/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm"
                  aria-label="Quick Add"
                >
                  Quick Add
                </button>
              )}
              {remaining > 0 && onExpandProject && (
                <button
                  type="button"
                  onClick={() => onExpandProject(project.id)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  View all ({remaining} more)
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
          </div>
        </>
      )}
    </article>
  );
}

export default function TaskCardView({
  projects,
  tasksByProject,
  completedCountByProject,
  doneTodayByProject,
  activeTaskId,
  oneThingTaskId = null,
  isTimerRunning,
  expandedTaskId,
  expandedSubtasksTaskId,
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
  onToggleSubtasks,
  onToggleProjectFavorite,
  renderBelowTask,
  hideEmptyProjects = true,
  onToggleHideEmptyProjects,
  emptyProjectCount = 0,
  overdueCount = 0,
  onViewOverdue,
  suppressOverdueBanner = false,
  highlightProjectId = null,
  forceVisibleProjectIds,
  autoQuickAddProjectId = null,
  cardQuery: cardQueryProp,
  onCardQueryChange,
  onAddProject,
}: TaskCardViewProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [cardQueryLocal, setCardQueryLocal] = useState("");
  const cardQuery = cardQueryProp ?? cardQueryLocal;
  const setCardQuery = onCardQueryChange ?? setCardQueryLocal;

  useEffect(() => {
    setCollapsedIds(loadCollapsedProjectIds());
  }, []);

  useEffect(() => {
    const expandId = highlightProjectId ?? autoQuickAddProjectId;
    if (!expandId) return;
    setCollapsedIds((prev) => {
      if (!prev.has(expandId)) return prev;
      const next = new Set(prev);
      next.delete(expandId);
      persistCollapsedProjectIds(next);
      return next;
    });
  }, [highlightProjectId, autoQuickAddProjectId]);

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

  const query = cardQuery.trim().toLowerCase();

  const filteredTasksByProject = useMemo(() => {
    if (!query) return tasksByProject;
    const next = new Map<string, Task[]>();
    for (const [projectId, list] of tasksByProject) {
      const project = projects.find((p) => p.id === projectId);
      const nameHit = !!project?.name.toLowerCase().includes(query);
      const matched = nameHit
        ? list
        : list.filter((t) => t.title.toLowerCase().includes(query));
      if (matched.length > 0 || nameHit) next.set(projectId, matched);
    }
    return next;
  }, [tasksByProject, projects, query]);

  const visibleProjects = useMemo(() => {
    const source = query
      ? projects.filter(
          (p) =>
            forceVisibleProjectIds?.has(p.id) ||
            filteredTasksByProject.has(p.id) ||
            p.name.toLowerCase().includes(query),
        )
      : hideEmptyProjects
        ? projects.filter(
            (p) =>
              forceVisibleProjectIds?.has(p.id) ||
              (tasksByProject.get(p.id) ?? []).length > 0 ||
              (doneTodayByProject?.get(p.id) ?? []).length > 0,
          )
        : projects;
    return source;
  }, [
    projects,
    tasksByProject,
    filteredTasksByProject,
    doneTodayByProject,
    hideEmptyProjects,
    forceVisibleProjectIds,
    query,
  ]);

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

  const showSecondaryTools =
    (!suppressOverdueBanner && overdueCount > 0 && !!onViewOverdue) ||
    (!!onToggleHideEmptyProjects && emptyProjectCount > 0 && !query) ||
    collapsedVisibleCount > 0 ||
    !!query;

  return (
    <div className="pb-3 pt-0.5">
      {/* Portrait phone only — landscape inlines search in MobileTaskToolbar */}
      <div className="panel-pad-x mb-1.5 roomy:hidden land-compact:hidden">
        <label className="relative block w-full">
          <span className="sr-only">Search projects and tasks</span>
          <svg
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            type="search"
            value={cardQuery}
            onChange={(e) => setCardQuery(e.target.value)}
            placeholder="Filter projects or tasks…"
            className="w-full pl-7 pr-2.5 py-1 min-h-[1.875rem] text-xs rounded-md border border-[var(--control-border)] dark:border-blue-500/45 bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-400"
            aria-label="Filter projects or tasks"
          />
        </label>
      </div>
      {showSecondaryTools && (
      <div className="panel-pad-x mb-1.5 flex flex-wrap items-center gap-2">
        {!suppressOverdueBanner && overdueCount > 0 && onViewOverdue && (
          <button
            type="button"
            onClick={onViewOverdue}
            className="urgency-pill inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target-sm !min-h-0"
          >
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full urgency-chip--mid text-xs font-bold tabular-nums">
              {overdueCount}
            </span>
            overdue — view all
          </button>
        )}
        {onToggleHideEmptyProjects && emptyProjectCount > 0 && !query && (
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
        {query && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            {visibleProjects.length} project{visibleProjects.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      )}

      {/* Grid keeps card tops aligned; CSS columns was a masonry flow that staggered rows */}
      <div className="panel-pad-x grid grid-cols-1 min-[480px]:grid-cols-2 roomy:grid-cols-3 roomy:lg:grid-cols-4 print:grid-cols-2 gap-x-2.5 sm:gap-x-3 gap-y-2.5 sm:gap-y-3.5">
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
              tasks={filteredTasksByProject.get(project.id) ?? []}
              completedCount={completedCountByProject?.get(project.id) ?? 0}
              doneTodayTasks={doneTodayByProject?.get(project.id) ?? []}
              activeTaskId={activeTaskId}
              oneThingTaskId={oneThingTaskId}
              isTimerRunning={isTimerRunning}
              expandedTaskId={expandedTaskId}
              expandedSubtasksTaskId={expandedSubtasksTaskId}
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
              onToggleSubtasks={onToggleSubtasks}
              onStartEdit={onStartEdit}
              onEditTitleChange={onEditTitleChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDeleteTask={onDeleteTask}
              onExpandProject={onExpandProject}
              onOpenProject={onOpenProject}
              onQuickAdd={onQuickAdd}
              onToggleProjectFavorite={onToggleProjectFavorite}
              renderBelowTask={renderBelowTask}
              collapsed={collapsedIds.has(project.id)}
              onToggleCollapsed={() => toggleCollapsed(project.id)}
              highlighted={highlightProjectId === project.id}
              autoQuickAdd={autoQuickAddProjectId === project.id}
            />
          );
        })}
      </div>

      {visibleProjects.length === 0 && (
        <div className="px-4 py-6 text-sm text-center text-slate-500 dark:text-slate-400 space-y-3">
          {query ? (
            <p>No projects or tasks match “{cardQuery.trim()}”.</p>
          ) : hideEmptyProjects ? (
            <p>
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
          ) : (
            <>
              <p>No projects yet.</p>
              {onAddProject && (
                <AddProjectButton onClick={onAddProject} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
