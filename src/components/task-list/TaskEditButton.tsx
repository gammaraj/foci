"use client";

import type { MouseEvent } from "react";

interface TaskEditButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  isOpen?: boolean;
  taskTitle?: string;
  className?: string;
  /** Icon-first control for dense card/bucket rows. */
  compact?: boolean;
  /** Hide until row hover on fine-pointer desktops; always visible when open or on touch. */
  revealOnHover?: boolean;
}

const openBtnClass = (isOpen: boolean) =>
  isOpen
    ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/35 border-blue-300 dark:border-blue-600/60"
    : "text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-[#2a3f5f]/80 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/90 dark:hover:bg-blue-900/25 hover:border-blue-300 dark:hover:border-blue-600/50";

/** Side-panel glyph — reads as “open details”, not a menu. */
const DetailsIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 5a1 1 0 011-1h6v16H5a1 1 0 01-1-1V5zm8-1h7a1 1 0 011 1v14a1 1 0 01-1 1h-7V4z"
    />
  </svg>
);

/** Opens the task detail drawer/panel. */
export function TaskEditButton({
  onClick,
  isOpen,
  taskTitle,
  className = "",
  compact = false,
  revealOnHover = false,
}: TaskEditButtonProps) {
  const label = isOpen ? "Close" : "Details";
  const named = taskTitle ? ` for "${taskTitle}"` : "";
  const revealClass = revealOnHover && !isOpen ? "hover-reveal-desktop" : "";

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 inline-flex items-center justify-center p-1 rounded-md border transition-colors ${openBtnClass(!!isOpen)} ${revealClass} ${className}`}
        aria-expanded={isOpen}
        aria-label={isOpen ? `Close task details${named}` : `Open task details${named}`}
        title={isOpen ? "Close details" : "Open details"}
      >
        <DetailsIcon className="w-3.5 h-3.5 shrink-0" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${openBtnClass(!!isOpen)} ${revealClass} ${className}`}
      aria-expanded={isOpen}
      aria-label={isOpen ? `Close task details${named}` : `Open task details${named}`}
      title={isOpen ? "Close details" : "Open details"}
    >
      <DetailsIcon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </button>
  );
}
