"use client";

import type { MouseEvent } from "react";

interface TaskEditButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  isOpen?: boolean;
  taskTitle?: string;
  className?: string;
  /** Icon-only kebab (card view / dense rows). */
  compact?: boolean;
  /** Hide until row hover on fine-pointer desktops; always visible when open or on touch. */
  revealOnHover?: boolean;
}

const editBtnClass = (isOpen: boolean) =>
  isOpen
    ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700/50"
    : "text-slate-500 dark:text-slate-400 border-slate-200/90 dark:border-[#2a3f5f]/80 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/90 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-700/50";

const KebabIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
    />
  </svg>
);

/** Opens the task detail drawer/panel — labeled "Edit" for clarity (replaces chevron). */
export function TaskEditButton({
  onClick,
  isOpen,
  taskTitle,
  className = "",
  compact = false,
  revealOnHover = false,
}: TaskEditButtonProps) {
  const label = isOpen ? "Close" : "Edit";
  const named = taskTitle ? ` for "${taskTitle}"` : "";
  const revealClass = revealOnHover && !isOpen ? "hover-reveal-desktop" : "";

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 p-1 rounded-md border transition-colors ${editBtnClass(!!isOpen)} ${revealClass} ${className}`}
        aria-expanded={isOpen}
        aria-label={isOpen ? `Close task details${named}` : `Edit task${named}`}
        title={isOpen ? "Close details" : "Edit task"}
      >
        <KebabIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-1.5 py-0.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${editBtnClass(!!isOpen)} ${revealClass} ${className}`}
      aria-expanded={isOpen}
      aria-label={isOpen ? `Close task details${named}` : `Edit task${named}`}
      title={isOpen ? "Close details" : "Edit task"}
    >
      {label}
    </button>
  );
}
