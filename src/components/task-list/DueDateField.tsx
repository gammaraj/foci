"use client";

import { useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { getToday } from "@/lib/dates";
import { openDatePicker } from "@/components/task-list/utils";

interface DueDateFieldProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /**
   * When true (default for empty values), ignore browser auto-commits — e.g. some
   * mobile browsers fire `change` with today as soon as the picker opens.
   */
  requireExplicitPick?: boolean;
}

function blurDateInput(input: HTMLInputElement | null) {
  input?.blur();
  if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === "date") {
    document.activeElement.blur();
  }
}

/**
 * Visible chip + explicit open button. The native date input keeps a real layout
 * box (needed for showPicker on mobile) but does not steal clicks — opacity-0
 * date inputs often focus without opening a calendar on desktop Chrome.
 */
export function DueDateField({
  value,
  onChange,
  children,
  className = "",
  ariaLabel = "Due date",
  requireExplicitPick,
}: DueDateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * Swallow only a synchronous auto-"today" stamp some browsers emit when an
   * empty picker opens. Cleared on the next microtask so real picks (including
   * Today) always commit.
   */
  const ignoreSyncTodayRef = useRef(false);

  const mustPickExplicitly = requireExplicitPick ?? !value;

  const handleOpenPicker = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mustPickExplicitly && !value) {
      ignoreSyncTodayRef.current = true;
      queueMicrotask(() => {
        ignoreSyncTodayRef.current = false;
      });
    }
    openDatePicker(inputRef.current);
  };

  return (
    <div className={`relative ${className}`.trim()}>
      {children}
      <button
        type="button"
        className="absolute inset-0 z-10 w-full h-full cursor-pointer touch-manipulation bg-transparent border-0 p-0"
        aria-label={ariaLabel}
        onClick={handleOpenPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpenPicker(e);
        }}
      />
      <input
        ref={inputRef}
        type="date"
        value={value ?? ""}
        onChange={(e) => {
          e.stopPropagation();
          const next = e.target.value;
          if (next === (value ?? "")) return;

          if (
            mustPickExplicitly &&
            !value &&
            next === getToday() &&
            ignoreSyncTodayRef.current
          ) {
            // Ignore synthetic open-time today; keep controlled value empty.
            ignoreSyncTodayRef.current = false;
            return;
          }

          ignoreSyncTodayRef.current = false;
          blurDateInput(inputRef.current);
          if (!next) {
            if (value) onChange(undefined);
            return;
          }
          onChange(next);
        }}
        // Real box for showPicker; no hit testing — the button above owns clicks.
        className="absolute inset-0 z-0 w-full h-full opacity-0 pointer-events-none text-base"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
