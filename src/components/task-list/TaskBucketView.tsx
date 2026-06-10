"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Project, Task } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { formatDueDate, isDueDateOverdue, MAX_TASK_TITLE } from "@/components/task-list/utils";
import { MiniPlayPauseIcon } from "@/components/FocusStripControls";
import {
  sortBucketTasks,
  type BucketDropTarget,
  type BucketSwimlaneId,
} from "@/components/task-list/bucket-order";

function BucketColumnTitle({ project }: { project: Project }) {
  const subtitle = project.description?.trim();
  const showSubtitle = !!subtitle && subtitle !== project.name;

  return (
    <div className="min-w-0 flex-1 lg:min-h-[2.75rem] flex flex-col justify-center">
      <h3 className="truncate text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
        {project.name}
      </h3>
      <p
        className={`hidden lg:block truncate text-xs app-text-meta font-normal leading-tight mt-0.5 min-h-[1.125rem] text-slate-500 dark:text-slate-400 ${
          showSubtitle ? "" : "invisible select-none"
        }`}
        title={showSubtitle ? subtitle : undefined}
        aria-hidden={!showSubtitle}
      >
        {showSubtitle ? subtitle : "\u00a0"}
      </p>
    </div>
  );
}

/** Fit 3 full columns in the scroll viewport; extra projects scroll horizontally. */
const BUCKET_COLUMN_CLASS =
  "flex-[0_0_calc((100%-0.75rem)/1.12)] sm:flex-[0_0_calc((100%-1.5rem)/3)] min-w-0";

interface TaskBucketViewProps {
  projects: Project[];
  tasksByProject: Map<string, Task[]>;
  activeTaskId: string | null;
  isTimerRunning: boolean;
  /** Label for the dated (in-scope) swimlane, e.g. "Due today". */
  datedLaneLabel?: string;
  onToggleComplete: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onSelectTask: (taskId: string | null) => void;
  onQuickAdd: (title: string, projectId: string) => void;
  onToggleProjectFavorite?: (projectId: string) => void;
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
}

const LANE_COLLAPSE_THRESHOLD = 4;

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
  const sorted = sortBucketTasks(tasks, activeTaskId);
  const overdue = sorted.filter((t) => t.dueDate && isDueDateOverdue(t.dueDate));
  const dated = sorted.filter((t) => t.dueDate && !isDueDateOverdue(t.dueDate));
  const undated = sorted.filter((t) => !t.dueDate);

  const lanes: BucketSwimlane[] = [];
  if (overdue.length > 0) lanes.push({ id: "overdue", label: "Overdue", tasks: overdue });
  if (dated.length > 0) lanes.push({ id: "dated", label: datedLaneLabel, tasks: dated });
  if (undated.length > 0) lanes.push({ id: "undated", label: "No Date", tasks: undated });
  return lanes;
}

