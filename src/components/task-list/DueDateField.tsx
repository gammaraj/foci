"use client";

import { useRef, type ReactNode } from "react";
import { openDatePicker } from "@/components/task-list/utils";

interface DueDateFieldProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  children: ReactNode;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  /** When the task has no due date yet, ignore stray change events until the user opens the picker. */
  requireExplicitPick?: boolean;
}

/**
 * Invisible date input over a visible label. Opens the picker on click (not focus)
 * so empty inputs do not auto-commit today's date.
 */
export function DueDateField({
  value,
  onChange,
  children,
  className = "",
  inputClassName = "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
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
    <div className={className || "relative"}>
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
        className={inputClassName}
        aria-label={ariaLabel}
        tabIndex={-1}
      />
    </div>
  );
}
