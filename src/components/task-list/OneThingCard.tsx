"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Task } from "@/lib/types";
import type { OneThingStatus } from "@/lib/one-thing";

export interface OneThingCardProps {
  status: OneThingStatus;
  task: Task | null;
  projectName?: string;
  hasOpenTasks: boolean;
  isTimerRunning: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onComplete: () => void;
  onChange: () => void;
  onClear: () => void;
  onDismissEmpty?: () => void;
  /**
   * `strip` — full-width row under When/Layout (default everywhere).
   * `inline` — same chrome, for embedding in a toolbar row (Cards desktop).
   */
  variant?: "strip" | "inline";
}

/** Active / done — soft plate, left accent, no heavy outline box. */
const plate =
  "no-print flex items-center gap-2 min-h-[2.25rem] min-w-0 rounded-2xl px-2.5 py-1.5 border-0 ring-1";
const stripPlate = `${plate} panel-inset-x mt-1 mb-0.5`;
const inlinePlate = `${plate} max-w-full`;

const activePlate =
  "ring-blue-500/20 dark:ring-blue-400/25 bg-blue-500/[0.07] dark:bg-blue-500/10 border-l-[3px] border-l-blue-500 dark:border-l-blue-400";
const donePlate =
  "ring-emerald-500/20 dark:ring-emerald-400/25 bg-emerald-500/[0.07] dark:bg-emerald-500/10 border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.25l2.472 6.342h6.668l-5.4 3.923 2.061 6.342L12 15.934l-5.801 3.923 2.061-6.342-5.4-3.923h6.668L12 2.25z" />
    </svg>
  );
}

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`${className ?? ""} transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function OneThingHowTo() {
  return (
    <div className="rounded-2xl ring-1 ring-blue-500/15 dark:ring-blue-400/25 bg-white/95 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 shadow-lg shadow-blue-900/5 dark:shadow-black/40 p-3.5 text-xs leading-relaxed text-center">
      <p className="font-semibold text-blue-900 dark:text-blue-100">How to pick your One Thing</p>
      <ol className="mt-1.5 mx-auto w-fit list-decimal list-inside space-y-1 text-left text-slate-600 dark:text-slate-300">
        <li>Open any open task (click its name).</li>
        <li>
          Tap <span className="font-semibold text-blue-700 dark:text-blue-300">Set as Today&apos;s One Thing</span>.
        </li>
      </ol>
      <p className="mt-2.5 text-slate-600 dark:text-slate-300">
        It&apos;s the one outcome that would make today a success. It stays pinned here until you finish or clear it, then
        resets tomorrow.
      </p>
    </div>
  );
}

export function OneThingCard({
  status,
  task,
  projectName,
  hasOpenTasks,
  isTimerRunning,
  isFocused,
  onFocus,
  onComplete,
  onChange,
  onClear,
  onDismissEmpty,
  variant = "strip",
}: OneThingCardProps) {
  const plateShell = variant === "inline" ? inlinePlate : stripPlate;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const closeDetails = useCallback(() => setDetailsOpen(false), []);

  useEffect(() => {
    if (!detailsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetails();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) closeDetails();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [detailsOpen, closeDetails]);

  if (status === "unset") {
    const prompt = hasOpenTasks
      ? "Open a task → Set as One Thing"
      : "Add a task, then set it as your One Thing";

    return (
      <div ref={rootRef} data-tour="one-thing" className="relative min-w-0 land-compact:hidden">
        {/* Borderless intent row — reads as guidance, not another chrome box */}
        <div
          className={`relative flex items-center justify-center min-h-[2.25rem] ${
            variant === "inline" ? "" : "panel-inset-x mt-0.5 mb-0.5"
          }`}
        >
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 max-w-full min-w-0 rounded-full px-3 py-1.5 text-left outline-none transition-colors hover:bg-blue-500/[0.08] dark:hover:bg-blue-400/10 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#0f172a] ${
              onDismissEmpty ? "pr-8" : ""
            }`}
            title="How to set Today’s One Thing"
          >
            <StarIcon className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="shrink-0 text-xs font-bold uppercase tracking-[0.06em] text-blue-700 dark:text-blue-300">
              One Thing
            </span>
            <span className="hidden sm:inline text-blue-400/70 dark:text-blue-500/70" aria-hidden>
              ·
            </span>
            <span className="min-w-0 truncate text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              {prompt}
            </span>
            <ChevronIcon
              open={detailsOpen}
              className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500"
            />
            <span className="sr-only">{detailsOpen ? "Hide details" : "Show how to pick"}</span>
          </button>
          {onDismissEmpty && (
            <button
              type="button"
              onClick={onDismissEmpty}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/10 dark:hover:bg-white/10"
              aria-label="Dismiss One Thing prompt"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {detailsOpen && (
          <div
            id={detailsId}
            role="region"
            aria-label="Today’s One Thing details"
            className={
              variant === "inline"
                ? "absolute left-0 right-0 top-full z-40 mt-1.5"
                : "panel-inset-x mt-1 mb-1"
            }
          >
            <OneThingHowTo />
          </div>
        )}
      </div>
    );
  }

  if (status === "done" && task) {
    return (
      <div data-tour="one-thing" className={`${plateShell} ${donePlate}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="inline-flex items-center shrink-0 text-xs font-bold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-300">
            Done
          </span>
          <p
            className="min-w-0 truncate text-sm font-medium text-slate-600 dark:text-emerald-50/90 line-through decoration-slate-400/70 dark:decoration-emerald-600/50"
            title={task.title}
          >
            {task.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-xs font-semibold text-slate-500 dark:text-emerald-200/90 hover:text-slate-800 dark:hover:text-emerald-50 hover:underline px-1.5 py-0.5"
        >
          Clear
        </button>
      </div>
    );
  }

  if (status === "active" && task) {
    return (
      <div data-tour="one-thing" className={`${plateShell} ${activePlate}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="inline-flex items-center gap-1 shrink-0 text-xs font-bold uppercase tracking-[0.06em] text-blue-700 dark:text-blue-300"
            title={projectName ? `Today's One Thing · ${projectName}` : "Today's One Thing"}
          >
            <StarIcon className="w-3 h-3" />
            One Thing
          </span>
          <p
            className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white"
            title={projectName ? `${task.title} · ${projectName}` : task.title}
          >
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onFocus}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
              isFocused
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "text-blue-700 dark:text-blue-200 hover:bg-blue-500/10 dark:hover:bg-blue-400/15"
            }`}
            title={isFocused ? "Already focused" : isTimerRunning ? "Switch focus to One Thing" : "Focus and start timer"}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            {isFocused ? "On" : "Focus"}
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 transition-colors"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onChange}
            className="hidden sm:inline-flex items-center px-1.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-500/10 dark:hover:bg-white/10"
            aria-label="Clear One Thing"
            title="Clear"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
