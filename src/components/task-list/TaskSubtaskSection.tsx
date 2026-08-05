"use client";

import { useRef, useState } from "react";
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
  onStartEditSubtask: (sub: Subtask, titleOverride?: string) => void;
  onEditSubtaskTitleChange: (value: string) => void;
  onSaveSubtaskEdit: (subId: string) => void;
  onCancelEditSubtask: () => void;
  onToggleSubtask: (subId: string) => void;
  onSetSubtaskDueDate: (subId: string, date: string | undefined) => void;
  onDeleteSubtask: (subId: string) => void;
  onReorderSubtasks?: (draggedId: string, targetId: string) => void;
  /** Tighter layout for bucket/card columns */
  compact?: boolean;
  /** Roomier layout for the task details drawer */
  spacious?: boolean;
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
  onReorderSubtasks,
  compact = false,
  spacious = false,
}: TaskSubtaskSectionProps) {
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const hasSubtasks = subtasks.length > 0;
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dragSubtaskId, setDragSubtaskId] = useState<string | null>(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState<string | null>(null);
  const canReorder = Boolean(onReorderSubtasks) && subtasks.length > 1;

  if (!hasSubtasks && !showAddForm) return null;

  const pad = compact ? "px-1.5 sm:px-2" : spacious ? "px-4 sm:px-6" : "px-3 sm:px-4";
  const indent = compact ? "pl-3 ml-1.5" : spacious ? "pl-0" : "pl-6 ml-4";
  const borderColor = compact || spacious ? "" : "border-l-2 border-blue-200/70 dark:border-blue-800/50";
  const actionReveal = compact
    ? "opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 sm:focus-within:opacity-100"
    : "";

  const focusSubtask = (sub: Subtask) => {
    onStartEditSubtask(sub);
    // Keep the same input mounted — focus without rewriting selection so the click caret sticks.
    requestAnimationFrame(() => {
      inputRefs.current[sub.id]?.focus();
    });
  };

  const clearDrag = () => {
    setDragSubtaskId(null);
    setDragOverSubtaskId(null);
  };

  return (
    <div
      className={`${pad} ${
        compact
          ? "pb-1 pt-0.5 border-t border-slate-100/80 dark:border-[#243350]/60 bg-transparent"
          : spacious
            ? "pb-4 pt-1"
            : "pb-2 pt-0.5 border-t border-slate-100/80 dark:border-[#243350]/60 bg-slate-50/50 dark:bg-black/10"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {(hasSubtasks || showAddForm) && (
        <div
          className={`flex items-baseline justify-between gap-2 ${
            compact ? "pl-1.5 mb-0.5" : spacious ? "mb-3" : "mb-1"
          }`}
        >
          <p
            className={`font-semibold tracking-wide ${
              compact
                ? "text-xs text-slate-500 dark:text-slate-400"
                : spacious
                  ? "text-sm text-slate-700 dark:text-slate-200"
                  : "text-xs text-slate-500 dark:text-slate-400"
            }`}
          >
            Subtasks
            {hasSubtasks && (
              <span className="font-medium text-slate-400 dark:text-slate-500">
                {" "}
                · {completedSubtasks}/{subtasks.length}
              </span>
            )}
          </p>
          {spacious && !hasSubtasks && showAddForm && (
            <p className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 shrink-0">
              Break it into steps
            </p>
          )}
        </div>
      )}

      {spacious && !hasSubtasks && showAddForm && (
        <p className="sm:hidden text-xs text-slate-400 dark:text-slate-500 mb-2.5">
          Break this into smaller steps
        </p>
      )}

      {hasSubtasks && (
        <ul
          className={
            spacious
              ? "space-y-1 mb-3 max-h-[min(40vh,18rem)] overflow-y-auto overscroll-contain rounded-xl border border-slate-100 dark:border-[#243350]/80 bg-slate-50/60 dark:bg-black/20 p-1.5"
              : ""
          }
        >
          {subtasks.map((sub) => {
            const isEditing = editingSubtaskId === sub.id;
            const isDragging = dragSubtaskId === sub.id;
            const isDropTarget = dragOverSubtaskId === sub.id && dragSubtaskId !== sub.id;
            return (
              <li
                key={sub.id}
                onDragOver={(e) => {
                  if (!canReorder || !dragSubtaskId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragOverSubtaskId !== sub.id) setDragOverSubtaskId(sub.id);
                }}
                onDrop={(e) => {
                  if (!canReorder || !dragSubtaskId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onReorderSubtasks!(dragSubtaskId, sub.id);
                  clearDrag();
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  clearDrag();
                }}
                className={`group/sub flex items-center gap-1.5 ${
                  compact
                    ? "py-0.5"
                    : spacious
                      ? "gap-2 py-2 px-2.5 rounded-lg hover:bg-white dark:hover:bg-white/[0.04]"
                      : "py-1 gap-2"
                } ${indent} ${borderColor} ${isDragging ? "opacity-50" : ""} ${
                  isDropTarget ? "border-t-2 border-t-blue-500" : ""
                }`}
              >
                {canReorder && (
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      if (editingSubtaskId) onCancelEditSubtask();
                      setDragSubtaskId(sub.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", sub.id);
                    }}
                    className={`flex-shrink-0 flex items-center cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 touch-none ${
                      spacious
                        ? "opacity-100 p-0.5"
                        : "opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 p-0.5"
                    }`}
                    aria-label={`Drag to reorder subtask "${sub.title}"`}
                    title="Drag to reorder"
                    role="button"
                    tabIndex={0}
                  >
                    <svg
                      className={compact ? "w-3 h-3" : "w-3.5 h-3.5"}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                    </svg>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onToggleSubtask(sub.id)}
                  className={`flex-shrink-0 rounded-full border-[1.5px] transition-colors flex items-center justify-center ${
                    compact ? "w-3.5 h-3.5" : spacious ? "w-5 h-5" : "w-4 h-4"
                  } ${
                    sub.completed
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-slate-300 dark:border-slate-600 hover:border-blue-500"
                  }`}
                  aria-label={`Toggle subtask "${sub.title}"`}
                >
                  {sub.completed && (
                    <svg
                      className={`${compact ? "w-1.5 h-1.5" : spacious ? "w-2.5 h-2.5" : "w-2 h-2"} text-white`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <input
                  ref={(el) => {
                    inputRefs.current[sub.id] = el;
                  }}
                  type="text"
                  value={isEditing ? editSubtaskTitle : sub.title}
                  onFocus={() => {
                    if (!isEditing) onStartEditSubtask(sub);
                  }}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!isEditing) {
                      // Seed edit mode with the typed value so the first keystroke isn't lost.
                      onStartEditSubtask(sub, next);
                    } else {
                      onEditSubtaskTitleChange(next);
                    }
                  }}
                  onBlur={() => {
                    if (editingSubtaskId === sub.id) onSaveSubtaskEdit(sub.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      // Cancel without blurring — blur would re-save the draft.
                      onCancelEditSubtask();
                    }
                  }}
                  aria-label={`Subtask title: ${sub.title}`}
                  className={`flex-1 min-w-0 font-medium outline-none transition-colors ${
                    compact
                      ? "text-xs px-1 py-0.5"
                      : spacious
                        ? "text-base sm:text-sm px-2 py-1.5"
                        : "text-sm px-2 py-1.5"
                  } ${
                    isEditing
                      ? "rounded-md border border-blue-400 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-400/40"
                      : `rounded-md border border-transparent bg-transparent cursor-text ${
                          sub.completed
                            ? "text-slate-400 dark:text-slate-500 line-through"
                            : "text-slate-700 dark:text-slate-200"
                        } hover:bg-slate-100/80 dark:hover:bg-white/[0.06]`
                  } ${spacious || isEditing ? "" : "truncate"}`}
                />

                {!isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => focusSubtask(sub)}
                      className={`flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                        spacious
                          ? "opacity-100"
                          : `${actionReveal} opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 sm:focus-within:opacity-100`
                      }`}
                      aria-label={`Edit subtask "${sub.title}"`}
                      title="Edit subtask"
                    >
                      <svg className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a1.5 1.5 0 00-2.121-2.121L7.172 17.586A1 1 0 006.879 18.293L4 20z" />
                      </svg>
                    </button>
                    <DueDateField
                      value={sub.dueDate}
                      onChange={(date) => onSetSubtaskDueDate(sub.id, date)}
                      requireExplicitPick={!sub.dueDate}
                      ariaLabel="Subtask due date"
                      className={`relative flex-shrink-0 p-1.5 transition-colors ${actionReveal} ${
                        sub.dueDate && !sub.completed && isDueDateOverdue(sub.dueDate)
                          ? "text-red-500 dark:text-red-400"
                          : sub.dueDate
                            ? "text-slate-500 dark:text-slate-400"
                            : "text-slate-400 hover:text-blue-500 dark:hover:text-blue-400"
                      } ${!compact && !spacious && !sub.dueDate ? "opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100" : ""}`}
                    >
                      <span title={sub.dueDate ? `Due: ${formatDueDate(sub.dueDate)}` : "Set due date"}>
                        {sub.dueDate ? (
                          <span className="text-xs font-medium">{formatDueDate(sub.dueDate)}</span>
                        ) : (
                          <svg
                            className={compact ? "w-3 h-3" : "w-3.5 h-3.5"}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </span>
                    </DueDateField>
                    <button
                      type="button"
                      onClick={() => onDeleteSubtask(sub.id)}
                      className={`flex-shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${actionReveal}`}
                      aria-label={`Delete subtask "${sub.title}"`}
                      title="Delete subtask"
                    >
                      <svg className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddSubtask();
          }}
          className={`flex items-stretch sm:items-center min-w-0 w-full ${
            spacious ? "gap-2 sm:gap-2.5" : `gap-2 pt-1 ${indent} ${borderColor}`
          }`}
        >
          {!spacious && (
            <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 self-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => onNewSubtaskTitleChange(e.target.value)}
            placeholder="Add a subtask…"
            enterKeyHint="done"
            className={`flex-1 min-w-0 dark:text-white outline-none ${
              spacious
                ? "px-3.5 py-3 text-base sm:text-sm border border-slate-200 dark:border-[#243350] rounded-xl bg-white dark:bg-[#0f172a] focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/40 shadow-sm"
                : "px-2 py-1 text-sm border border-slate-200 dark:border-[#243350] rounded-md bg-white dark:bg-[#131d30] focus:border-blue-400"
            }`}
          />
          <button
            type="submit"
            disabled={!newSubtaskTitle.trim()}
            className={`font-semibold border transition-colors shrink-0 self-stretch flex items-center disabled:opacity-40 disabled:cursor-not-allowed ${
              spacious
                ? "px-4 sm:px-5 text-sm rounded-xl border-blue-400/70 dark:border-blue-500/55 text-blue-700 dark:text-blue-300 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/35"
                : "px-2 py-1 text-xs rounded-md border-blue-400/70 dark:border-blue-500/55 text-blue-700 dark:text-blue-300 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/35"
            }`}
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
