"use client";

import { useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
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
 * Due date control: visible label opens the picker on click. The native input stays
 * screen-reader only so it cannot steal clicks from overlays (e.g. drawer close).
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

  const handleOpenPicker = (e: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    pickerOpenedRef.current = true;
    openDatePicker(inputRef.current);
  };

  return (
    <button
      type="button"
      onClick={handleOpenPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpenPicker(e);
      }}
      className={className || "relative inline-flex items-center"}
      aria-label={ariaLabel}
    >
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
        onBlur={() => {
          pickerOpenedRef.current = false;
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </button>
  );
}
