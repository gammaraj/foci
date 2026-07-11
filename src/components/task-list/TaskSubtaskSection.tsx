"use client";

import type { Subtask, Task } from "@/lib/types";
import { formatDueDate, isDueDateOverdue } from "@/components/task-list/utils";
import { DueDateField } from "@/components/task-list/DueDateField";

export interface TaskSubtaskSectionProps {
  task: Task;
  showAddForm?: boolean;
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
  /** Tighter layout for bucket columns */
  compact?: boolean;
}

export function TaskSubtaskSection({
  task,
  showAddForm = true,
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
  compact = false,
}: TaskSubtaskSectionProps) {
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const hasSubtasks = subtasks.length > 0;

  if (!hasSubtasks && !showAddForm) return null;

  const pad = compact ? "px-2" : "px-3 sm:px-4";
  const indent = compact ? "pl-4 ml-2" : "pl-6 ml-4";
  const borderColor = "border-l-2 border-blue-200/70 dark:border-blue-800/50";

  return (
    <div
      className={`${pad} pb-2 pt-0.5 border-t border-slate-100/80 dark:border-[#243350]/60 bg-slate-50/50 dark:bg-black/10`}
      onClick={(e) => e.stopPropagation()}
    >
      {hasSubtasks && (
        <p className={`text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 tracking-wide ${compact ? "pl-2" : ""}`}>
          Subtasks · {completedSubtasks}/{subtasks.length}
        </p>
      )}
      {subtasks.map((sub) => (
        <div
          key={sub.id}
          className={`group/sub flex items-center gap-2 py-1 ${indent} ${borderColor}`}
        >
          <button
            type="button"
            onClick={() => onToggleSubtask(sub.id)}
            className={`flex-shrink-0 w-4 h-4 rounded-full border-[1.5px] transition-colors flex items-center justify-center ${
              sub.completed
                ? "border-emerald-500 bg-emerald-500"
                : "border-slate-300 dark:border-slate-600 hover:border-blue-500"
            }`}
            aria-label={`Toggle subtask "${sub.title}"`}
          >
            {sub.completed && (
              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="flex-1 min-w-0 px-1 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => onStartEditSubtask(sub)}
              className={`flex-1 min-w-0 text-left text-sm font-medium truncate ${
                sub.completed
                  ? "text-slate-400 dark:text-slate-500 line-through"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {sub.title}
            </button>
          )}
          <DueDateField
            value={sub.dueDate}
            onChange={(date) => onSetSubtaskDueDate(sub.id, date)}
            requireExplicitPick={!sub.dueDate}
            ariaLabel="Subtask due date"
            className={`relative flex-shrink-0 p-0.5 transition-colors ${
              sub.dueDate && !sub.completed && isDueDateOverdue(sub.dueDate)
                ? "text-red-500 dark:text-red-400"
                : sub.dueDate
                  ? "text-slate-500 dark:text-slate-400"
                  : "text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100"
            }`}
          >
            <span title={sub.dueDate ? `Due: ${formatDueDate(sub.dueDate)}` : "Set due date"}>
              {sub.dueDate ? (
                <span className="text-xs font-medium">{formatDueDate(sub.dueDate)}</span>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </span>
          </DueDateField>
          <button
            type="button"
            onClick={() => onDeleteSubtask(sub.id)}
            className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label={`Delete subtask "${sub.title}"`}
            title="Delete subtask"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddSubtask();
          }}
          className={`flex items-center gap-2 pt-1 ${indent} ${borderColor}`}
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
            placeholder="Add a subtask…"
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-200 dark:border-[#243350] rounded-md bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-400 outline-none"
          />
          <button
            type="submit"
            disabled={!newSubtaskTitle.trim()}
            className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
