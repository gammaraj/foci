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
  const pickerOpenedRef = useRef(false);
  /** Ignore auto-today commits for a brief window after opening an empty picker. */
  const suppressTodayUntilRef = useRef(0);
  const valueAtOpenRef = useRef(value ?? "");

  const mustPickExplicitly = requireExplicitPick ?? !value;

  const handleOpenPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    valueAtOpenRef.current = value ?? "";
    pickerOpenedRef.current = true;
    // Some browsers emit today immediately (sync or right after open) for empty inputs.
    if (mustPickExplicitly && !value) {
      suppressTodayUntilRef.current = Date.now() + 300;
    }
    // Do not call showPicker()/click() here — this handler runs on a real user click
    // of the date input, which already opens the native picker. Re-clicking can
    // double-fire and auto-commit today on some browsers.
  };

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

          if (mustPickExplicitly && !pickerOpenedRef.current) {
            e.currentTarget.value = value ?? "";
            return;
          }

          if (
            mustPickExplicitly &&
            !valueAtOpenRef.current &&
            next === getToday() &&
            Date.now() < suppressTodayUntilRef.current
          ) {
            e.currentTarget.value = "";
            return;
          }

          pickerOpenedRef.current = false;
          suppressTodayUntilRef.current = 0;
          blurDateInput(inputRef.current);
          if (!next) {
            if (value) onChange(undefined);
            return;
          }
          onChange(next);
        }}
        onClick={handleOpenPicker}
        onBlur={() => {
          pickerOpenedRef.current = false;
          suppressTodayUntilRef.current = 0;
        }}
        className="absolute inset-0 z-10 w-full h-full cursor-pointer touch-manipulation opacity-0 text-base"
        aria-label={ariaLabel}
        tabIndex={-1}
      />
    </div>
  );
}
