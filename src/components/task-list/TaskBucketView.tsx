"use client";

import React, { useEffect, useRef, useState } from "react";
import { DEFAULT_PROJECT_ID, type Project, type Task } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { formatDueDate, getDaysOverdue, isDueDateOverdue, MAX_TASK_TITLE } from "@/components/task-list/utils";
import { DueDateField } from "@/components/task-list/DueDateField";
import { TaskEditButton } from "@/components/task-list/TaskEditButton";
import { ProjectTaskCounts } from "@/components/task-list/ProjectTaskCounts";
import { MiniPlayPauseIcon } from "@/components/FocusStripControls";
import {
  tasksInSwimlane,
  type BucketDropTarget,
  type BucketSwimlaneId,
} from "@/components/task-list/bucket-order";
import { isActionableOverdue } from "@/lib/task-status";
import { TaskPriorityBadge } from "@/components/task-list/TaskPriorityBadge";
import { QuickAddForm } from "@/components/task-list/QuickAddForm";

function BucketColumnTitle({ project }: { project: Project }) {
  const subtitle = project.description?.trim();
  const showSubtitle = !!subtitle && subtitle !== project.name;

  return (
    <div className="min-w-0 flex-1">
      <h3
        className="truncate text-sm sm:text-base font-semibold tracking-tight text-slate-900 dark:text-white leading-tight"
        title={project.name}
      >
        {project.name}
      </h3>
      {showSubtitle && (
        <p
          className="hidden lg:block truncate text-xs app-text-meta font-normal leading-tight mt-0.5 text-slate-500 dark:text-slate-400"
          title={subtitle}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Mobile: one full column with peek; desktop: fixed-width columns for readable titles. */
const BUCKET_COLUMN_CLASS =
  "flex-[0_0_calc(100%-1.5rem)] sm:flex-[0_0_min(100%,22rem)] md:flex-[0_0_min(100%,24rem)] lg:flex-[0_0_min(100%,26rem)] min-w-0";

interface TaskBucketViewProps {
  projects: Project[];
  tasksByProject: Map<string, Task[]>;
  /** Non-archived completed tasks per project (for column header counts). */
  completedCountByProject?: Map<string, number>;
  activeTaskId: string | null;
  isTimerRunning: boolean;
  /** Label for the dated (in-scope) swimlane, e.g. "Due today". */
  datedLaneLabel?: string;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
  onQuickAdd: (title: string, projectId: string) => void;
  onToggleProjectFavorite?: (projectId: string) => void;
  /** Focus on a single project in the full-screen list view. */
  onExpandProject?: (projectId: string) => void;
  editingTaskId?: string | null;
  editTitle?: string;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onSetDueDate?: (taskId: string, date: string | undefined) => void;
  expandedTaskId?: string | null;
  onToggleTaskDetail?: (taskId: string) => void;
  onBucketDrop?: (draggedTaskId: string, target: BucketDropTarget) => void;
  onBucketMove?: (taskId: string, direction: "up" | "down") => void;
  renderBelowTask?: (task: Task, compact?: boolean) => React.ReactNode;
  /** When set, scroll the matching column into view (use scrollToProjectToken to re-trigger). */
  scrollToProjectId?: string | null;
  scrollToProjectToken?: number;
}

const LANE_COLLAPSE_THRESHOLD = 4;

/** Low-urgency lanes — collapsed by default so overdue/dated stay above the fold. */
const DEFAULT_COLLAPSED_LANES: BucketSwimlaneId[] = ["undated", "someday", "blocked"];

const ALWAYS_COLLAPSIBLE_LANES = new Set<BucketSwimlaneId>(DEFAULT_COLLAPSED_LANES);

interface BucketSwimlane {
  id: string;
  label: string;
  tasks: Task[];
}

function buildSwimlanes(
  tasks: Task[],
  activeTaskId: string | null,
  datedLaneLabel: string
): BucketSwimlane[] {
  const today = getToday();
  const datedTasks = tasksInSwimlane(tasks, "dated", activeTaskId);

  let datedLabel = datedLaneLabel;
  if (datedTasks.length > 0) {
    const allToday = datedTasks.every((t) => t.dueDate === today);
    const someToday = datedTasks.some((t) => t.dueDate === today);
    if (allToday) datedLabel = "Due today";
    else if (someToday) datedLabel = "Due today & upcoming";
  }

  const laneDefs: { id: BucketSwimlaneId; label: string }[] = [
    { id: "overdue", label: "Overdue" },
    { id: "dated", label: datedLabel },
    { id: "blocked", label: "Waiting" },
    { id: "undated", label: "No date" },
    { id: "someday", label: "Someday" },
  ];

  return laneDefs.flatMap(({ id, label }) => {
    const laneTasks = tasksInSwimlane(tasks, id, activeTaskId);
    return laneTasks.length > 0 ? [{ id, label, tasks: laneTasks }] : [];
  });
}

function DueBadge({
  dueDate,
  taskId,
  onSetDueDate,
  compact = false,
  blocked = false,
}: {
  dueDate: string;
  taskId?: string;
  onSetDueDate?: (taskId: string, date: string | undefined) => void;
  compact?: boolean;
  blocked?: boolean;
}) {
  const today = getToday();
  const overdue = !blocked && isDueDateOverdue(dueDate);
  const isToday = dueDate === today;
  const daysLate = overdue ? getDaysOverdue(dueDate) : 0;
  const criticalOverdue = daysLate >= 7;
  const label = isToday ? "Today" : formatDueDate(dueDate);
  const interactive = !!(taskId && onSetDueDate);

  const badgeClass = `inline-flex items-center gap-0.5 font-semibold shrink-0 leading-none ${
    compact ? "text-xs px-1.5 py-0.5 rounded-md" : "text-xs gap-1 px-2 py-0.5 rounded-md"
  } ${
    overdue
      ? criticalOverdue
        ? "text-red-800 dark:text-red-200 bg-red-200/90 dark:bg-red-900/60 border border-red-400/80 dark:border-red-700/70"
        : "text-red-700 dark:text-red-300 bg-red-100/90 dark:bg-red-950/50 border border-red-200/80 dark:border-red-800/50"
      : blocked
        ? "text-amber-800 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/45 border border-amber-200/80 dark:border-amber-700/45"
        : isToday
          ? "text-amber-800 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/45 border border-amber-200/80 dark:border-amber-700/45"
          : "text-slate-700 dark:text-slate-200 bg-slate-100/95 dark:bg-white/8 border border-slate-300/80 dark:border-[#2a3f5f]/80"
  } ${interactive ? "cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-600" : ""}`;

  const badgeTitle =
    blocked
      ? "Waiting on external blocker"
      : overdue
        ? `${daysLate}d overdue${interactive ? " — click to change" : ""}`
        : isToday
          ? "Due today"
          : interactive
            ? "Change due date"
            : undefined;

  const badgeContent = (
    <>
      {!compact && (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {label}
      {overdue && daysLate > 1 && (
        <span className="opacity-75 font-medium">{daysLate}d</span>
      )}
    </>
  );

  if (!interactive) {
    return (
      <span className={badgeClass} title={badgeTitle}>
        {badgeContent}
      </span>
    );
  }

  return (
    <DueDateField
      value={dueDate}
      onChange={(date) => onSetDueDate!(taskId!, date)}
      ariaLabel="Change due date"
      className={badgeClass}
    >
      <span className="inline-flex items-center gap-0.5" title={badgeTitle}>
        {badgeContent}
      </span>
    </DueDateField>
  );
}

function BucketTaskCard({
  task,
  isActive,
  isTimerRunning,
  isEditing,
  editTitle,
  isDragging,
  isDragOver,
  dragEnabled,
  onToggleComplete,
  onStartTask,
  onSelectTask,
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onSetDueDate,
  isDetailOpen,
  onToggleTaskDetail,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  task: Task;
  isActive: boolean;
  isTimerRunning: boolean;
  isEditing: boolean;
  editTitle: string;
  isDragging?: boolean;
  isDragOver?: boolean;
  dragEnabled?: boolean;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onSetDueDate?: (taskId: string, date: string | undefined) => void;
  isDetailOpen?: boolean;
  onToggleTaskDetail?: (taskId: string) => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const canEdit = !!onStartEdit;
  const canOpenDetail = !!onToggleTaskDetail;
  const isBlocked = !!task.blocked;
  const isOverdue = isActionableOverdue(task);
  const isDueToday = !isBlocked && !isOverdue && task.dueDate === getToday();
  const isLowUrgency = !isBlocked && !task.dueDate;
  const compactPlayBtn = (playing: boolean, filled: boolean) =>
    `w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${
      playing || filled
        ? "bg-cyan-600 text-white shadow-sm shadow-cyan-500/25 hover:bg-cyan-700"
        : "text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50/90 dark:hover:bg-cyan-950/40"
    }`;
  const playVisible = isActive || isTimerRunning;

  return (
    <div
      data-bucket-task-id={task.id}
      draggable={dragEnabled && !isEditing}
      onDragStart={(e) => {
        if (!dragEnabled || isEditing) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart?.();
      }}
      onDragOver={(e) => {
        if (!dragEnabled) return;
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => {
        if (!dragEnabled) return;
        e.preventDefault();
        e.stopPropagation();
        onDrop?.();
      }}
      onDragEnd={onDragEnd}
      className={`group relative rounded-lg border px-2 py-1.5 transition-all duration-150 ${
        isDetailOpen
          ? "border-violet-200/90 dark:border-violet-500/40 bg-violet-50/80 dark:bg-violet-950/25"
          : isActive && isTimerRunning
            ? "border-cyan-300/90 dark:border-cyan-500/50 bg-cyan-50/95 dark:bg-cyan-950/35 ring-2 ring-cyan-500/40 shadow-sm shadow-cyan-500/10"
          : isActive
            ? "border-cyan-200/90 dark:border-cyan-500/40 bg-cyan-50/90 dark:bg-cyan-950/30 ring-1 ring-cyan-400/30"
            : isBlocked
              ? "border-amber-200/80 dark:border-amber-800/50 border-l-[3px] border-l-amber-500 dark:border-l-amber-400 bg-amber-50/55 dark:bg-amber-950/20 hover:border-amber-300/90 dark:hover:border-amber-700/60 hover:bg-amber-50/80 dark:hover:bg-amber-950/30"
              : isOverdue
              ? "border-red-200/80 dark:border-red-800/50 border-l-[3px] border-l-red-500 dark:border-l-red-400 bg-red-50/75 dark:bg-red-950/45 hover:border-red-300/90 dark:hover:border-red-700/60 hover:bg-red-50/90 dark:hover:bg-red-950/55"
              : isDueToday
              ? "border-amber-200/70 dark:border-amber-800/45 bg-amber-50/65 dark:bg-amber-950/38 hover:border-amber-300/85 dark:hover:border-amber-700/55 hover:bg-amber-50/85 dark:hover:bg-amber-950/48"
              : isLowUrgency
              ? "border-slate-200/45 dark:border-[#1a2438]/80 bg-slate-50/35 dark:bg-black/25 hover:border-slate-300/60 dark:hover:border-[#223048] hover:bg-slate-50/50 dark:hover:bg-black/20"
              : "border-slate-200/75 dark:border-[#2a3f5f]/90 bg-white/80 dark:bg-white/[0.03] hover:border-slate-300/90 dark:hover:border-[#3a5070] hover:bg-slate-50/90 dark:hover:bg-white/[0.05]"
      } ${isDragging ? "opacity-40 scale-[0.99]" : ""} ${
        isDragOver
          ? "before:absolute before:inset-x-2 before:top-0 before:h-0.5 before:rounded-full before:bg-cyan-500 dark:before:bg-cyan-400"
          : ""
      }`}
    >
      <div className="flex items-start gap-1.5 min-h-[1.5rem]">
        {onMoveUp && onMoveDown && (
          <div className="sm:hidden flex flex-col -my-0.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp}
              className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
              aria-label="Move up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown}
              className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
              aria-label="Move down"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
        {dragEnabled && (
          <div
            className="hidden sm:flex flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-[3px]"
            aria-hidden
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
            </svg>
          </div>
        )}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`w-4 h-4 mt-[3px] rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-slate-300/90 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500"
          }`}
          aria-label={`Mark "${task.title}" complete`}
        >
          {task.completed && (
            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
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
            onClick={(e) => e.stopPropagation()}
            maxLength={MAX_TASK_TITLE}
            className="flex-1 min-w-0 text-sm font-medium px-1 py-0 border border-cyan-300 dark:border-cyan-600 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
            autoFocus
            aria-label="Edit task title"
          />
        ) : canEdit ? (
          <button
            type="button"
            onClick={() => onStartEdit?.(task)}
            className="flex-1 min-w-0 text-left text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={task.title}
          >
            {task.title}
          </button>
        ) : (
          <p
            className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-2"
            title={task.title}
          >
            {task.title}
          </p>
        )}
        {!isEditing && canOpenDetail && (
          <TaskEditButton
            isOpen={isDetailOpen}
            taskTitle={task.title}
            className="mt-[1px]"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTaskDetail!(task.id);
            }}
          />
        )}
        {!isEditing && (
          <div
            className={`shrink-0 mt-[1px] transition-opacity duration-150 ${
              isActive
                ? "opacity-100"
                : "flex sm:block sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            }`}
          >
            {isActive && isTimerRunning ? (
              <span
                className={`${compactPlayBtn(true, true)} cursor-default`}
                title="Timer running on this task"
                aria-label="Active — timer running"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            ) : isActive ? (
              <button
                type="button"
                onClick={() => onSelectTask(null)}
                className={compactPlayBtn(false, false)}
                title="Clear selection"
                aria-label="Clear focus selection"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartTask(task.id)}
                className={compactPlayBtn(false, false)}
                title={`Focus on "${task.title}" — starts timer`}
                aria-label={`Focus on "${task.title}"`}
              >
                <MiniPlayPauseIcon playing={false} size="sm" />
              </button>
            )}
          </div>
        )}
      </div>
      {!isEditing && (
        <div className="flex flex-wrap items-center gap-1.5 mt-1 pl-6 sm:pl-7">
          {task.priority != null && <TaskPriorityBadge priority={task.priority} size="compact" />}
          {isActive && isTimerRunning && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold uppercase rounded bg-cyan-600 text-white">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" aria-hidden />
              Timing
            </span>
          )}
          {isActive && !isTimerRunning && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold uppercase rounded bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/50">
              Selected
            </span>
          )}
          {task.dueDate && (
            <DueBadge dueDate={task.dueDate} taskId={task.id} onSetDueDate={onSetDueDate} compact blocked={isBlocked} />
          )}
          {!task.dueDate && onSetDueDate && (
            <DueDateField
              value={undefined}
              onChange={(date) => date && onSetDueDate(task.id, date)}
              requireExplicitPick
              ariaLabel="Set due date"
              className="inline-flex items-center gap-0.5 shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-md border border-dashed border-slate-300/70 dark:border-slate-500/60 text-slate-400 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-600 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 cursor-pointer transition-colors"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Set date</span>
            </DueDateField>
          )}
          {(task.subtasks?.length ?? 0) > 0 && (
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 tabular-nums">
              {task.subtasks!.filter((s) => s.completed).length}/{task.subtasks!.length} subtasks
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function BucketColumn({
  project,
  tasks,
  completedCount = 0,
  datedLaneLabel,
  activeTaskId,
  isTimerRunning,
  dragTaskId,
  dragOverTaskId,
  dragOverColumn,
  dragEnabled,
  onToggleComplete,
  onStartTask,
  onSelectTask,
  onQuickAdd,
  onToggleProjectFavorite,
  onExpandProject,
  editingTaskId,
  editTitle = "",
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onSetDueDate,
  expandedTaskId,
  onToggleTaskDetail,
  onDragStart,
  onDragOverTask,
  onDragOverLane,
  onDropOnTask,
  onDropOnLane,
  onDragEnd,
  onBucketMove,
  renderBelowTask,
}: {
  project: Project;
  tasks: Task[];
  completedCount?: number;
  datedLaneLabel: string;
  activeTaskId: string | null;
  isTimerRunning: boolean;
  dragTaskId: string | null;
  dragOverTaskId: string | null;
  dragOverColumn: { projectId: string; swimlaneId: BucketSwimlaneId } | null;
  dragEnabled: boolean;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
  onQuickAdd: (title: string, projectId: string) => void;
  onToggleProjectFavorite?: (projectId: string) => void;
  onExpandProject?: (projectId: string) => void;
  editingTaskId?: string | null;
  editTitle?: string;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (value: string) => void;
  onSaveEdit?: (taskId: string) => void;
  onCancelEdit?: () => void;
  onSetDueDate?: (taskId: string, date: string | undefined) => void;
  expandedTaskId?: string | null;
  onToggleTaskDetail?: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragOverTask: (taskId: string) => void;
  onDragOverLane: (swimlaneId: BucketSwimlaneId) => void;
  onDropOnTask: (taskId: string, swimlaneId: BucketSwimlaneId) => void;
  onDropOnLane: (swimlaneId: BucketSwimlaneId) => void;
  onDragEnd: () => void;
  onBucketMove?: (taskId: string, direction: "up" | "down") => void;
  renderBelowTask?: (task: Task, compact?: boolean) => React.ReactNode;
}) {
  const [draft, setDraft] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const topAddInputRef = useRef<HTMLInputElement>(null);
  const swimlanes = buildSwimlanes(tasks, activeTaskId, datedLaneLabel);
  const showLaneHeaders = tasks.length > 0;
  const [collapsedLanes, setCollapsedLanes] = useState<Set<BucketSwimlaneId>>(
    () => new Set(DEFAULT_COLLAPSED_LANES)
  );

  const submitQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onQuickAdd(title, project.id);
    setDraft("");
  };

  const focusAddInput = () => {
    (tasks.length > 0 ? topAddInputRef : addInputRef).current?.focus();
  };

  const toggleLane = (laneId: BucketSwimlaneId) => {
    setCollapsedLanes((prev) => {
      const next = new Set(prev);
      if (next.has(laneId)) next.delete(laneId);
      else next.add(laneId);
      return next;
    });
  };

  const columnHighlighted =
    dragOverColumn?.projectId === project.id && dragTaskId != null;
  const isPersonal = project.id === DEFAULT_PROJECT_ID;

  return (
    <div
      data-bucket-project={project.id}
      className={`${BUCKET_COLUMN_CLASS} flex flex-col rounded-2xl min-h-[10rem] max-h-[calc(100vh-12.5rem)] sm:max-h-[calc(100vh-11rem)] transition-all duration-200 backdrop-blur-sm ${
        isPersonal
          ? "bg-slate-50/95 dark:bg-[#151c2c]/95 border border-slate-200/90 dark:border-slate-600/40 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05)] dark:shadow-none"
          : "bg-white/95 dark:bg-[#131d30]/90 border border-slate-200/80 dark:border-[#243350]/70 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_12px_28px_-8px_rgba(15,23,42,0.1)] dark:shadow-none"
      } ${columnHighlighted ? "ring-2 ring-cyan-400/30 dark:ring-cyan-500/35" : ""}`}
    >
      <div
        className={`group/col flex items-center gap-2.5 px-3 py-3 shrink-0 lg:min-h-[4.25rem] rounded-t-2xl ${
          isPersonal
            ? "bg-gradient-to-br from-slate-100/90 to-slate-50/50 dark:from-slate-800/55 dark:to-[#151c2c]/40 border-b border-slate-200/80 dark:border-slate-600/30"
            : project.color
              ? "border-b border-slate-200/60 dark:border-[#243350]/60"
              : "border-b border-slate-200/60 dark:border-[#243350]/60"
        }`}
        style={
          !isPersonal && project.color
            ? {
                background: `linear-gradient(135deg, color-mix(in srgb, ${project.color} 12%, transparent), transparent 72%)`,
              }
            : undefined
        }
        title={project.description?.trim() || project.name}
      >
        {onToggleProjectFavorite ? (
          <button
            type="button"
            onClick={() => onToggleProjectFavorite(project.id)}
            className={`flex-shrink-0 touch-target-sm p-0.5 rounded transition-colors ${
              project.favorite
                ? "text-amber-400 hover:text-amber-500"
                : "text-slate-300 dark:text-slate-600 opacity-100 sm:opacity-0 sm:group-hover/col:opacity-100 hover:!opacity-100 focus-visible:opacity-100 hover:text-amber-400"
            }`}
            title={
              project.favorite
                ? "Pinned — click to unpin (pinned columns appear first)"
                : "Pin project — show this column first"
            }
            aria-label={project.favorite ? `Unpin ${project.name}` : `Pin ${project.name}`}
            aria-pressed={!!project.favorite}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill={project.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={project.favorite ? 0 : 1.5}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ) : project.favorite ? (
          <span title="Pinned — appears first in bucket view" className="flex-shrink-0">
            <svg
              className="w-3.5 h-3.5 text-amber-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-label="Pinned project"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
        ) : null}
        {project.color && (
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10"
            style={{ backgroundColor: project.color }}
            title={`${project.name} color`}
            aria-hidden
          />
        )}
        <BucketColumnTitle project={project} />
        {isPersonal && (
          <span
            className="text-xs font-medium text-slate-600 dark:text-slate-200 bg-slate-100/95 dark:bg-[#1e3050]/90 border border-slate-200/90 dark:border-[#3a5070]/70 rounded-full px-2 py-1 shrink-0"
            title="Personal tasks — your default bucket"
          >
            Personal
          </span>
        )}
        <ProjectTaskCounts
          variant="badge"
          open={tasks.length}
          completed={completedCount}
          overdue={tasks.filter((t) => isActionableOverdue(t)).length}
        />
        {onExpandProject && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onExpandProject(project.id); }}
            className="flex-shrink-0 touch-target-sm p-1 rounded-md text-slate-400 dark:text-slate-500 opacity-100 sm:opacity-0 sm:group-hover/col:opacity-100 hover:!opacity-100 focus-visible:opacity-100 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-all"
            title={`View ${project.name} full screen`}
            aria-label={`Expand ${project.name} to full view`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}
      </div>

      {tasks.length > 0 && (
        <QuickAddForm
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitQuickAdd}
          inputRef={topAddInputRef}
          className="px-3 pt-2 pb-2 shrink-0 border-b border-slate-200/60 dark:border-[#243350]/50"
        />
      )}

      <div
        className="flex-1 overflow-y-auto px-2 pb-2 pt-0.5 min-h-[80px]"
        onDragOver={(e) => {
          if (!dragEnabled || !dragTaskId) return;
          e.preventDefault();
          onDragOverLane("undated");
        }}
        onDrop={(e) => {
          if (!dragEnabled || !dragTaskId) return;
          e.preventDefault();
          onDropOnLane(tasks.length === 0 ? "undated" : (dragOverColumn?.swimlaneId ?? "undated"));
        }}
      >
        {tasks.length === 0 ? (
          <p className="text-sm app-text-meta text-slate-400 dark:text-slate-500 text-center py-6 px-2">
            {dragEnabled && dragTaskId ? (
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">Drop here to move</span>
            ) : (
              <>
                No tasks ·{" "}
                <button
                  type="button"
                  onClick={focusAddInput}
                  className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  + Add
                </button>
              </>
            )}
          </p>
        ) : (
          <div className="space-y-4">
            {swimlanes.map((lane) => {
              const swimlaneId = lane.id as BucketSwimlaneId;
              const laneHighlighted =
                dragOverColumn?.projectId === project.id && dragOverColumn.swimlaneId === swimlaneId;
              const isCollapsible =
                ALWAYS_COLLAPSIBLE_LANES.has(swimlaneId) ||
                lane.tasks.length >= LANE_COLLAPSE_THRESHOLD;
              const isCollapsed = collapsedLanes.has(swimlaneId);
              return (
              <div
                key={lane.id}
                className={`${laneHighlighted ? "ring-1 ring-cyan-400/40 rounded-xl" : ""}`}
                onDragOver={(e) => {
                  if (!dragEnabled || !dragTaskId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onDragOverLane(swimlaneId);
                }}
                onDrop={(e) => {
                  if (!dragEnabled || !dragTaskId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onDropOnLane(swimlaneId);
                }}
              >
                {showLaneHeaders && (
                  isCollapsible ? (
                    <button
                      type="button"
                      onClick={() => toggleLane(swimlaneId)}
                      className={`w-full flex items-center gap-1.5 bucket-lane-label px-1 mb-1.5 text-left ${
                        lane.id === "overdue"
                          ? "text-red-600 dark:text-red-400"
                          : lane.id === "blocked"
                            ? "text-amber-700 dark:text-amber-400"
                            : lane.id === "someday"
                              ? "text-violet-600 dark:text-violet-400"
                              : lane.id === "undated"
                                ? "text-slate-500 dark:text-slate-400"
                                : lane.label.startsWith("Due today")
                                  ? "text-amber-700 dark:text-amber-400"
                                  : ""
                      } hover:text-slate-800 dark:hover:text-slate-200 transition-colors`}
                      aria-expanded={!isCollapsed}
                    >
                      <svg
                        className={`w-3 h-3 shrink-0 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="truncate">
                        {lane.label}
                        <span className="ml-1 tabular-nums font-medium text-slate-500 dark:text-slate-300 normal-case tracking-normal">
                          ({lane.tasks.length})
                        </span>
                      </span>
                    </button>
                  ) : (
                    <p
                      className={`bucket-lane-label px-1 mb-1.5 ${
                        lane.id === "overdue"
                          ? "text-red-600 dark:text-red-400"
                          : lane.id === "blocked"
                            ? "text-amber-700 dark:text-amber-400"
                            : lane.id === "someday"
                              ? "text-violet-600 dark:text-violet-400"
                              : lane.id === "undated"
                                ? "text-slate-500 dark:text-slate-400"
                                : lane.label.startsWith("Due today")
                                  ? "text-amber-700 dark:text-amber-400"
                                  : ""
                      }`}
                    >
                      {lane.label}
                      <span className="ml-1 tabular-nums font-medium text-slate-500 dark:text-slate-300 normal-case tracking-normal">
                        ({lane.tasks.length})
                      </span>
                    </p>
                  )
                )}
                {!isCollapsed && (
                <div className="space-y-1 min-h-[1.25rem]">
                  {lane.tasks.map((task, taskIdx) => (
                    <div key={task.id} className="min-w-0">
                    <BucketTaskCard
                      task={task}
                      isActive={activeTaskId === task.id}
                      isTimerRunning={isTimerRunning}
                      isEditing={editingTaskId === task.id}
                      editTitle={editTitle}
                      isDragging={dragTaskId === task.id}
                      isDragOver={dragOverTaskId === task.id && dragTaskId !== task.id}
                      dragEnabled={dragEnabled}
                      onToggleComplete={onToggleComplete}
                      onStartTask={onStartTask}
                      onSelectTask={onSelectTask}
                      onStartEdit={onStartEdit}
                      onEditTitleChange={onEditTitleChange}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      onSetDueDate={onSetDueDate}
                      isDetailOpen={expandedTaskId === task.id}
                      onToggleTaskDetail={onToggleTaskDetail}
                      onDragStart={() => onDragStart(task.id)}
                      onDragOver={() => onDragOverTask(task.id)}
                      onDrop={() => onDropOnTask(task.id, swimlaneId)}
                      onDragEnd={onDragEnd}
                      canMoveUp={taskIdx > 0}
                      canMoveDown={taskIdx < lane.tasks.length - 1}
                      onMoveUp={
                        onBucketMove ? () => onBucketMove(task.id, "up") : undefined
                      }
                      onMoveDown={
                        onBucketMove ? () => onBucketMove(task.id, "down") : undefined
                      }
                    />
                    </div>
                  ))}
                </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

      <QuickAddForm
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={submitQuickAdd}
        inputRef={addInputRef}
      />
    </div>
  );
}

export default function TaskBucketView({
  projects,
  tasksByProject,
  completedCountByProject,
  activeTaskId,
  isTimerRunning,
  datedLaneLabel = "Scheduled",
  onToggleComplete,
  onStartTask,
  onSelectTask,
  onQuickAdd,
  onToggleProjectFavorite,
  onExpandProject,
  editingTaskId = null,
  editTitle = "",
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
  onSetDueDate,
  expandedTaskId = null,
  onToggleTaskDetail,
  onBucketDrop,
  onBucketMove,
  renderBelowTask,
  scrollToProjectId = null,
  scrollToProjectToken = 0,
}: TaskBucketViewProps) {
  // Keep column order stable (favorites → manual order → name) regardless of active time filter.
  const orderedColumns = projects;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<{
    projectId: string;
    swimlaneId: BucketSwimlaneId;
  } | null>(null);
  const dragEnabled = !!onBucketDrop;

  const clearDrag = () => {
    setDragTaskId(null);
    setDragOverTaskId(null);
    setDragOverColumn(null);
  };

  const commitDrop = (target: BucketDropTarget) => {
    if (!dragTaskId || !onBucketDrop) {
      clearDrag();
      return;
    }
    onBucketDrop(dragTaskId, target);
    clearDrag();
  };

  useEffect(() => {
    if (orderedColumns.length <= 3) return;
    if (typeof window !== "undefined" && localStorage.getItem("foci-bucket-scroll-hint") === "1") return;
    setShowScrollHint(true);
  }, [orderedColumns.length]);

  const dismissScrollHint = () => {
    localStorage.setItem("foci-bucket-scroll-hint", "1");
    setShowScrollHint(false);
  };

  useEffect(() => {
    if (!scrollToProjectId || !scrollContainerRef.current) return;
    const column = scrollContainerRef.current.querySelector(
      `[data-bucket-project="${scrollToProjectId}"]`
    );
    if (column instanceof HTMLElement) {
      column.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  }, [scrollToProjectId, scrollToProjectToken]);

  useEffect(() => {
    if (!activeTaskId || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current.querySelector(
      `[data-bucket-task-id="${activeTaskId}"]`
    );
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [activeTaskId]);

  return (
    <div className="px-1 sm:px-2 pb-3 pt-1 min-h-0">
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="w-full flex gap-4 overflow-x-auto print:overflow-visible print:flex-wrap pb-2 pr-1 scrollbar-hide items-stretch scroll-smooth overscroll-x-contain"
          onScroll={showScrollHint ? dismissScrollHint : undefined}
        >
        {orderedColumns.map((project) => (
          <BucketColumn
            key={project.id}
            project={project}
            tasks={tasksByProject.get(project.id) ?? []}
            completedCount={completedCountByProject?.get(project.id) ?? 0}
            datedLaneLabel={datedLaneLabel}
            activeTaskId={activeTaskId}
            isTimerRunning={isTimerRunning}
            dragTaskId={dragTaskId}
            dragOverTaskId={dragOverTaskId}
            dragOverColumn={dragOverColumn}
            dragEnabled={dragEnabled}
            onToggleComplete={onToggleComplete}
            onStartTask={onStartTask}
            onSelectTask={onSelectTask}
            onQuickAdd={onQuickAdd}
            onToggleProjectFavorite={onToggleProjectFavorite}
            onExpandProject={onExpandProject}
            editingTaskId={editingTaskId}
            editTitle={editTitle}
            onStartEdit={onStartEdit}
            onEditTitleChange={onEditTitleChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onSetDueDate={onSetDueDate}
            expandedTaskId={expandedTaskId}
            onToggleTaskDetail={onToggleTaskDetail}
            onDragStart={setDragTaskId}
            onDragOverTask={setDragOverTaskId}
            onDragOverLane={(swimlaneId) =>
              setDragOverColumn({ projectId: project.id, swimlaneId })
            }
            onDropOnTask={(taskId, swimlaneId) =>
              commitDrop({
                type: "task",
                projectId: project.id,
                taskId,
                swimlaneId,
              })
            }
            onDropOnLane={(swimlaneId) =>
              commitDrop({
                type: "column",
                projectId: project.id,
                swimlaneId,
              })
            }
            onDragEnd={clearDrag}
            onBucketMove={onBucketMove}
            renderBelowTask={renderBelowTask}
          />
        ))}
        </div>
        {showScrollHint && (
          <>
            <div
              className="absolute right-0 top-0 bottom-2 w-20 pointer-events-none bg-gradient-to-l from-white/95 via-white/70 to-transparent dark:from-[#0f172a]/95 dark:via-[#0f172a]/70 dark:to-transparent"
              aria-hidden
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400 pointer-events-none whitespace-nowrap">
              More →
            </span>
          </>
        )}
      </div>
    </div>
  );
}
