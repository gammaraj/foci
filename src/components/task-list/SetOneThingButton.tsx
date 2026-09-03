"use client";

import React from "react";

function StarIcon({ className, outline }: { className?: string; outline?: boolean }) {
  if (outline) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    );
  }
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.25l2.472 6.342h6.668l-5.4 3.923 2.061 6.342L12 15.934l-5.801 3.923 2.061-6.342-5.4-3.923h6.668L12 2.25z" />
    </svg>
  );
}

interface SetOneThingButtonProps {
  taskTitle: string;
  isOneThing?: boolean;
  canSet?: boolean;
  onSet?: () => void;
  onClear?: () => void;
  /** Icon-only by default; show “One Thing” label from sm. */
  showLabel?: boolean;
  className?: string;
}

/** Compact row control to set or clear Today’s One Thing without opening task details. */
export function SetOneThingButton({
  taskTitle,
  isOneThing = false,
  canSet = false,
  onSet,
  onClear,
  showLabel = false,
  className = "",
}: SetOneThingButtonProps) {
  if (isOneThing && onClear) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className={`inline-flex items-center gap-1 shrink-0 p-1 rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors ${className}`.trim()}
        title="Clear as today’s One Thing"
        aria-label={`Clear "${taskTitle}" as One Thing`}
        aria-pressed
        data-tour="set-one-thing"
      >
        <StarIcon className="w-3.5 h-3.5 shrink-0" />
        {showLabel && <span className="hidden sm:inline text-xs font-semibold pr-0.5">One Thing</span>}
      </button>
    );
  }

  if (canSet && onSet) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSet();
        }}
        className={`inline-flex items-center gap-1 shrink-0 p-1 rounded-md text-slate-400 dark:text-slate-500 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 hover:border-blue-200/70 dark:hover:border-blue-800/40 transition-colors ${className}`.trim()}
        title="Set as today’s One Thing"
        aria-label={`Set "${taskTitle}" as One Thing`}
        data-tour="set-one-thing"
      >
        <StarIcon className="w-3.5 h-3.5 shrink-0" outline />
        {showLabel && <span className="hidden sm:inline text-xs font-semibold pr-0.5">One Thing</span>}
      </button>
    );
  }

  return null;
}
