"use client";

import type { MouseEvent } from "react";

interface TaskEditButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  isOpen?: boolean;
  taskTitle?: string;
  className?: string;
  /** Icon-first control for dense card/bucket rows. */
  compact?: boolean;
}

const openBtnClass = (isOpen: boolean) =>
  isOpen
    ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/35 border-blue-300 dark:border-blue-600/60"
    : "text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-surface-border/80 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/90 dark:hover:bg-blue-900/25 hover:border-blue-300 dark:hover:border-blue-600/50";

/** Pencil — opens the task editor / detail panel. */
const PencilIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

/** Opens the task detail drawer/panel for editing. */
export function TaskEditButton({
  onClick,
  isOpen,
  taskTitle,
  className = "",
  compact = false,
}: TaskEditButtonProps) {
  const label = isOpen ? "Close" : "Edit";
  const named = taskTitle ? ` "${taskTitle}"` : "";

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 inline-flex items-center justify-center p-1 rounded-md border transition-colors ${openBtnClass(!!isOpen)} ${className}`}
        aria-expanded={isOpen}
        aria-label={isOpen ? `Close editing${named}` : `Edit task${named}`}
        title={isOpen ? "Close" : "Edit task"}
      >
        <PencilIcon className="w-3.5 h-3.5 shrink-0" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${openBtnClass(!!isOpen)} ${className}`}
      aria-expanded={isOpen}
      aria-label={isOpen ? `Close editing${named}` : `Edit task${named}`}
      title={isOpen ? "Close" : "Edit task"}
    >
      <PencilIcon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </button>
  );
}
