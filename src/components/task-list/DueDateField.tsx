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
  /**
   * Ignore only the synthetic "today" some browsers stamp in synchronously (or on
   * the next macrotask) when an empty picker opens — not real user picks of today.
   */
  const suppressAutoTodayRef = useRef(false);
  const valueAtOpenRef = useRef(value ?? "");

  const mustPickExplicitly = requireExplicitPick ?? !value;

  const handleOpenPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    valueAtOpenRef.current = value ?? "";
    pickerOpenedRef.current = true;
    // Catch sync / immediate auto-commits only. A longer window blocked intentional
    // "Today" taps (calendar default + Done) which often land within a few hundred ms.
    if (mustPickExplicitly && !value) {
      suppressAutoTodayRef.current = true;
      queueMicrotask(() => {
        setTimeout(() => {
          suppressAutoTodayRef.current = false;
        }, 0);
      });
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
            suppressAutoTodayRef.current
          ) {
            e.currentTarget.value = "";
            return;
          }

          pickerOpenedRef.current = false;
          suppressAutoTodayRef.current = false;
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
          suppressAutoTodayRef.current = false;
        }}
        className="absolute inset-0 z-10 w-full h-full cursor-pointer touch-manipulation opacity-0 text-base"
        aria-label={ariaLabel}
        tabIndex={-1}
      />
    </div>
  );
}
