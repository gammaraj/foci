"use client";

import type { MouseEvent } from "react";

interface TaskEditButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  isOpen?: boolean;
  taskTitle?: string;
  className?: string;
}

/** Opens the task detail drawer/panel — labeled "Edit" for clarity (replaces chevron). */
export function TaskEditButton({ onClick, isOpen, taskTitle, className = "" }: TaskEditButtonProps) {
  const label = isOpen ? "Close" : "Edit";
  const named = taskTitle ? ` for "${taskTitle}"` : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-1.5 py-0.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${
        isOpen
          ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700/50"
          : "text-slate-500 dark:text-slate-400 border-slate-200/90 dark:border-[#2a3f5f]/80 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/90 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-700/50"
      } ${className}`}
      aria-expanded={isOpen}
      aria-label={isOpen ? `Close task details${named}` : `Edit task${named}`}
      title={isOpen ? "Close details" : "Edit task"}
    >
      {label}
    </button>
  );
}
