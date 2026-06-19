"use client";

import React from "react";
import type { Task } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { formatDueDate, formatDuration, isDueDateOverdue } from "@/components/task-list/utils";

export interface OpenTaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  isTimerRunning: boolean;
  expandedTaskId: string | null;
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
  onToggleComplete: (id: string) => void;
  onSaveEdit: (id: string) => void;
  onStartEdit: (task: Task) => void;
  onEditTitleChange: (value: string) => void;
  onCancelEdit: () => void;
  onToggleTaskDetail: (id: string) => void;
  onStartTask: (id: string) => void;
  onSelectTask: (id: string | null) => void;
  onDeleteTask: (id: string) => void;
  onSetDueDate: (id: string, date: string | undefined) => void;
  onSnoozeToToday: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  onMoveTask: (id: string, direction: "up" | "down") => void;
  renderBelowTask: (task: Task) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function OpenTaskList({
  tasks,
  activeTaskId,
  isTimerRunning,
  expandedTaskId,
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
  onToggleComplete,
  onSaveEdit,
  onStartEdit,
  onEditTitleChange,
  onCancelEdit,
  onToggleTaskDetail,
  onStartTask,
  onSelectTask,
  onDeleteTask,
  onSetDueDate,
  onSnoozeToToday,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveTask,
  renderBelowTask,
  emptyMessage = "No open tasks",
  className = "space-y-2",
}: OpenTaskListProps) {
  if (tasks.length === 0) {
    return <p className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className={className}>
      {tasks.map((task, index) => {
        const isExpanded = expandedTaskId === task.id;
        const isOverdue = task.dueDate && isDueDateOverdue(task.dueDate);
        const prevTask = index > 0 ? tasks[index - 1] : null;
        const prevIsOverdue = !!(prevTask?.dueDate && isDueDateOverdue(prevTask.dueDate));
        const showOverdueHeader = isOverdue && !prevIsOverdue;
        const showUpcomingHeader = !isOverdue && prevIsOverdue;
        const showNoDueDateHeader =
          isTimeFilter && !task.dueDate && (index === 0 || !!prevTask?.dueDate);
        const isUndatedInTimeFilter = isTimeFilter && !task.dueDate;

        if (isUndatedInTimeFilter && !noDueDateExpanded) {
          if (!showNoDueDateHeader) return null;
          return (
            <button
              key="no-due-date-section"
              type="button"
              onClick={onToggleNoDueDateExpanded}
              className="mb-2 mt-3 pl-3 py-1.5 border-l-[3px] border-l-slate-300 dark:border-l-slate-600 w-full text-left flex items-center gap-2 hover:bg-slate-50/80 dark:hover:bg-[#131d30]/60 rounded-r-lg transition-colors"
              aria-expanded={false}
            >
              <svg
                className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="app-section-label text-slate-600 dark:text-slate-400">No due date</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                ({scopedUndatedOpenCount})
              </span>
            </button>
          );
        }

        return (
          <div key={task.id}>
            {showNoDueDateHeader && onToggleNoDueDateExpanded && (
              <button
                type="button"
                onClick={onToggleNoDueDateExpanded}
                className="mb-2 mt-3 pl-3 py-1.5 border-l-[3px] border-l-slate-300 dark:border-l-slate-600 w-full text-left flex items-center gap-2 hover:bg-slate-50/80 dark:hover:bg-[#131d30]/60 rounded-r-lg transition-colors"
                aria-expanded={noDueDateExpanded}
              >
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${noDueDateExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="app-section-label text-slate-600 dark:text-slate-400">No due date</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                  ({scopedUndatedOpenCount})
                </span>
              </button>
            )}
            {showOverdueHeader && (
              <div className="mb-2 mt-1 pl-3 py-1 border-l-[3px] border-l-red-500 dark:border-l-rose-500">
                <span className="app-section-label text-red-700 dark:text-red-300">Overdue</span>
              </div>
            )}
            {showUpcomingHeader && (
              <div className="mb-2 mt-1 pl-3 py-1 border-l-[3px] border-l-slate-400 dark:border-l-slate-500">
                <span className="app-section-label text-slate-600 dark:text-slate-400">Upcoming</span>
              </div>
            )}
            <div
              draggable
              aria-current={activeTaskId === task.id ? "true" : undefined}
              data-linked-to-timer={activeTaskId === task.id ? "true" : undefined}
              onDragStart={() => onDragStart(task.id)}
              onDragOver={(e) => onDragOver(e, task.id)}
              onDrop={() => onDrop(task.id)}
              onDragEnd={onDragEnd}
              className={`group flex items-start gap-1.5 sm:gap-3 p-2 sm:p-3.5 rounded-xl border transition-colors ${
                activeTaskId === task.id
                  ? "task-timer-linked border-cyan-400 dark:border-cyan-500 bg-cyan-50 dark:bg-cyan-900/25 border-l-[3px] border-l-blue-500 dark:border-l-blue-400 ring-2 ring-cyan-400/30 dark:ring-cyan-500/25"
                  : isExpanded
                    ? "border-violet-300 dark:border-violet-600 bg-violet-50/40 dark:bg-violet-900/10 ring-1 ring-violet-400/25"
                    : isOverdue
                      ? "border-slate-300 dark:border-[#1e3050] hover:bg-red-50/40 dark:hover:bg-red-950/15 border-l-[3px] border-l-red-500 dark:border-l-rose-500 shadow-sm"
                      : "border-slate-300 dark:border-[#1e3050] hover:bg-slate-50 dark:hover:bg-[#131d30] shadow-sm"
              } ${dragTaskId === task.id ? "opacity-50" : ""} ${
                dragOverTaskId === task.id && dragTaskId !== task.id ? "border-t-2 border-t-blue-500" : ""
              }`}
            >
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5 mt-0.5">
                <div className="hidden sm:block cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                  </svg>
                </div>
                {tasks.length > 1 && (
                  <div className="sm:hidden flex flex-col -my-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveTask(task.id, "up");
                      }}
                      disabled={tasks[0]?.id === task.id}
                      className="p-0.5 text-slate-400 dark:text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                      aria-label="Move up"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveTask(task.id, "down");
                      }}
                      disabled={tasks[tasks.length - 1]?.id === task.id}
                      className="p-0.5 text-slate-400 dark:text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                      aria-label="Move down"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task.id);
                }}
                className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 mt-0.5 rounded-md border-2 border-slate-300 dark:border-slate-500 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-all active:animate-check-bounce flex items-center justify-center"
                aria-label={`Mark "${task.title}" complete`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-slate-800 dark:text-slate-50 break-words leading-normal">
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
                      className="w-full px-1 py-0.5 text-sm font-medium border border-cyan-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onStartEdit(task);
                      }}
                      className="cursor-text"
                      title="Double-click to edit title"
                    >
                      {task.title}
                    </span>
                  )}
                  {activeTaskId === task.id && isTimerRunning && (
                    <span className="sm:hidden ml-1.5 inline-flex items-center w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse align-middle" />
                  )}
                  {task.priority && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase rounded ${
                        task.priority === 1
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50"
                          : task.priority === 2
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50"
                            : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/50"
                      }`}
                    >
                      {task.priority === 1 ? "HIGH" : task.priority === 2 ? "MED" : "LOW"}
                    </span>
                  )}
                  {showProjectBadge && (isAllProjects || isTimeFilter) && getProjectName && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#1a2d4a] text-slate-600 dark:text-slate-300">
                      {getProjectName(task.projectId)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                  {task.dueDate && (
                    <div
                      className={`relative inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                        !task.completed && isDueDateOverdue(task.dueDate)
                          ? "text-red-500 dark:text-rose-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                          : !task.completed && task.dueDate === getToday()
                            ? "text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            : "text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-[#2a3f5f]/80 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
                      }`}
                      title={`Due: ${formatDueDate(task.dueDate)}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDueDate(task.dueDate)}
                      {!task.completed && isDueDateOverdue(task.dueDate) && " (overdue)"}
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) => onSetDueDate(task.id, e.target.value || undefined)}
                        onFocus={(e) => {
                          try {
                            (e.target as HTMLInputElement).showPicker();
                          } catch {}
                        }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          opacity: 0,
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  )}
                  {(task.description || task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-300">·</span>
                  )}
                  {task.description && (
                    <span className="app-text-meta text-slate-500 dark:text-slate-300 flex items-center gap-0.5" title="Has description">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                      </svg>
                    </span>
                  )}
                  {task.description && (task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-300">·</span>
                  )}
                  {(task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="app-text-meta text-slate-500 dark:text-slate-300">
                      {task.sessions > 0 && (
                        <>
                          {task.sessions} total session{task.sessions !== 1 ? "s" : ""}
                        </>
                      )}
                      {task.sessions > 0 && (task.timeSpent || 0) > 0 && " · "}
                      {(task.timeSpent || 0) > 0 && formatDuration(task.timeSpent)}
                    </span>
                  )}
                  {task.recurrence && (
                    <>
                      <span className="text-xs text-slate-400 dark:text-slate-300">·</span>
                      <span
                        className="app-text-meta text-slate-500 dark:text-slate-300 flex items-center gap-0.5"
                        title={`Repeats ${task.recurrence}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        {task.recurrence}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTaskDetail(task.id);
                }}
                className={`flex-shrink-0 min-w-[28px] sm:min-w-[36px] min-h-[28px] sm:min-h-[36px] rounded-md flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-[#1a2d4a] ${
                  isExpanded
                    ? "text-violet-500 dark:text-violet-400"
                    : "text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300"
                }`}
                title={isExpanded ? "Close details" : "Task details"}
                aria-label={isExpanded ? "Close task details" : "Open task details"}
                aria-expanded={isExpanded}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {activeTaskId === task.id && !isTimerRunning && (
                <span className="lg:hidden flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/50">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Timer
                </span>
              )}
              {activeTaskId === task.id && isTimerRunning ? (
                <span className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm font-medium rounded bg-cyan-600 text-white hidden sm:flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="hidden sm:inline">In progress</span>
                </span>
              ) : activeTaskId === task.id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTask(null);
                  }}
                  className="flex-shrink-0 hidden sm:flex px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 touch-target-sm"
                  title="Deselect task"
                >
                  Deselect
                </button>
              ) : !isOverdue ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTask(task.id);
                  }}
                  className="flex-shrink-0 flex items-center justify-center px-2.5 py-1.5 text-xs sm:text-sm font-semibold rounded text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/50 bg-cyan-50 dark:bg-cyan-900/25 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 touch-target-sm"
                  title={
                    isTimerRunning ? "Switch focus to this task" : "Focus on this task and start the timer"
                  }
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  <span className="ml-1">{isTimerRunning ? "Switch" : "Focus"}</span>
                </button>
              ) : null}
              {!(isTimerRunning && activeTaskId === task.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="flex-shrink-0 p-2 rounded-md text-slate-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hidden sm:flex hover-reveal-desktop transition-all"
                  aria-label={`Delete "${task.title}"`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {isOverdue && !task.completed && (
              <div
                className="flex flex-wrap items-center gap-1.5 mt-1.5 mb-0.5 px-1 sm:px-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onSnoozeToToday(task.id)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243350] hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors"
                >
                  Move to today
                </button>
                <button
                  type="button"
                  onClick={() => onToggleComplete(task.id)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => onStartTask(task.id)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
                >
                  Focus
                </button>
              </div>
            )}
            {renderBelowTask(task)}
          </div>
        );
      })}
    </div>
  );
}
