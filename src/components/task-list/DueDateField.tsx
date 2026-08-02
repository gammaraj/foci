"use client";

import { useRef, type ReactNode } from "react";
import { openDatePicker } from "@/components/task-list/utils";

interface DueDateFieldProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** When the task has no due date yet, ignore stray change events until the user opens the picker. */
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
  requireExplicitPick = false,
}: DueDateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerOpenedRef = useRef(false);

  const handleOpenPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    pickerOpenedRef.current = true;
    openDatePicker(e.currentTarget);
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
          if (requireExplicitPick && !pickerOpenedRef.current) return;
          pickerOpenedRef.current = false;
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
        }}
        className="absolute inset-0 z-10 w-full h-full cursor-pointer touch-manipulation opacity-0 text-base"
        aria-label={ariaLabel}
        tabIndex={-1}
      />
    </div>
  );
}
