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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
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
        className="fixed z-50 inset-x-0 bottom-0 w-full max-w-full min-w-0 box-border sm:inset-x-auto sm:left-auto sm:right-3 sm:top-3 sm:bottom-3 sm:w-[min(calc(100%-1.5rem),40rem)] flex flex-col max-h-[min(94dvh,100%)] sm:max-h-none rounded-t-2xl sm:rounded-2xl border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] shadow-2xl shadow-slate-900/15 overflow-hidden"
        style={{
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <header className="flex items-start gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-[#243350] shrink-0 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Task details
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 sm:line-clamp-3 break-words [overflow-wrap:anywhere]">
              {task.title}
            </h3>
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
