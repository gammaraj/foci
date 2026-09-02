"use client";

import React, { useState } from "react";
import type { Task, Project } from "@/lib/types";
import { ALL_PROJECTS_ID } from "@/lib/types";
import { formatDueDate, MAX_TASK_TITLE } from "./utils";
import { formatDateLocal, getToday } from "@/lib/dates";
import { DueDateField } from "@/components/task-list/DueDateField";
import { TaskEditButton } from "@/components/task-list/TaskEditButton";
import { TaskTitleButton } from "@/components/task-list/TaskTitleButton";
import { subtaskCountChipClass } from "@/components/task-list/TaskFlagBadge";
import { Button } from "@/components/ui/Button";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface TaskCalendarViewProps {
  tasks: Task[];
  projects: Project[];
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  onSetDueDate: (id: string, date: string | undefined) => void;
  activeTaskId: string | null;
  onStartTask: (taskId: string) => void;
  isTimerRunning: boolean;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  onQuickAdd?: (title: string, dueDate: string, options?: { openDetail?: boolean }) => void;
  expandedTaskId?: string | null;
  onToggleTaskDetail?: (taskId: string) => void;
  expandedSubtasksTaskId?: string | null;
  onToggleSubtasks?: (taskId: string) => void;
  renderBelowTask?: (task: Task) => React.ReactNode;
  editingId?: string | null;
  editTitle?: string;
  onStartEdit?: (task: Task) => void;
  onEditTitleChange?: (title: string) => void;
  onSaveEdit?: (id: string) => void;
  onCancelEdit?: () => void;
}

