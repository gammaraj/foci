"use client";

import { useEffect, useRef } from "react";
import type { Task } from "@/lib/types";
import { MAX_TASK_TITLE } from "@/components/task-list/utils";
import { handleOverlayDismiss } from "@/components/task-list/dismiss-overlays";

export function TaskExpansionDrawer({
  task,
  onClose,
  children,
  isEditingTitle = false,
  editTitle = "",
  onStartEditTitle,
  onEditTitleChange,
  onSaveTitle,
  onCancelEditTitle,
}: {
  task: Task | null;
  onClose: () => void;
  children: React.ReactNode;
  isEditingTitle?: boolean;
  editTitle?: string;
  onStartEditTitle?: (task: Task, titleOverride?: string) => void;
  onEditTitleChange?: (title: string) => void;
  onSaveTitle?: (taskId: string) => void;
  onCancelEditTitle?: () => void;
}) {
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const canEditTitle = Boolean(onStartEditTitle && onEditTitleChange && onSaveTitle && onCancelEditTitle);

  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditingTitle) return;
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [task, onClose, isEditingTitle]);

  if (!task) return null;

  const focusTitle = () => {
    if (!canEditTitle) return;
    onStartEditTitle!(task);
    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/25 dark:bg-black/50 backdrop-blur-[1px] cursor-default"
        onMouseDown={(e) => handleOverlayDismiss(e, onClose)}
        aria-label="Close task details"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Task details: ${task.title}`}
        className="fixed z-50 inset-x-0 bottom-0 w-full max-w-full min-w-0 box-border sm:inset-x-auto sm:left-auto sm:right-3 sm:top-3 sm:bottom-3 sm:w-[min(calc(100%-1.5rem),40rem)] flex flex-col max-h-[min(94dvh,100%)] sm:max-h-none rounded-t-2xl sm:rounded-2xl border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] shadow-2xl shadow-slate-900/15 overflow-hidden"
        style={{
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <header className="flex items-start gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-[#243350] shrink-0 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Task details
            </p>
            {canEditTitle ? (
              <div className="group/title flex items-start gap-1.5 min-w-0">
                <textarea
                  ref={titleInputRef}
                  // Always bind the draft once editing starts so the first keystroke
                  // can't race with startEditing resetting to task.title.
                  value={isEditingTitle ? editTitle : task.title}
                  rows={2}
                  onFocus={() => {
                    if (!isEditingTitle) onStartEditTitle!(task);
                  }}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[\r\n]+/g, " ");
                    if (!isEditingTitle) {
                      // Seed edit mode with the typed value so the first keystroke isn't lost.
                      onStartEditTitle!(task, next);
                    } else {
                      onEditTitleChange!(next);
                    }
                  }}
                  onBlur={() => {
                    if (isEditingTitle) onSaveTitle!(task.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLTextAreaElement).blur();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      e.stopPropagation();
                      // Cancel without blurring — blur would re-save the draft.
                      onCancelEditTitle!();
                    }
                  }}
                  maxLength={MAX_TASK_TITLE}
                  aria-label="Task title"
                  className={`flex-1 min-w-0 text-lg sm:text-xl font-semibold leading-snug outline-none transition-colors break-words [overflow-wrap:anywhere] resize-none overflow-hidden ${
                    isEditingTitle
                      ? "rounded-md border border-blue-400 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white px-2 py-1 focus-visible:ring-2 focus-visible:ring-blue-400/40"
                      : "rounded-md border border-transparent bg-transparent text-slate-900 dark:text-white cursor-text px-2 py-1 -mx-2 hover:bg-slate-100/80 dark:hover:bg-white/[0.06]"
                  }`}
                />
                {!isEditingTitle && (
                  <button
                    type="button"
                    onClick={focusTitle}
                    className="shrink-0 p-1.5 mt-0.5 rounded-md text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors opacity-100 sm:opacity-0 sm:group-hover/title:opacity-100 sm:focus-within:opacity-100"
                    aria-label={`Edit task title "${task.title}"`}
                    title="Edit title"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a1.5 1.5 0 00-2.121-2.121L7.172 17.586A1 1 0 006.879 18.293L4 20z" />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]">
                {task.title}
              </h3>
            )}
          </div>
          <button
            type="button"
            onMouseDown={(e) => handleOverlayDismiss(e, onClose)}
            className="shrink-0 p-2 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors touch-target-sm"
            aria-label="Close task details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain min-h-0 min-w-0">
          {children}
        </div>
      </aside>
    </>
  );
}
