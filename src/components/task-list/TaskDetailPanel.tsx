"use client";

import React from "react";
import type { Project, RecurrenceType, Subtask, Task, TaskPriority } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { formatDueDate, isDueDateOverdue } from "@/components/task-list/utils";

export interface TaskDetailPanelProps {
  task: Task;
  variant?: "inline" | "drawer";
  isLinked?: boolean;
  activeTaskId: string | null;
  isTimerRunning: boolean;
  activeProjects: Project[];
  editingDesc: boolean;
  editDesc: string;
  onEditDescChange: (value: string) => void;
  onStartEditDesc: () => void;
  onSaveDesc: () => void;
  onCancelEditDesc: () => void;
  onSetDueDate: (date: string | undefined) => void;
  onSetPriority: (priority: TaskPriority | undefined) => void;
  onSetRecurrence: (recurrence: RecurrenceType | undefined) => void;
  onMoveToProject: (projectId: string) => void;
  newSubtaskTitle: string;
  onNewSubtaskTitleChange: (value: string) => void;
  onAddSubtask: () => void;
  editingSubtaskId: string | null;
  editSubtaskTitle: string;
  onStartEditSubtask: (sub: Subtask) => void;
  onEditSubtaskTitleChange: (value: string) => void;
  onSaveSubtaskEdit: (subId: string) => void;
  onCancelEditSubtask: () => void;
  onToggleSubtask: (subId: string) => void;
  onSetSubtaskDueDate: (subId: string, date: string | undefined) => void;
  onDeleteSubtask: (subId: string) => void;
  onDeleteTask?: () => void;
  onStartTask?: () => void;
  onDeselectTask?: () => void;
}