export default function TaskCalendarView({
  tasks,
  projects,
  calendarDate,
  setCalendarDate,
  onSetDueDate,
  activeTaskId,
  onStartTask,
  isTimerRunning,
  selectedDay,
  onSelectDay,
  onQuickAdd,
  expandedTaskId = null,
  onToggleTaskDetail,
  expandedSubtasksTaskId = null,
  onToggleSubtasks,
  renderBelowTask,
  editingId = null,
  editTitle = "",
  onStartEdit,
  onEditTitleChange,
  onSaveEdit,
  onCancelEdit,
}: TaskCalendarViewProps) {
  const canEditTitle = Boolean(onStartEdit && onEditTitleChange && onSaveEdit && onCancelEdit);
  const [projectFilter, setProjectFilter] = useState<string>(ALL_PROJECTS_ID);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDow = new Date(year, month, 1).getDay();

  const todayStr = getToday();

  const filteredTasks =
    projectFilter === ALL_PROJECTS_ID
      ? tasks
      : tasks.filter((t) => t.projectId === projectFilter);

  const tasksByDate: Record<string, Task[]> = {};
  for (const t of filteredTasks) {
    if (t.dueDate && !t.archivedAt) {
      (tasksByDate[t.dueDate] ??= []).push(t);
    }
  }

  const unscheduledTasks = filteredTasks.filter((t) => !t.dueDate && !t.completed && !t.archivedAt);
  const visibleProjects = projects.filter((p) => !p.archived);

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCalendarDate(new Date());
    onSelectDay(todayStr);
  };

  const emptyCells = Array.from({ length: startingDow });
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const selectedTasks = selectedDay ? (tasksByDate[selectedDay] ?? []) : [];

  const renderSubtasksBadge = (task: Task, detailOpen: boolean) => {
    const subtaskCount = task.subtasks?.length ?? 0;
    if (subtaskCount === 0) return null;
    const completed = task.subtasks!.filter((s) => s.completed).length;
    const subtasksExpanded = expandedSubtasksTaskId === task.id;
    const shown = subtasksExpanded || detailOpen;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (detailOpen) onToggleTaskDetail?.(task.id);
          else (onToggleSubtasks ?? onToggleTaskDetail)?.(task.id);
        }}
        className={subtaskCountChipClass(shown)}
        title={shown ? `Hide subtasks (${completed}/${subtaskCount})` : `Show subtasks (${completed}/${subtaskCount})`}
        aria-expanded={shown}
        aria-label={`${completed} of ${subtaskCount} subtasks complete. ${shown ? "Hide" : "Show"} subtasks.`}
      >
        {completed}/{subtaskCount}
      </button>
    );
  };

  return (
    <div className="p-4">
      {visibleProjects.length > 1 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            type="button"
            variant={projectFilter === ALL_PROJECTS_ID ? "chipActive" : "chip"}
            size="sm"
            className="flex-shrink-0 transition-colors"
            onClick={() => setProjectFilter(ALL_PROJECTS_ID)}
          >
            All
          </Button>
          {visibleProjects.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant={projectFilter === p.id ? "chipActive" : "chip"}
              size="sm"
              className="flex-shrink-0 flex items-center gap-1.5 transition-colors"
              onClick={() => setProjectFilter(p.id)}
            >
              {p.color && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                />
              )}
              {p.name}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-surface-hover rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            onClick={goToday}
            className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-surface-hover rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 dark:text-slate-300 uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, i) => (
          <div key={`e-${i}`} className="min-h-[68px]" />
        ))}
        {dayCells.map((day) => {
          const dateStr = formatDateLocal(new Date(year, month, day));
          const dayTasks = tasksByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;
          const isPast = dateStr < todayStr;
          const hasOverdue = isPast && dayTasks.some((t) => !t.completed);

          return (
            <button
              key={day}
              onClick={() => onSelectDay(isSelected ? null : dateStr)}
              className={`min-h-[68px] rounded-lg flex flex-col p-1 text-xs transition-all w-full text-left ${
                isSelected
                  ? "bg-blue-700 text-white ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-[#131d30]"
                  : isToday
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700"
                    : "hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-600 dark:text-slate-300"
              }`}
            >
              <span className={`text-xs font-semibold self-end leading-none mb-1 ${isToday && !isSelected ? "font-bold" : ""}`}>{day}</span>
              <div className="flex flex-col gap-0.5 w-full">
                {dayTasks.slice(0, 2).map((t) => {
                  const chipColor = isSelected
                    ? "bg-white/20 text-white"
                    : t.completed
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : hasOverdue && !t.completed
                        ? "urgency-chip--soft"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
                  return (
                    <div
                      key={t.id}
                      className={`w-full truncate text-xs leading-tight px-1 py-0.5 rounded ${chipColor} ${t.completed ? "line-through" : ""}`}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 2 && (
                  <span className={`text-xs leading-none px-1 ${isSelected ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                    +{dayTasks.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-300">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Pending</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /> Done</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--urgency-chip)]" /> Overdue</div>
      </div>

      {selectedDay && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatDueDate(selectedDay)}
              {selectedDay === todayStr && " — Today"}
            </h4>
            <span className="text-xs text-slate-400">{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</span>
          </div>
          {selectedTasks.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-400 dark:text-slate-400">No tasks due on this day.</p>
              {onQuickAdd && selectedDay && (
                <form
                  className="flex gap-2 items-center"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!quickAddTitle.trim()) return;
                    onQuickAdd(quickAddTitle, selectedDay);
                    setQuickAddTitle("");
                  }}
                >
                  <input
                    type="text"
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (!quickAddTitle.trim()) return;
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        onQuickAdd(quickAddTitle, selectedDay, { openDetail: true });
                        setQuickAddTitle("");
                      }
                    }}
                    placeholder="Add a task for this day..."
                    className="flex-1 px-3 py-2 text-sm border border-surface-border dark:border-surface-border rounded-lg bg-surface-elevated text-slate-900 dark:bg-surface-elevated dark:text-white focus:border-blue-500 outline-none"
                  />
                  {quickAddTitle.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        onQuickAdd(quickAddTitle, selectedDay, { openDetail: true });
                        setQuickAddTitle("");
                      }}
                      className="shrink-0 inline-flex items-center gap-0.5 px-2 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      aria-label="Add with details"
                      title="Add with details (⌘/Ctrl+Enter)"
                    >
                      Details
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : null}
                  <Button type="submit" size="md">
                    Add
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {selectedTasks.map((task) => {
                const detailOpen = expandedTaskId === task.id;
                return (
                <div key={task.id}>
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-colors ${
                    detailOpen
                      ? "border-violet-300 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/15 ring-1 ring-violet-400/25"
                      : task.completed
                        ? "border-slate-100 dark:border-surface-border opacity-60"
                        : activeTaskId === task.id
                          ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : selectedDay < todayStr
                            ? "card-row--overdue border border-transparent"
                            : "border-surface-border hover:bg-slate-50/80 dark:hover:bg-surface-elevated/60"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.completed ? "bg-green-400" : selectedDay < todayStr ? "bg-[var(--urgency-chip)]" : "bg-blue-400"
                  }`} />
                  {editingId === task.id && canEditTitle ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => onEditTitleChange!(e.target.value)}
                      onBlur={() => onSaveEdit!(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSaveEdit!(task.id);
                        if (e.key === "Escape") onCancelEdit!();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      maxLength={MAX_TASK_TITLE}
                      className="flex-1 min-w-0 px-1.5 py-0.5 text-sm font-medium border border-blue-300 rounded-lg bg-surface-elevated text-slate-900 dark:bg-surface-elevated dark:text-white outline-none"
                      autoFocus
                      aria-label="Edit task title"
                    />
                  ) : (
                    <TaskTitleButton
                      title={task.title}
                      onOpen={
                        onToggleTaskDetail && !task.completed
                          ? () => onToggleTaskDetail(task.id)
                          : undefined
                      }
                      onRename={
                        canEditTitle && !task.completed ? () => onStartEdit!(task) : undefined
                      }
                      interactive={!task.completed && (!!onToggleTaskDetail || canEditTitle)}
                      className={`text-sm flex-1 truncate text-left ${
                        task.completed
                          ? "line-through text-slate-400"
                          : "text-slate-700 dark:text-slate-200 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      }`}
                    >
                      {task.title}
                    </TaskTitleButton>
                  )}
                  {renderSubtasksBadge(task, detailOpen)}
                  {!task.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTask(task.id);
                      }}
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      {isTimerRunning ? "Switch" : "Start"}
                    </button>
                  )}
                  {onToggleTaskDetail && (
                    <TaskEditButton
                      isOpen={detailOpen}
                      taskTitle={task.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTaskDetail(task.id);
                      }}
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDueDate(task.id, undefined);
                    }}
                    className="flex-shrink-0 p-1 text-slate-400 dark:text-slate-400 hover:text-red-400 transition-colors"
                    title="Remove due date"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {renderBelowTask?.(task)}
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {unscheduledTasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-surface-border">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            No due date ({unscheduledTasks.length})
          </h4>
          <div className="space-y-0.5">
            {unscheduledTasks.slice(0, 8).map((task) => {
              const detailOpen = expandedTaskId === task.id;
              return (
              <div key={task.id}>
              <div
                className={`flex items-center gap-2 px-2 py-0.5 rounded-lg border transition-colors ${
                  detailOpen
                    ? "border-violet-300 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/15"
                    : "border-transparent hover:bg-slate-50/80 dark:hover:bg-surface-elevated/60"
                }`}
              >
                {editingId === task.id && canEditTitle ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => onEditTitleChange!(e.target.value)}
                    onBlur={() => onSaveEdit!(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveEdit!(task.id);
                      if (e.key === "Escape") onCancelEdit!();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={MAX_TASK_TITLE}
                    className="flex-1 min-w-0 px-1.5 py-0.5 text-sm border border-blue-300 rounded-lg bg-surface-elevated text-slate-900 dark:bg-surface-elevated dark:text-white outline-none"
                    autoFocus
                    aria-label="Edit task title"
                  />
                ) : (
                  <TaskTitleButton
                    title={task.title}
                    onOpen={onToggleTaskDetail ? () => onToggleTaskDetail(task.id) : undefined}
                    onRename={canEditTitle ? () => onStartEdit!(task) : undefined}
                    className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1 text-left hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {task.title}
                  </TaskTitleButton>
                )}
                {renderSubtasksBadge(task, detailOpen)}
                {onToggleTaskDetail && (
                  <TaskEditButton
                    isOpen={detailOpen}
                    taskTitle={task.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTaskDetail(task.id);
                    }}
                  />
                )}
                <DueDateField
                  value={undefined}
                  onChange={(date) => date && onSetDueDate(task.id, date)}
                  requireExplicitPick
                  ariaLabel="Set due date"
                  className="flex-shrink-0 p-1 text-slate-400 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  <span title="Set due date" onClick={(e) => e.stopPropagation()}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                </DueDateField>
              </div>
              {renderBelowTask?.(task)}
              </div>
            );
            })}
            {unscheduledTasks.length > 8 && (
              <p className="text-xs text-slate-400 text-center">+{unscheduledTasks.length - 8} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
