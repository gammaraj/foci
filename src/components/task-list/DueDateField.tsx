"use client";

import { useRef, type ReactNode } from "react";
import { getToday } from "@/lib/dates";

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
 * Invisible date input over a visible label. The input stays a real hit target so
 * mobile browsers can open the native picker; programmatic showPicker on a
 * clipped/sr-only input often no-ops on Safari/Chrome mobile.
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
   * Today) always commit. Do not gate on blur/opened flags — native pickers
   * often fire blur before change, which rejected every empty-field pick.
   */
  const ignoreSyncTodayRef = useRef(false);

  const mustPickExplicitly = requireExplicitPick ?? !value;

  return (
    <div className={`relative ${className}`.trim()}>
      {children}
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
        onClick={(e) => {
          e.stopPropagation();
          if (mustPickExplicitly && !value) {
            ignoreSyncTodayRef.current = true;
            queueMicrotask(() => {
              ignoreSyncTodayRef.current = false;
            });
          }
        }}
        className="absolute inset-0 z-10 w-full h-full cursor-pointer touch-manipulation opacity-0 text-base"
        aria-label={ariaLabel}
        tabIndex={-1}
      />
    </div>
  );
}
