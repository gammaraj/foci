"use client";

import { useEffect } from "react";
import type { Task } from "@/lib/types";
import { handleOverlayDismiss } from "@/components/task-list/dismiss-overlays";

export function TaskExpansionDrawer({
  task,
  onClose,
  children,
}: {
  task: Task | null;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, onClose]);

  if (!task) return null;

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
        className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-4 sm:right-4 sm:left-auto sm:w-[min(100%,22rem)] flex flex-col max-h-[min(88vh,36rem)] sm:max-h-[calc(100vh-6rem)] rounded-t-2xl sm:rounded-2xl border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] shadow-2xl shadow-slate-900/15 overflow-hidden"
      >
        <header className="flex items-start gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-[#243350] shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
              Task details
            </p>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
              {task.title}
            </h3>
          </div>
          <button
            type="button"
            onMouseDown={(e) => handleOverlayDismiss(e, onClose)}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Close task details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </aside>
    </>
  );
}