function DueBadge({
  dueDate,
  taskId,
  onSetDueDate,
  compact = false,
}: {
  dueDate: string;
  taskId?: string;
  onSetDueDate?: (taskId: string, date: string | undefined) => void;
  compact?: boolean;
}) {
  const today = getToday();
  const overdue = isDueDateOverdue(dueDate);
  const isToday = dueDate === today;
  const label = isToday ? "Today" : formatDueDate(dueDate);
  const interactive = !!(taskId && onSetDueDate);

  return (
    <span
      className={`relative inline-flex items-center gap-0.5 font-semibold rounded-full shrink-0 leading-none ${
        compact ? "text-[11px] px-1 py-px" : "text-xs gap-1 px-1.5 py-0.5"
      } ${
        overdue
          ? "bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-300"
          : isToday
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
            : "bg-slate-100 dark:bg-[#1a2d4a] text-slate-500 dark:text-slate-400"
      } ${interactive ? "cursor-pointer hover:ring-1 hover:ring-blue-400/40" : ""}`}
      title={interactive ? "Change due date" : undefined}
    >
      {!compact && (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {label}
      {interactive && (
        <input
          type="date"
          value={dueDate}
          onChange={(e) => onSetDueDate!(taskId!, e.target.value || undefined)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => {
            try {
              (e.target as HTMLInputElement).showPicker();
            } catch {}
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Change due date"
        />
      )}
    </span>
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
  const compactIconBtn =
    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors";
  const compactPlayBtn = (playing: boolean, emphasize: boolean) =>
    `w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
      playing || emphasize
        ? "border border-blue-500/70 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
        : "border border-slate-300 dark:border-[#3a5070] bg-white dark:bg-[#1a2d4a] text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/25"
    } ${emphasize ? "ring-1 ring-blue-400/35" : ""}`;

  return (
    <div
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
      className={`group rounded-md border px-1.5 py-1 transition-colors ${
        isDetailOpen
          ? "border-violet-400 dark:border-violet-500 bg-violet-50/50 dark:bg-violet-900/15 ring-1 ring-violet-400/25"
          : isActive
            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/25 ring-1 ring-blue-400/25"
            : "border-slate-300 dark:border-[#243350] bg-white dark:bg-[#111827] shadow-sm dark:shadow-none hover:border-slate-400 dark:hover:border-[#2d4266]"
      } ${isDragging ? "opacity-50" : ""} ${
        isDragOver ? "border-t-2 border-t-blue-500 dark:border-t-blue-400" : ""
      }`}
    >
      <div className="flex items-center gap-1 min-h-[1.5rem]">
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
            className="hidden sm:flex flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
          className={`w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-green-400"
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
            className="flex-1 min-w-0 text-sm font-medium px-1 py-0 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
            autoFocus
            aria-label="Edit task title"
          />
        ) : canEdit ? (
          <button
            type="button"
            onClick={() => onStartEdit?.(task)}
            className="flex-1 min-w-0 text-left text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight truncate hover:text-blue-700 dark:hover:text-blue-300 rounded px-0.5 -mx-0.5 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]/60 transition-colors"
            title={task.title}
          >
            {task.title}
          </button>
        ) : (
          <p className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight truncate" title={task.title}>
            {task.title}
          </p>
        )}
        {!isEditing && task.dueDate && (
          <DueBadge dueDate={task.dueDate} taskId={task.id} onSetDueDate={onSetDueDate} compact />
        )}
        {!isEditing && (
          <div
            className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
              isDetailOpen
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            }`}
          >
            {!task.dueDate && onSetDueDate && (
              <label
                className={`${compactIconBtn} relative text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] cursor-pointer`}
                title="Add due date"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="date"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) onSetDueDate(task.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => {
                    try {
                      (e.target as HTMLInputElement).showPicker();
                    } catch {}
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Add due date"
                />
              </label>
            )}
            {canOpenDetail && (
              <button
                type="button"
                onClick={() => onToggleTaskDetail!(task.id)}
                className={`${compactIconBtn} ${
                  isDetailOpen
                    ? "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30"
                    : "text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
                }`}
                title={isDetailOpen ? "Close details" : "Task details"}
                aria-label={isDetailOpen ? `Close details for "${task.title}"` : `Open details for "${task.title}"`}
                aria-pressed={!!isDetailOpen}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isDetailOpen ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
        {!isEditing &&
          (isActive && isTimerRunning ? (
            <span
              className={`${compactPlayBtn(true, false)} cursor-default`}
              title="Timer running on this task"
              aria-label="Active — timer running"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          ) : isActive ? (
            <button
              type="button"
              onClick={() => onSelectTask(null)}
              className={`${compactPlayBtn(false, false)} border-slate-300 dark:border-[#3a5070] bg-white dark:bg-[#1a2d4a] text-slate-500 dark:text-slate-400`}
              title="Clear selection"
              aria-label="Clear focus selection"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStartTask(task.id)}
              className={compactPlayBtn(false, true)}
              title={`Focus on "${task.title}" — starts timer`}
              aria-label={`Focus on "${task.title}"`}
            >
              <MiniPlayPauseIcon playing={false} size="sm" />
            </button>
          ))}
      </div>
    </div>
  );
}

function BucketColumn({
  project,
  tasks,
  datedLaneLabel,
  columnIndex,
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
}: {
  project: Project;
  tasks: Task[];
  datedLaneLabel: string;
  columnIndex: number;
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
}) {
  const [draft, setDraft] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const swimlanes = buildSwimlanes(tasks, activeTaskId, datedLaneLabel);
  const showLaneHeaders = tasks.length > 0;
  const isAlt = columnIndex % 2 === 1;
  const [collapsedLanes, setCollapsedLanes] = useState<Set<BucketSwimlaneId>>(() => new Set());

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

  return (
    <div
      className={`${BUCKET_COLUMN_CLASS} flex flex-col rounded-xl border min-h-[10rem] max-h-[calc(100vh-12.5rem)] sm:max-h-[calc(100vh-11rem)] transition-colors ${
        isAlt
          ? "border-slate-300 dark:border-[#2a3f5f] bg-slate-100 dark:bg-[#0d1526]/85 shadow-sm"
          : "border-slate-300 dark:border-[#243350] bg-white dark:bg-[#131d30]/55 shadow-sm"
      } ${columnHighlighted ? "ring-2 ring-blue-400/40 dark:ring-blue-500/35" : ""}`}
    >
      <div
        className={`group/col flex items-center gap-2 px-2.5 py-2 border-b shrink-0 lg:min-h-[4.25rem] ${
          isAlt
            ? "border-slate-300 dark:border-[#2a3f5f] bg-slate-200/70 dark:bg-[#111827]/70"
            : "border-slate-300 dark:border-[#2a3f5f] bg-slate-100 dark:bg-[#0f172a]/75"
        }`}
        title={project.description?.trim() || project.name}
      >
        {onToggleProjectFavorite ? (
          <button
            type="button"
            onClick={() => onToggleProjectFavorite(project.id)}
            className={`flex-shrink-0 p-0.5 rounded transition-colors ${
              project.favorite
                ? "text-amber-400 hover:text-amber-500"
                : "text-slate-300 dark:text-slate-600 opacity-0 group-hover/col:opacity-100 hover:!opacity-100 focus-visible:opacity-100 hover:text-amber-400"
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
        <span className="text-xs tabular-nums font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          {tasks.length}
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2 min-h-[80px]"
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
              <span className="text-blue-600 dark:text-blue-400 font-medium">Drop here to move</span>
            ) : (
              <>
                No tasks ·{" "}
                <button
                  type="button"
                  onClick={() => addInputRef.current?.focus()}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
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
              const isCollapsible = lane.tasks.length >= LANE_COLLAPSE_THRESHOLD;
              const isCollapsed = collapsedLanes.has(swimlaneId);
              return (
              <div
                key={lane.id}
                className={`${
                  lane.id === "overdue"
                    ? "border-l-2 border-l-red-500/70 dark:border-l-red-400/60 pl-1.5"
                    : ""
                } ${laneHighlighted ? "ring-1 ring-blue-400/50 rounded-md" : ""}`}
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
                      className={`w-full flex items-center gap-1 app-section-label px-0.5 mb-2 leading-none text-left ${
                        lane.id === "overdue"
                          ? "text-red-600/90 dark:text-red-400/90"
                          : "text-slate-500 dark:text-slate-400"
                      } hover:opacity-80 transition-opacity`}
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
                        <span className="ml-1 tabular-nums font-normal normal-case tracking-normal">
                          ({lane.tasks.length})
                        </span>
                      </span>
                    </button>
                  ) : (
                    <p
                      className={`app-section-label px-0.5 mb-2 leading-none ${
                        lane.id === "overdue"
                          ? "text-red-600/90 dark:text-red-400/90"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {lane.label}
                      <span className="ml-1 tabular-nums font-normal normal-case tracking-normal">
                        ({lane.tasks.length})
                      </span>
                    </p>
                  )
                )}
                {!isCollapsed && (
                <div className="space-y-1.5 min-h-[1.25rem]">
                  {lane.tasks.map((task, taskIdx) => (
                    <BucketTaskCard
                      key={task.id}
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
                  ))}
                </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

      <form
        className="px-1.5 py-1 border-t border-slate-200 dark:border-[#243350] bg-slate-50/80 dark:bg-transparent shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          const title = draft.trim();
          if (!title) return;
          onQuickAdd(title, project.id);
          setDraft("");
        }}
      >
        <div className="flex gap-1">
          <input
            ref={addInputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add task…"
            maxLength={MAX_TASK_TITLE}
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-200 dark:border-[#243350] rounded-md bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="px-2 py-1 text-sm font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add task"
            title="Add task"
          >
            +
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TaskBucketView({
  projects,
  tasksByProject,
  activeTaskId,
  isTimerRunning,
  datedLaneLabel = "Scheduled",
  onToggleComplete,
  onStartTask,
  onSelectTask,
  onQuickAdd,
  onToggleProjectFavorite,
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
}: TaskBucketViewProps) {
  // Keep column order stable (favorites → manual order → name) regardless of active time filter.
  const orderedColumns = projects;
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

  return (
    <div className="px-3 sm:px-4 pb-3 pt-1 min-h-0">
      <div className="relative">
        <div
          className="w-full flex gap-3 overflow-x-auto pb-2 pr-1 scrollbar-hide items-stretch scroll-smooth overscroll-x-contain"
          onScroll={showScrollHint ? dismissScrollHint : undefined}
        >
        {orderedColumns.map((project, columnIndex) => (
          <BucketColumn
            key={project.id}
            project={project}
            tasks={tasksByProject.get(project.id) ?? []}
            datedLaneLabel={datedLaneLabel}
            columnIndex={columnIndex}
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
