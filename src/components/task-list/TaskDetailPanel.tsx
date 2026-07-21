"use client";

import React, { useMemo, useState } from "react";
import type { Project, RecurrenceType, Subtask, Task, TaskKind, TaskPriority } from "@/lib/types";
import { getToday } from "@/lib/dates";
import { formatDueDate, isDueDateOverdue } from "@/components/task-list/utils";
import { DueDateField } from "@/components/task-list/DueDateField";
import { TaskSubtaskSection } from "@/components/task-list/TaskSubtaskSection";

const chipBase =
  "flex w-full min-w-0 max-w-full box-border items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors text-left";
const chipBaseDrawer =
  "flex w-full min-w-0 max-w-full box-border items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors text-left min-h-[2.4rem]";
const chipIdle =
  "border-slate-200 dark:border-[#243350] text-slate-500 dark:text-slate-400 bg-white dark:bg-[#131d30]";
const chipEmpty =
  "border-dashed border-slate-200 dark:border-[#243350] text-slate-400 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-500";
const selectControl =
  "flex-1 w-full min-w-0 max-w-full bg-transparent dark:text-white outline-none focus-visible:ring-1 focus-visible:ring-blue-400 cursor-pointer";

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
  onSetKind: (kind: TaskKind | undefined) => void;
  onSetBlocked: (blocked: boolean) => void;
  onSetSomeday: (someday: boolean) => void;
  onSetRecurrence: (recurrence: RecurrenceType | undefined) => void;
  onMoveToProject: (projectId: string) => void;
  newSubtaskTitle: string;
  onNewSubtaskTitleChange: (value: string) => void;
  onAddSubtask: () => void;
  editingSubtaskId: string | null;
  editSubtaskTitle: string;
  onStartEditSubtask: (sub: Subtask, titleOverride?: string) => void;
  onEditSubtaskTitleChange: (value: string) => void;
  onSaveSubtaskEdit: (subId: string) => void;
  onCancelEditSubtask: () => void;
  onToggleSubtask: (subId: string) => void;
  onSetSubtaskDueDate: (subId: string, date: string | undefined) => void;
  onDeleteSubtask: (subId: string) => void;
  onReorderSubtasks?: (draggedId: string, targetId: string) => void;
  onDeleteTask?: () => void;
  onStartTask?: () => void;
  onDeselectTask?: () => void;
  /** Flush drafts and close the panel / drawer. */
  onSave?: () => void;
  /** When subtasks are shown inline below the task row */
  hideSubtasks?: boolean;
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
  onSetKind,
  onSetBlocked,
  onSetSomeday,
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
  onReorderSubtasks,
  onDeleteTask,
  onStartTask,
  onDeselectTask,
  onSave,
  hideSubtasks = false,
}: TaskDetailPanelProps) {
  const isDrawer = variant === "drawer";
  const pad = isDrawer ? "px-4 sm:px-6" : "px-4";
  const chip = isDrawer ? chipBaseDrawer : chipBase;
  const selectText = "text-xs";
  const iconSize = "w-3.5 h-3.5";
  const wrapperClass =
    variant === "inline"
      ? `border border-t-0 rounded-b-xl py-3 space-y-2 min-w-0 ${
          isLinked
            ? "border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
            : "border-slate-200 dark:border-[#1e3050] bg-slate-50/50 dark:bg-[#131d30]/50"
        }`
      : "flex flex-col min-h-full min-w-0 w-full max-w-full overflow-x-hidden";

  const isFocused = activeTaskId === task.id;
  const isInProgress = isFocused && isTimerRunning;

  const [detailsOpen, setDetailsOpen] = useState(false);

  const detailsSummary = useMemo(() => {
    const bits: string[] = [];
    if (task.priority === 1) bits.push("High");
    else if (task.priority === 2) bits.push("Medium");
    else if (task.priority === 3) bits.push("Low");
    if (task.kind === "note") bits.push("Note");
    else if (task.kind === "question") bits.push("Question");
    if (task.blocked) bits.push("Waiting");
    if (task.someday) bits.push("Someday");
    if (task.recurrence) bits.push(task.recurrence);
    if (task.description?.trim()) bits.push("Has description");
    return bits;
  }, [task]);

  const handleSave = () => {
    onSave?.();
  };

  const descriptionBlock = (
    <div className={isDrawer ? "pb-1" : ""}>
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
          rows={isDrawer ? 2 : 3}
          className={`w-full px-3 py-2.5 border border-blue-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 resize-y ${
            isDrawer ? "text-base sm:text-sm" : "text-sm"
          }`}
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={onStartEditDesc}
          className={`w-full text-left px-3 ${isDrawer ? "py-2.5 min-h-[2.5rem]" : "py-2"} text-sm rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:outline-none ${
            task.description
              ? "border-slate-200 dark:border-[#243350] hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
              : chipEmpty
          }`}
        >
          {task.description ? (
            <span className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.description}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-400">Add a description...</span>
          )}
        </button>
      )}
    </div>
  );

  const dueDateChip = (
    <DueDateField
      value={task.dueDate}
      onChange={onSetDueDate}
      requireExplicitPick={!task.dueDate}
      ariaLabel="Set due date"
      className={`${chip} ${
        task.dueDate && !task.completed && isDueDateOverdue(task.dueDate)
          ? "border-[var(--urgency-border)] text-[var(--urgency)] bg-[var(--urgency-soft-bg)] dark:border-rose-800 dark:text-rose-300 dark:bg-rose-950/30"
          : task.dueDate && task.dueDate === getToday()
            ? "border-orange-200 dark:border-orange-800 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
            : task.dueDate
              ? chipIdle
              : chipEmpty
      }`}
    >
      <svg className={`${iconSize} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="truncate">
        {task.dueDate ? (
          <>
            {formatDueDate(task.dueDate)}
            {!task.completed && isDueDateOverdue(task.dueDate) && " (overdue)"}
          </>
        ) : (
          "Set due date"
        )}
      </span>
    </DueDateField>
  );

  const priorityChip = (
    <div className={`${chip} ${chipIdle}`}>
      <svg className={`${iconSize} text-slate-400 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
      <select
        value={task.priority ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          onSetPriority(value ? (parseInt(value, 10) as TaskPriority) : undefined);
        }}
        className={`${selectControl} ${selectText}`}
        aria-label="Priority"
      >
        <option value="">No priority</option>
        <option value="1">High</option>
        <option value="2">Medium</option>
        <option value="3">Low</option>
      </select>
    </div>
  );

  const kindChip = (
    <div className={`${chip} ${chipIdle}`}>
      <svg className={`${iconSize} text-slate-400 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      <select
        value={task.kind ?? "task"}
        onChange={(e) => {
          const value = e.target.value as TaskKind;
          onSetKind(value === "task" ? undefined : value);
        }}
        className={`${selectControl} ${selectText}`}
        aria-label="Type"
        title="Mark as task, note, or question"
      >
        <option value="task">Task</option>
        <option value="note">Note</option>
        <option value="question">Question</option>
      </select>
    </div>
  );

  const waitingChip = (
    <button
      type="button"
      onClick={() => onSetBlocked(!task.blocked)}
      className={`${chip} ${
        task.blocked
          ? "border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40"
          : `${chipEmpty} hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-700 dark:hover:text-amber-300`
      }`}
      aria-pressed={!!task.blocked}
      title={task.blocked ? "Clear waiting status" : "Mark as waiting on something external"}
    >
      <svg className={`${iconSize} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="truncate">{task.blocked ? "Waiting" : "Mark waiting"}</span>
    </button>
  );

  const somedayChip = (
    <button
      type="button"
      onClick={() => onSetSomeday(!task.someday)}
      className={`${chip} ${
        task.someday
          ? "border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200 bg-violet-50 dark:bg-violet-950/40"
          : `${chipEmpty} hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300`
      }`}
      aria-pressed={!!task.someday}
      title={task.someday ? "Return to active inbox" : "Defer to someday/maybe — clears due date"}
    >
      <svg className={`${iconSize} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
      <span className="truncate">{task.someday ? "Someday" : "Mark someday"}</span>
    </button>
  );

  const recurrenceChip = (
    <div className={`${chip} ${chipIdle}`}>
      <svg className={`${iconSize} text-slate-400 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <select
        value={task.recurrence ?? ""}
        onChange={(e) => onSetRecurrence((e.target.value || undefined) as RecurrenceType | undefined)}
        className={`${selectControl} ${selectText}`}
        aria-label="Recurrence"
      >
        <option value="">No repeat</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
  );

  const projectChip =
    activeProjects.length > 1 ? (
      <div className={`${chip} ${chipIdle}`}>
        <svg className={`${iconSize} text-slate-400 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <select
          value={task.projectId}
          onChange={(e) => onMoveToProject(e.target.value)}
          className={`${selectControl} ${selectText} truncate`}
          aria-label="Move to project"
        >
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  const focusChip = onStartTask ? (
    isInProgress ? (
      <span className={`${chip} border-blue-500/50 bg-blue-600 text-white`} title="Timer is running on this task">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
        <span className="truncate">In progress</span>
      </span>
    ) : (
      <button
        type="button"
        onClick={() => {
          if (isFocused) onDeselectTask?.();
          else onStartTask();
        }}
        className={`${chip} ${
          isFocused
            ? "border-blue-400/60 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/25"
            : `${chipIdle} hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300`
        }`}
        title={
          isFocused
            ? "Deselect this task"
            : isTimerRunning
              ? "Switch focus to this task"
              : "Focus on this task and start the timer"
        }
        aria-pressed={isFocused}
      >
        <svg className={`${iconSize} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="truncate">{isFocused ? "Focused" : isTimerRunning ? "Switch focus" : "Focus"}</span>
      </button>
    )
  ) : null;

  const subtaskBlock = !hideSubtasks ? (
    <TaskSubtaskSection
      task={task}
      showAddForm
      compact={false}
      spacious={isDrawer}
      newSubtaskTitle={newSubtaskTitle}
      onNewSubtaskTitleChange={onNewSubtaskTitleChange}
      onAddSubtask={onAddSubtask}
      editingSubtaskId={editingSubtaskId}
      editSubtaskTitle={editSubtaskTitle}
      onStartEditSubtask={onStartEditSubtask}
      onEditSubtaskTitleChange={onEditSubtaskTitleChange}
      onSaveSubtaskEdit={onSaveSubtaskEdit}
      onCancelEditSubtask={onCancelEditSubtask}
      onToggleSubtask={onToggleSubtask}
      onSetSubtaskDueDate={onSetSubtaskDueDate}
      onDeleteSubtask={onDeleteSubtask}
      onReorderSubtasks={onReorderSubtasks}
    />
  ) : null;

  const detailsGrid = isDrawer ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-w-0 w-full">
      {priorityChip}
      {focusChip}
      {projectChip}
      {kindChip}
      {recurrenceChip}
      {waitingChip}
      {somedayChip}
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-2 min-w-0 w-full">
      {priorityChip}
      {kindChip}
      {waitingChip}
      {somedayChip}
      {recurrenceChip}
      {projectChip}
      {focusChip}
    </div>
  );

  const dueDateBlock = (
    <div className={`${pad} ${isDrawer ? "pt-3 pb-1" : "pb-1"}`}>
      <div className="max-w-xs">{dueDateChip}</div>
    </div>
  );

  const moreDetailsBlock = (
    <div className={`${pad} ${isDrawer ? "pt-2 pb-2" : "pb-1"}`}>
      <button
        type="button"
        onClick={() => setDetailsOpen((open) => !open)}
        className="w-full flex items-center gap-2 text-left py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-[#1a2d4a]/60 transition-colors group"
        aria-expanded={detailsOpen}
      >
        <svg
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${detailsOpen ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          More details
        </span>
        {!detailsOpen && detailsSummary.length > 0 && (
          <span className="min-w-0 flex-1 truncate text-xs text-slate-400 dark:text-slate-500 font-normal">
            {detailsSummary.join(" · ")}
          </span>
        )}
      </button>

      {detailsOpen && (
        <div className="mt-2 space-y-3">
          {descriptionBlock}
          {detailsGrid}
        </div>
      )}
    </div>
  );

  const footer =
    onDeleteTask || onSave ? (
      <div
        className={`flex items-center gap-2 min-w-0 w-full ${pad} ${
          isDrawer
            ? "pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-4 sticky bottom-0 bg-white/95 dark:bg-[#131d30]/95 backdrop-blur-sm border-t border-slate-100 dark:border-[#243350] mt-auto"
            : "pt-3 pb-1 border-t border-slate-100 dark:border-[#243350] mt-2"
        }`}
      >
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            className={`flex-1 min-w-0 px-3 ${
              isDrawer ? "py-3 text-sm rounded-xl min-h-[2.75rem]" : "py-2 text-xs rounded-md"
            } font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors`}
          >
            Save
          </button>
        )}
        {onDeleteTask && !(isTimerRunning && isFocused) && (
          <button
            type="button"
            onClick={onDeleteTask}
            className={`px-3 ${
              isDrawer ? "py-3 text-sm rounded-xl min-h-[2.75rem]" : "py-2 text-xs rounded-md"
            } font-medium text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5 shrink-0`}
            aria-label="Delete task"
          >
            <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className={isDrawer ? "hidden sm:inline" : undefined}>Delete</span>
          </button>
        )}
      </div>
    ) : null;

  // Due date stays visible; description + other meta stay under More details.
  return (
    <div onClick={(e) => e.stopPropagation()} className={wrapperClass}>
      {dueDateBlock}
      {subtaskBlock}
      {moreDetailsBlock}
      {footer}
    </div>
  );
}
