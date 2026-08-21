"use client";

import React from "react";
import type { Task } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { formatDueDate, formatDuration, formatOverdueChip, formatOverdueLabel, getDaysOverdue, isDueDateOverdue, META_CHIP_CLASS, OVERDUE_ROW_CLASS, overdueDayChipClass } from "@/components/task-list/utils";
import { DueDateField } from "@/components/task-list/DueDateField";
import { TaskEditButton } from "@/components/task-list/TaskEditButton";
import { TaskTitleButton } from "@/components/task-list/TaskTitleButton";
import {
  getTaskListSection,
  isActionableOverdue,
  TASK_LIST_SECTION_ORDER,
  type TaskListSection,
} from "@/lib/task-status";
import { OneThingBadge } from "@/components/task-list/OneThingBadge";
import { TaskRecurrenceBadge } from "@/components/task-list/TaskRecurrenceBadge";

export interface OpenTaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  /** Today's One Thing task id (active pick only). */
  oneThingTaskId?: string | null;
  isTimerRunning: boolean;
  expandedTaskId: string | null;
  /** Task whose subtasks are expanded inline (badge), separate from Details. */
  expandedSubtasksTaskId?: string | null;
  editingId: string | null;
  editTitle: string;
  dragTaskId: string | null;
  dragOverTaskId: string | null;
  showProjectBadge?: boolean;
  isTimeFilter?: boolean;
  isAllProjects?: boolean;
  getProjectName?: (projectId: string) => string;
  noDueDateExpanded?: boolean;
  onToggleNoDueDateExpanded?: () => void;
  scopedUndatedOpenCount?: number;
  somedayExpanded?: boolean;
  onToggleSomedayExpanded?: () => void;
  scopedSomedayOpenCount?: number;
  /** Render tasks in a 2-column grid on sm+ screens for denser list views. */
  twoColumn?: boolean;
  onToggleComplete: (id: string) => void;
  onSaveEdit: (id: string) => void;
  onStartEdit: (task: Task) => void;
  onEditTitleChange: (value: string) => void;
  onCancelEdit: () => void;
  onToggleTaskDetail: (id: string) => void;
  onToggleSubtasks?: (id: string) => void;
  onStartTask: (id: string) => void;
  onSelectTask: (id: string | null) => void;
  onDeleteTask: (id: string) => void;
  onSetDueDate: (id: string, date: string | undefined) => void;
  onSnoozeToToday: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  renderBelowTask: (task: Task) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function OpenTaskList({
  tasks,
  activeTaskId,
  oneThingTaskId = null,
  isTimerRunning,
  expandedTaskId,
  expandedSubtasksTaskId = null,
  editingId,
  editTitle,
  dragTaskId,
  dragOverTaskId,
  showProjectBadge = false,
  isTimeFilter = false,
  isAllProjects = false,
  getProjectName,
  noDueDateExpanded = true,
  onToggleNoDueDateExpanded,
  scopedUndatedOpenCount = 0,
  somedayExpanded = false,
  onToggleSomedayExpanded,
  scopedSomedayOpenCount = 0,
  twoColumn = false,
  onToggleComplete,
  onSaveEdit,
  onStartEdit,
  onEditTitleChange,
  onCancelEdit,
  onToggleTaskDetail,
  onToggleSubtasks,
  onStartTask,
  onSelectTask,
  onDeleteTask,
  onSetDueDate,
  onSnoozeToToday,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  renderBelowTask,
  emptyMessage = "No open tasks",
  className = "space-y-1.5",
}: OpenTaskListProps) {
  if (tasks.length === 0) {
    if (!emptyMessage) return null;
    return <p className="panel-pad-x py-3 text-sm text-slate-400 dark:text-slate-500">{emptyMessage}</p>;
  }

  const sectionMeta: Record<
    TaskListSection,
    {
      label: string;
      headerModifier: string;
      labelClass: string;
      collapsible?: boolean;
      extraTopSpace?: boolean;
    }
  > = {
    overdue: {
      label: "Overdue",
      headerModifier: "task-list-section-header--overdue",
      labelClass: "urgency-text--mild",
    },
    upcoming: {
      label: "Upcoming",
      headerModifier: "task-list-section-header--upcoming",
      labelClass: "text-slate-700 dark:text-slate-200",
    },
    blocked: {
      label: "Blocked / Waiting",
      headerModifier: "task-list-section-header--blocked",
      labelClass: "text-amber-700 dark:text-amber-300",
    },
    inbox: {
      label: "No due date",
      headerModifier: "task-list-section-header--inbox",
      labelClass: "text-slate-600 dark:text-slate-300",
      collapsible: true,
      extraTopSpace: true,
    },
    someday: {
      label: "Someday / Maybe",
      headerModifier: "task-list-section-header--someday",
      labelClass: "text-violet-700 dark:text-violet-300",
      collapsible: true,
      extraTopSpace: true,
    },
  };

  const tasksBySection = new Map<TaskListSection, Task[]>();
  for (const task of tasks) {
    const section = getTaskListSection(task);
    const list = tasksBySection.get(section) ?? [];
    list.push(task);
    tasksBySection.set(section, list);
  }

  const renderTaskCard = (task: Task) => {
    const isExpanded = expandedTaskId === task.id;
    const subtasksExpanded = expandedSubtasksTaskId === task.id;
    const isOverdue = isActionableOverdue(task);
    const isBlocked = !!task.blocked;
    const daysLate = isOverdue && task.dueDate ? getDaysOverdue(task.dueDate) : 0;
    const overdueLabel = isOverdue ? formatOverdueLabel(daysLate) : null;
    const subtaskCount = task.subtasks?.length ?? 0;
    const completedSubtaskCount = task.subtasks?.filter((s) => s.completed).length ?? 0;
    const spansFullWidth = twoColumn && (isExpanded || subtasksExpanded);

    return (
      <div
        key={task.id}
        className={`group/task flex flex-col min-w-0${spansFullWidth ? " sm:col-span-2" : ""}`}
      >
        <div
          draggable
          aria-current={activeTaskId === task.id ? "true" : undefined}
          data-linked-to-timer={activeTaskId === task.id ? "true" : undefined}
          onDragStart={() => onDragStart(task.id)}
          onDragOver={(e) => onDragOver(e, task.id)}
          onDrop={() => onDrop(task.id)}
          onDragEnd={onDragEnd}
          className={`group flex flex-col overflow-hidden rounded-md border transition-colors ${
            activeTaskId === task.id
              ? "task-timer-linked border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/25 ring-1 ring-blue-400/30 dark:ring-blue-500/25"
              : isExpanded
                ? "border-violet-300 dark:border-violet-600 bg-violet-50/40 dark:bg-violet-900/10 ring-1 ring-violet-400/25"
                : isBlocked
                  ? "border-slate-300 dark:border-[#1e3050] hover:bg-amber-50/30 dark:hover:bg-amber-950/15"
                  : isOverdue
                  ? `${OVERDUE_ROW_CLASS} border border-transparent`
                  : "border-slate-200/90 dark:border-[#243350]/80 hover:bg-slate-50 dark:hover:bg-[#131d30]"
          } ${dragTaskId === task.id ? "opacity-50" : ""} ${
            dragOverTaskId === task.id && dragTaskId !== task.id ? "border-t-2 border-t-blue-500" : ""
          }`}
        >
        <div className="relative flex items-center gap-1.5 sm:gap-2 px-1.5 py-1 sm:px-2 sm:py-1">
          <div className="hidden sm:flex flex-shrink-0 items-center cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
            </svg>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
            className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-slate-300 dark:border-slate-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:animate-check-bounce flex items-center justify-center"
            aria-label={`Mark "${task.title}" complete`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-medium break-words [overflow-wrap:anywhere] leading-snug text-slate-800 dark:text-slate-50">
              {editingId === task.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => onEditTitleChange(e.target.value)}
                  onBlur={() => onSaveEdit(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveEdit(task.id);
                    if (e.key === "Escape") onCancelEdit();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-1 py-0.5 text-sm font-medium border border-blue-300 rounded-lg bg-white text-slate-900 dark:bg-[#131d30] dark:text-white outline-none"
                  autoFocus
                />
              ) : (
                <TaskTitleButton
                  title={task.title}
                  onOpen={() => onToggleTaskDetail(task.id)}
                  onRename={() => onStartEdit(task)}
                  className="cursor-pointer text-left hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {task.title}
                </TaskTitleButton>
              )}
              {activeTaskId === task.id && isTimerRunning && (
                <span className="sm:hidden ml-1.5 inline-flex items-center w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse align-middle" />
              )}
              {oneThingTaskId === task.id && <OneThingBadge />}
              {isOverdue && (
                <span
                  className={`${META_CHIP_CLASS} ${overdueDayChipClass(daysLate)}`}
                  title={overdueLabel ?? "Overdue"}
                  aria-label={overdueLabel ?? "Overdue"}
                >
                  {formatOverdueChip(daysLate)}
                </span>
              )}
              {task.kind && task.kind !== "task" && (
                <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded border ${
                  task.kind === "note"
                    ? "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600/60"
                    : "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50"
                }`}>
                  {task.kind === "note" ? "NOTE" : "Q"}
                </span>
              )}
              {task.blocked && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                  WAITING
                </span>
              )}
              {task.someday && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50">
                  SOMEDAY
                </span>
              )}
              {task.priority && (
                <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-semibold uppercase rounded ${task.priority === 1 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50" : task.priority === 2 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50"}`}>
                  {task.priority === 1 ? "HIGH" : task.priority === 2 ? "MED" : "LOW"}
                </span>
              )}
              {showProjectBadge && (isAllProjects || isTimeFilter) && getProjectName && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#1a2d4a] text-slate-600 dark:text-slate-300">
                  {getProjectName(task.projectId)}
                </span>
              )}
              {task.dueDate && (
                <DueDateField
                  value={task.dueDate}
                  onChange={(date) => onSetDueDate(task.id, date)}
                  ariaLabel="Change due date"
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-md transition-colors ${
                    isBlocked
                      ? "text-amber-700 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50"
                      : !task.completed && isDueDateOverdue(task.dueDate)
                        ? "text-red-500 dark:text-rose-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                        : !task.completed && task.dueDate === getToday()
                          ? "text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          : "text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-[#2a3f5f]/80 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  <span
                    className="inline-flex items-center gap-1"
                    title={isBlocked ? `Waiting — due ${formatDueDate(task.dueDate)}` : `Due: ${formatDueDate(task.dueDate)}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {formatDueDate(task.dueDate)}
                    {!task.completed && !isBlocked && isDueDateOverdue(task.dueDate) && " (overdue)"}
                    {isBlocked && " (waiting)"}
                  </span>
                </DueDateField>
              )}
              {task.description && (
                <span className="app-text-meta text-slate-500 dark:text-slate-300 flex items-center gap-0.5" title="Has description">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" /></svg>
                </span>
              )}
              {(task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                <span className="app-text-meta text-slate-500 dark:text-slate-300">
                  {task.sessions > 0 && <>{task.sessions}× </>}
                  {(task.timeSpent || 0) > 0 && formatDuration(task.timeSpent)}
                </span>
              )}
              {task.recurrence && (
                <TaskRecurrenceBadge recurrence={task.recurrence} size="compact" />
              )}
              {subtaskCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Details already shows subtasks inline — badge closes the panel.
                    if (isExpanded) onToggleTaskDetail(task.id);
                    else (onToggleSubtasks ?? onToggleTaskDetail)(task.id);
                  }}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold tabular-nums rounded-md border transition-colors ${
                    subtasksExpanded || isExpanded
                      ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 border-violet-300 dark:border-violet-700"
                      : "bg-violet-50 dark:bg-violet-900/25 text-violet-600 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-900/40"
                  }`}
                  title={
                    subtasksExpanded || isExpanded
                      ? `Hide subtasks (${completedSubtaskCount}/${subtaskCount})`
                      : `Show subtasks (${completedSubtaskCount}/${subtaskCount})`
                  }
                  aria-expanded={subtasksExpanded || isExpanded}
                  aria-label={`${completedSubtaskCount} of ${subtaskCount} subtasks complete. ${subtasksExpanded || isExpanded ? "Hide" : "Show"} subtasks.`}
                >
                  {completedSubtaskCount}/{subtaskCount}
                </button>
              )}
            </div>
          </div>
          <TaskEditButton
            isOpen={isExpanded}
            taskTitle={task.title}
            onClick={(e) => {
              e.stopPropagation();
              onToggleTaskDetail(task.id);
            }}
          />
          {activeTaskId === task.id && isTimerRunning ? (
            <span className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded bg-blue-700 text-white hidden sm:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="hidden sm:inline">Running</span>
            </span>
          ) : activeTaskId === task.id ? (
            <button onClick={(e) => { e.stopPropagation(); onSelectTask(null); }} className="flex-shrink-0 hidden sm:flex px-2 py-1 text-xs font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" title="Deselect task">
              Deselect
            </button>
          ) : isOverdue ? (
            <>
              {/* Mobile: always-visible actions (no hover). */}
              <div
                className="flex sm:hidden shrink-0 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onSnoozeToToday(task.id)}
                  className="px-2 py-1 text-xs font-semibold rounded-md bg-white dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243350] touch-target-sm !min-h-8"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => onStartTask(task.id)}
                  className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 touch-target-sm !min-h-8"
                  title={isTimerRunning ? "Switch focus to this task" : "Focus on this task and start the timer"}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Focus
                </button>
              </div>
              {/* Desktop: overlay on hover — never toggle display, or the row reflows and the page flickers. */}
              <div
                className="pointer-events-none absolute right-9 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-[var(--urgency-border)] bg-[var(--urgency-soft-bg)]/95 px-1 py-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity sm:flex dark:border-rose-800/50 dark:bg-[#1a1520]/95 group-hover/task:pointer-events-auto group-hover/task:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" onClick={() => onSnoozeToToday(task.id)} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-white dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243350] hover:border-blue-400 dark:hover:border-blue-500 transition-colors whitespace-nowrap">
                  Move to today
                </button>
                <button type="button" onClick={() => onToggleComplete(task.id)} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap">
                  Done
                </button>
                <button type="button" onClick={() => onStartTask(task.id)} className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors whitespace-nowrap">
                  Focus
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onStartTask(task.id); }}
              className="flex-shrink-0 flex items-center justify-center px-2 py-1 text-xs font-semibold rounded text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 bg-blue-50 dark:bg-blue-900/25 hover:bg-blue-100 dark:hover:bg-blue-900/40 sm:opacity-0 sm:pointer-events-none sm:group-hover/task:opacity-100 sm:group-hover/task:pointer-events-auto transition-opacity"
              title={isTimerRunning ? "Switch focus to this task" : "Focus on this task and start the timer"}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span className="ml-1">{isTimerRunning ? "Switch" : "Focus"}</span>
            </button>
          )}
          {!(isTimerRunning && activeTaskId === task.id) && (
            <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hidden sm:flex hover-reveal-desktop transition-all" aria-label={`Delete "${task.title}"`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {renderBelowTask(task)}
        </div>
      </div>
    );
  };

  const renderSectionHeader = (
    section: TaskListSection,
    meta: (typeof sectionMeta)[TaskListSection],
    count: number,
    collapsible: boolean,
    expanded: boolean,
    onToggle?: () => void,
  ) => {
    const headerContent = (
      <>
        {collapsible && (
          <svg
            className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
        <span className={`bucket-lane-label ${meta.labelClass}`}>{meta.label}</span>
        <span className="task-list-section-count" aria-label={`${count} tasks`}>
          {count}
        </span>
      </>
    );

    const headerClass = `task-list-section-header ${meta.headerModifier}`;

    if (collapsible && onToggle) {
      return (
        <button
          type="button"
          onClick={onToggle}
          className={`${headerClass} hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a]/80 transition-colors`}
          aria-expanded={expanded}
        >
          {headerContent}
        </button>
      );
    }

    return <div className={headerClass}>{headerContent}</div>;
  };

  const sections: React.ReactNode[] = [];

  for (const section of TASK_LIST_SECTION_ORDER) {
    const meta = sectionMeta[section];
    const sectionTasks = tasksBySection.get(section) ?? [];
    const isCollapsibleInbox = isTimeFilter && section === "inbox";
    const isCollapsibleSomeday = section === "someday";
    const isCollapsible = !!(meta.collapsible && (isCollapsibleInbox || isCollapsibleSomeday));
    const expanded = section === "inbox" ? noDueDateExpanded : somedayExpanded;
    const isCollapsed = isCollapsible && !expanded;
    const count =
      section === "inbox" && scopedUndatedOpenCount > 0
        ? scopedUndatedOpenCount
        : section === "someday" && scopedSomedayOpenCount > 0
          ? scopedSomedayOpenCount
          : sectionTasks.length;

    if (sectionTasks.length === 0 && !isCollapsible) continue;
    if (sectionTasks.length === 0 && isCollapsible && count === 0) continue;

    const onToggle =
      section === "inbox" ? onToggleNoDueDateExpanded : onToggleSomedayExpanded;

    sections.push(
      <section
        key={section}
        aria-label={meta.label}
        className={`task-list-section-panel${meta.extraTopSpace ? " task-list-section-panel--spaced" : ""}`}
      >
        {renderSectionHeader(
          section,
          meta,
          count,
          isCollapsible,
          !!expanded,
          isCollapsible ? onToggle : undefined,
        )}
        {!isCollapsed && sectionTasks.length > 0 && (
          <div
            className={`task-list-section-grid${twoColumn ? " task-list-section-grid--two-col" : ""}`}
          >
            {sectionTasks.map((task) => renderTaskCard(task))}
          </div>
        )}
      </section>
    );
  }

  const containerClass = twoColumn ? "task-list-sections" : `${className} task-list-sections`;

  return <div className={containerClass}>{sections}</div>;
}
