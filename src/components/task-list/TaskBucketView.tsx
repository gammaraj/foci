"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Project, Task } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { formatDueDate, isDueDateOverdue, MAX_TASK_TITLE } from "@/components/task-list/utils";
import { MiniPlayPauseIcon, miniPlayButtonClass, miniResetButtonClass } from "@/components/FocusStripControls";

function BucketColumnTitle({ project }: { project: Project }) {
  const subtitle = project.description?.trim();
  const showSubtitle = !!subtitle && subtitle !== project.name;

  return (
    <div className="min-w-0 flex-1">
      <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white leading-tight">
        {project.name}
      </h3>
      {showSubtitle && (
        <p
          className="truncate text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-tight mt-0.5"
          title={subtitle}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Fit 4 full columns in the scroll viewport; extra projects scroll horizontally. */
const BUCKET_COLUMN_CLASS =
  "flex-[0_0_calc((100%-0.75rem)/1.12)] sm:flex-[0_0_calc((100%-2.25rem)/4)] min-w-0";

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
}

function sortBucketTasks(tasks: Task[], activeTaskId: string | null): Task[] {
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
}: {
  dueDate: string;
  taskId?: string;
  onSetDueDate?: (taskId: string, date: string | undefined) => void;
}) {
  const today = getToday();
  const overdue = isDueDateOverdue(dueDate);
  const isToday = dueDate === today;
  const label = isToday ? "Today" : formatDueDate(dueDate);
  const interactive = !!(taskId && onSetDueDate);

  return (
    <span
      className={`relative inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
        overdue
          ? "bg-red-50 dark:bg-red-900/25 text-red-600 dark:text-red-300"
          : isToday
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
            : "bg-slate-100 dark:bg-[#1a2d4a] text-slate-500 dark:text-slate-400"
      } ${interactive ? "cursor-pointer hover:ring-1 hover:ring-blue-400/40" : ""}`}
      title={interactive ? "Change due date" : undefined}
    >
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
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
}: {
  task: Task;
  isActive: boolean;
  isTimerRunning: boolean;
  isEditing: boolean;
  editTitle: string;
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
}) {
  const showFocusAction = isActive || isTimerRunning;
  const canEdit = !!onStartEdit;
  const canOpenDetail = !!onToggleTaskDetail;

  return (
    <div
      className={`group rounded-lg border px-2 py-1.5 transition-colors ${
        isDetailOpen
          ? "border-violet-400 dark:border-violet-500 bg-violet-50/50 dark:bg-violet-900/15 ring-1 ring-violet-400/25"
          : isActive
            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/25 ring-1 ring-blue-400/25"
            : "border-slate-200 dark:border-[#243350] bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-[#2d4266]"
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-green-400"
          }`}
          aria-label={`Mark "${task.title}" complete`}
        >
          {task.completed && (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1 min-w-0">
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
                className="flex-1 min-w-0 text-sm font-medium px-1 py-0.5 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-[#131d30] dark:text-white outline-none"
                autoFocus
                aria-label="Edit task title"
              />
            ) : canEdit ? (
              <button
                type="button"
                onClick={() => onStartEdit?.(task)}
                className="flex-1 min-w-0 text-left text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 hover:text-blue-700 dark:hover:text-blue-300 rounded px-0.5 -mx-0.5 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]/60 transition-colors"
                title="Click to edit"
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
            <div
              className={`flex items-center gap-1 shrink-0 transition-opacity ${
                showFocusAction || isEditing || isDetailOpen
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              }`}
            >
              {canEdit && !isEditing && (
                <button
                  type="button"
                  onClick={() => onStartEdit?.(task)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors touch-target-sm"
                  title="Rename"
                  aria-label={`Rename "${task.title}"`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              {canOpenDetail && !isEditing && (
                <button
                  type="button"
                  onClick={() => onToggleTaskDetail!(task.id)}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors touch-target-sm ${
                    isDetailOpen
                      ? "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30"
                      : "text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
                  }`}
                  title={isDetailOpen ? "Close details" : "Task details"}
                  aria-label={isDetailOpen ? `Close details for "${task.title}"` : `Open details for "${task.title}"`}
                  aria-pressed={!!isDetailOpen}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isDetailOpen ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              {isActive && isTimerRunning ? (
                <span
                  className={`${miniPlayButtonClass(true, true)} cursor-default`}
                  title="Timer running on this task"
                  aria-label="Active — timer running"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </span>
              ) : isActive ? (
                <button
                  type="button"
                  onClick={() => onSelectTask(null)}
                  className={miniResetButtonClass(true)}
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
                  className={miniPlayButtonClass(false, true, true)}
                  title={`Focus on "${task.title}" — starts timer`}
                  aria-label={`Focus on "${task.title}"`}
                >
                  <MiniPlayPauseIcon playing={false} size="sm" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {task.dueDate ? (
              <DueBadge dueDate={task.dueDate} taskId={task.id} onSetDueDate={onSetDueDate} />
            ) : onSetDueDate ? (
              <label className="relative inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add date
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
            ) : null}
          </div>
        </div>
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
}: {
  project: Project;
  tasks: Task[];
  datedLaneLabel: string;
  columnIndex: number;
  activeTaskId: string | null;
  isTimerRunning: boolean;
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
}) {
  const [draft, setDraft] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const swimlanes = buildSwimlanes(tasks, activeTaskId, datedLaneLabel);
  const showLaneHeaders = tasks.length > 0;
  const isAlt = columnIndex % 2 === 1;

  return (
    <div
      className={`${BUCKET_COLUMN_CLASS} flex flex-col rounded-xl border max-h-[min(70vh,640px)] ${
        isAlt
          ? "border-slate-200/90 dark:border-[#2a3f5f] bg-slate-50/95 dark:bg-[#0d1526]/85 shadow-sm"
          : "border-slate-200 dark:border-[#243350] bg-white/90 dark:bg-[#131d30]/55"
      }`}
    >
      <div
        className={`group/col flex items-start gap-2 px-3 py-2.5 border-b shrink-0 ${
          isAlt
            ? "border-slate-200/80 dark:border-[#2a3f5f] bg-slate-100/90 dark:bg-[#111827]/70"
            : "border-slate-200/90 dark:border-[#2a3f5f] bg-slate-50/95 dark:bg-[#0f172a]/75"
        }`}
        title={project.description?.trim() || project.name}
      >
        {onToggleProjectFavorite ? (
          <button
            type="button"
            onClick={() => onToggleProjectFavorite(project.id)}
            className={`flex-shrink-0 p-0.5 rounded transition-colors mt-0.5 ${
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
          <span title="Pinned — appears first in bucket view" className="flex-shrink-0 mt-0.5">
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
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10 mt-1"
            style={{ backgroundColor: project.color }}
            title={`${project.name} color`}
            aria-hidden
          />
        )}
        <BucketColumnTitle project={project} />
        <span className="text-xs tabular-nums font-semibold text-slate-500 dark:text-slate-400 shrink-0 self-start mt-0.5">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 min-h-[120px]">
        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 px-2">
            No tasks ·{" "}
            <button
              type="button"
              onClick={() => addInputRef.current?.focus()}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add
            </button>
          </p>
        ) : (
          <div className="space-y-3">
            {swimlanes.map((lane) => (
              <div
                key={lane.id}
                className={
                  lane.id === "overdue"
                    ? "rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-100/80 dark:border-red-900/30 p-1"
                    : ""
                }
              >
                {showLaneHeaders && (
                  <p
                    className={`text-[10px] font-medium uppercase tracking-wide px-0.5 mb-1.5 ${
                      lane.id === "overdue"
                        ? "text-red-600/90 dark:text-red-400/90"
                        : "text-slate-400/80 dark:text-slate-500/80"
                    }`}
                  >
                    {lane.label}
                    <span className="ml-1 tabular-nums font-normal normal-case tracking-normal">
                      ({lane.tasks.length})
                    </span>
                  </p>
                )}
                <div className="space-y-1.5">
                  {lane.tasks.map((task) => (
                    <BucketTaskCard
                      key={task.id}
                      task={task}
                      isActive={activeTaskId === task.id}
                      isTimerRunning={isTimerRunning}
                      isEditing={editingTaskId === task.id}
                      editTitle={editTitle}
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
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        className="p-2 border-t border-slate-100 dark:border-[#243350] shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          const title = draft.trim();
          if (!title) return;
          onQuickAdd(title, project.id);
          setDraft("");
        }}
      >
        <div className="flex gap-1.5">
          <input
            ref={addInputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="+ Add task"
            maxLength={MAX_TASK_TITLE}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
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
}: TaskBucketViewProps) {
  // Keep column order stable (favorites → manual order → name) regardless of active time filter.
  const orderedColumns = projects;
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    if (orderedColumns.length <= 4) return;
    if (typeof window !== "undefined" && localStorage.getItem("foci-bucket-scroll-hint") === "1") return;
    setShowScrollHint(true);
  }, [orderedColumns.length]);

  const dismissScrollHint = () => {
    localStorage.setItem("foci-bucket-scroll-hint", "1");
    setShowScrollHint(false);
  };

  return (
    <div className="px-3 sm:px-4 pb-4 pt-1">
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
          />
        ))}
        </div>
        {showScrollHint && (
          <>
            <div
              className="absolute right-0 top-0 bottom-2 w-20 pointer-events-none bg-gradient-to-l from-white/95 via-white/70 to-transparent dark:from-[#0f172a]/95 dark:via-[#0f172a]/70 dark:to-transparent"
              aria-hidden
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 pointer-events-none whitespace-nowrap">
              More →
            </span>
          </>
        )}
      </div>
    </div>
  );
}