export function TaskDetailPanel({
  task,
  variant = "inline",
  isLinked = false,
  activeTaskId,
  isTimerRunning,
  activeProjects,
  editingDesc,
  editDesc,
  onEditDescChange,
  onStartEditDesc,
  onSaveDesc,
  onCancelEditDesc,
  onSetDueDate,
  onSetPriority,
  onSetRecurrence,
  onMoveToProject,
  newSubtaskTitle,
  onNewSubtaskTitleChange,
  onAddSubtask,
  editingSubtaskId,
  editSubtaskTitle,
  onStartEditSubtask,
  onEditSubtaskTitleChange,
  onSaveSubtaskEdit,
  onCancelEditSubtask,
  onToggleSubtask,
  onSetSubtaskDueDate,
  onDeleteSubtask,
  onDeleteTask,
  onStartTask,
  onDeselectTask,
}: TaskDetailPanelProps) {
  const pad = variant === "drawer" ? "px-4" : "px-4";
  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const wrapperClass =
    variant === "inline"
      ? `border border-t-0 rounded-b-xl py-3 space-y-2 ${
          isLinked
            ? "border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
            : "border-slate-200 dark:border-[#1e3050] bg-slate-50/50 dark:bg-[#131d30]/50"
        }`
      : "py-2 space-y-2";

  return (
    <div onClick={(e) => e.stopPropagation()} className={wrapperClass}>
      <div className={`${pad} pb-2`}>
        {editingDesc ? (
          <textarea
            value={editDesc}
            onChange={(e) => onEditDescChange(e.target.value)}
            onBlur={onSaveDesc}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancelEditDesc();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSaveDesc();
            }}
            placeholder="Add a description..."
            maxLength={2000}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none resize-y"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={onStartEditDesc}
            className="w-full text-left px-3 py-2 text-sm rounded-lg border border-dashed border-slate-200 dark:border-[#243350] hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors"
          >
            {task.description ? (
              <span className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.description}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-400">Add a description...</span>
            )}
          </button>
        )}
      </div>

      <div className={`${pad} pb-2 flex flex-wrap items-center gap-2`}>
        <div
          className={`relative inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
            task.dueDate && !task.completed && isDueDateOverdue(task.dueDate)
              ? "border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
              : task.dueDate && task.dueDate === getToday()
                ? "border-orange-200 dark:border-orange-800 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                : task.dueDate
                  ? "border-slate-200 dark:border-[#243350] text-slate-600 dark:text-slate-300 bg-white dark:bg-[#131d30]"
                  : "border-dashed border-slate-200 dark:border-[#243350] text-slate-400 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-500"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {task.dueDate ? (
            <>
              {formatDueDate(task.dueDate)}
              {!task.completed && isDueDateOverdue(task.dueDate) && " (overdue)"}
            </>
          ) : (
            "Set due date"
          )}
          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) => onSetDueDate(e.target.value || undefined)}
            onFocus={(e) => {
              try {
                (e.target as HTMLInputElement).showPicker();
              } catch {}
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Set due date"
          />
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30]">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
          <select
            value={task.priority ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              onSetPriority(value ? (parseInt(value, 10) as TaskPriority) : undefined);
            }}
            className="text-xs bg-transparent dark:text-white outline-none cursor-pointer max-w-[6.5rem]"
            aria-label="Priority"
          >
            <option value="">No priority</option>
            <option value="1">High</option>
            <option value="2">Medium</option>
            <option value="3">Low</option>
          </select>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30]">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <select
            value={task.recurrence ?? ""}
            onChange={(e) => onSetRecurrence((e.target.value || undefined) as RecurrenceType | undefined)}
            className="text-xs bg-transparent dark:text-white outline-none cursor-pointer"
            aria-label="Recurrence"
          >
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {activeProjects.length > 1 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] min-w-0 max-w-full">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <select
              value={task.projectId}
              onChange={(e) => onMoveToProject(e.target.value)}
              className="text-xs bg-transparent dark:text-white outline-none cursor-pointer min-w-0 max-w-[8rem] truncate"
              aria-label="Move to project"
            >
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-[#1e3050] pt-2 mt-1">
        {hasSubtasks && (
          <div className={`${pad} pb-1`}>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide">
              Subtasks ({completedSubtasks}/{subtasks.length})
            </span>
          </div>
        )}
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="group/sub flex items-center gap-2.5 py-1 pl-6 pr-4 ml-4 border-l-2 border-slate-200 dark:border-[#243350]"
          >
            <button
              type="button"
              onClick={() => onToggleSubtask(sub.id)}
              className={`flex-shrink-0 w-5 h-5 rounded border-[1.5px] transition-colors flex items-center justify-center ${
                sub.completed
                  ? "border-green-400 bg-green-500"
                  : "border-slate-300 dark:border-slate-600 hover:border-blue-500"
              }`}
              aria-label={`Toggle subtask "${sub.title}"`}
            >
              {sub.completed && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            {editingSubtaskId === sub.id ? (
              <input
                type="text"
                value={editSubtaskTitle}
                onChange={(e) => onEditSubtaskTitleChange(e.target.value)}
                onBlur={() => onSaveSubtaskEdit(sub.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveSubtaskEdit(sub.id);
                  if (e.key === "Escape") onCancelEditSubtask();
                }}
                className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                type="button"
                onClick={() => onStartEditSubtask(sub)}
                className={`flex-1 text-left text-sm ${
                  sub.completed
                    ? "text-slate-400 dark:text-slate-400 line-through"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {sub.title}
              </button>
            )}
            <div
              className={`relative flex-shrink-0 p-1 transition-colors ${
                sub.dueDate && !sub.completed && isDueDateOverdue(sub.dueDate)
                  ? "text-red-500 dark:text-red-400"
                  : sub.dueDate
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100"
              }`}
              title={sub.dueDate ? `Due: ${formatDueDate(sub.dueDate)}` : "Set due date"}
            >
              {sub.dueDate ? (
                <span className="text-xs font-medium">{formatDueDate(sub.dueDate)}</span>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              <input
                type="date"
                value={sub.dueDate ?? ""}
                onChange={(e) => onSetSubtaskDueDate(sub.id, e.target.value || undefined)}
                onFocus={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker();
                  } catch {}
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Subtask due date"
              />
            </div>
            <button
              type="button"
              onClick={() => onDeleteSubtask(sub.id)}
              className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 transition-all"
              aria-label={`Delete subtask "${sub.title}"`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddSubtask();
          }}
          className="flex items-center gap-2 pl-6 pr-4 ml-4 border-l-2 border-slate-200 dark:border-[#243350] pt-1"
        >
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => onNewSubtaskTitleChange(e.target.value)}
            placeholder="Add a subtask..."
            className="flex-1 px-2 py-1 text-sm border border-slate-200 dark:border-[#243350] rounded-md bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-400 outline-none"
          />
          <button
            type="submit"
            disabled={!newSubtaskTitle.trim()}
            className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {(onDeleteTask || onStartTask) && (
        <div
          className={`flex items-center gap-2 ${pad} pt-3 pb-1 border-t border-slate-100 dark:border-[#243350] mt-2 ${
            variant === "inline" ? "sm:hidden" : ""
          }`}
        >
          {activeTaskId === task.id && isTimerRunning ? (
            <span className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              In progress
            </span>
          ) : onStartTask ? (
            <button
              type="button"
              onClick={() => {
                if (activeTaskId === task.id) onDeselectTask?.();
                else onStartTask();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTaskId === task.id
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {activeTaskId === task.id ? "Deselect" : isTimerRunning ? "Switch focus" : "Focus"}
            </button>
          ) : null}
          {onDeleteTask && !(isTimerRunning && activeTaskId === task.id) && (
            <button
              type="button"
              onClick={onDeleteTask}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskDetailDrawerProps {
  task: Task;
  onClose: () => void;
  children: React.ReactNode;
}

export function TaskDetailDrawer({ task, onClose, children }: TaskDetailDrawerProps) {
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-label={`Edit task: ${task.title}`}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close task details"
      />
      <aside className="relative w-full max-w-md h-full bg-white dark:bg-[#111827] shadow-2xl border-l border-slate-200 dark:border-[#243350] flex flex-col">
        <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-[#243350] shrink-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Task details
            </p>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{task.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
