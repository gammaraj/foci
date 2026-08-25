"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { getToday } from "@/lib/dates";
import { openDatePicker } from "@/components/task-list/utils";
import { DueDatePickerSheet } from "@/components/task-list/DueDatePickerSheet";

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

/** Mobile / touch UIs often stamp today asynchronously after showPicker — far past a microtask. */
const MOBILE_AUTO_TODAY_IGNORE_MS = 700;

function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(pointer: coarse)").matches) return true;
  } catch {
    /* ignore */
  }
  return navigator.maxTouchPoints > 0;
}

function isIOSFamily(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Native date inputs drop "today" on Save when the field was empty — use our sheet instead. */
function shouldUseSheetPicker(): boolean {
  if (typeof window === "undefined") return false;
  if (isIOSFamily()) return true;
  try {
    if (window.matchMedia("(pointer: coarse)").matches) return true;
  } catch {
    /* ignore */
  }
  return false;
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
  const [sheetOpen, setSheetOpen] = useState(false);
  /**
   * Swallow auto-"today" stamps some browsers emit when an empty picker opens.
   * Desktop: microtask window. Mobile: longer window — stamps often arrive
   * hundreds of ms after showPicker. Cleared by timer only (not on first swallow)
   * so delayed duplicate stamps stay blocked. Intentional Today after the window
   * still commits.
   */
  const ignoreAutoTodayRef = useRef(false);
  const ignoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mustPickExplicitly = requireExplicitPick ?? !value;

  useEffect(() => {
    return () => {
      if (ignoreTimerRef.current) clearTimeout(ignoreTimerRef.current);
    };
  }, []);

  const armIgnoreAutoToday = () => {
    ignoreAutoTodayRef.current = true;
    if (ignoreTimerRef.current) clearTimeout(ignoreTimerRef.current);
    ignoreTimerRef.current = null;

    if (isCoarsePointer()) {
      ignoreTimerRef.current = setTimeout(() => {
        ignoreAutoTodayRef.current = false;
        ignoreTimerRef.current = null;
      }, MOBILE_AUTO_TODAY_IGNORE_MS);
    } else {
      queueMicrotask(() => {
        ignoreAutoTodayRef.current = false;
      });
    }
  };

  const handleDateEvent = (e: ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const next = e.target.value;
    if (next === (value ?? "")) return;

    if (mustPickExplicitly && !value && next === getToday() && ignoreAutoTodayRef.current) {
      // Ignore synthetic open-time today; keep controlled value empty.
      // Do not remount — that would dismiss the still-open native picker.
      e.target.value = "";
      return;
    }

    ignoreAutoTodayRef.current = false;
    if (ignoreTimerRef.current) {
      clearTimeout(ignoreTimerRef.current);
      ignoreTimerRef.current = null;
    }
    blurDateInput(inputRef.current);
    if (!next) {
      if (value) onChange(undefined);
      return;
    }
    onChange(next);
  };

  const handleOpenPicker = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (shouldUseSheetPicker()) {
      setSheetOpen(true);
      return;
    }
    if (mustPickExplicitly && !value) {
      armIgnoreAutoToday();
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
        onChange={handleDateEvent}
        // Real box for showPicker; no hit testing — the button above owns clicks.
        className="absolute inset-0 z-0 w-full h-full opacity-0 pointer-events-none text-base"
        tabIndex={-1}
        aria-hidden
      />
      {sheetOpen && (
        <DueDatePickerSheet
          value={value}
          title={ariaLabel}
          onSave={(date) => {
            setSheetOpen(false);
            if (date !== (value ?? "")) onChange(date);
          }}
          onClear={() => {
            setSheetOpen(false);
            if (value) onChange(undefined);
          }}
          onCancel={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
