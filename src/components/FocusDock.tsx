"use client";

import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import CircularTimer from "@/components/CircularTimer";
import TimerControls from "@/components/TimerControls";
import TimerAlarmPicker from "@/components/TimerAlarmPicker";
import {
  FOCUS_STRIP_CHIP_FRAME,
  FOCUS_STRIP_ROW,
  FocusStripChipChevron,
  miniDockGhostButtonClass,
  MiniSettingsIcon,
} from "@/components/FocusStripControls";
import {
  formatTimerDisplay,
  formatWorkDurationAria,
  MAX_WORK_SECONDS,
  MIN_WORK_SECONDS,
  parseDurationInput,
  WORK_MINUTE_STEP,
  WORK_SECOND_STEP,
} from "@/lib/timer-utils";

const WORK_DURATION_PRESETS = [15, 25, 30, 45] as const;

function openTimerSettings() {
  window.dispatchEvent(new CustomEvent("foci-open-settings", { detail: { tab: "timer" } }));
}

function visibleAnchor(selector: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(selector);
  for (const el of nodes) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return nodes[0] ?? null;
}

/** Portaled so the header's overflow-x-auto cannot clip the expanded timer. */
function CompactTimerPopover({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const hostRef = React.useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 8, width: 320 });

  const updatePos = useCallback(() => {
    const host = hostRef.current;
    const fromVisibleCopy = !!host && host.getClientRects().length > 0;
    setActive(fromVisibleCopy);
    if (!fromVisibleCopy) return;
    const anchor = visibleAnchor("[data-foci-timer-strip]");
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    let left = rect.left + rect.width / 2 - width / 2;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    setPos({ top: rect.bottom + 4, left, width });
  }, []);

  useLayoutEffect(() => {
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [updatePos]);

  return (
    <>
      <span ref={hostRef} aria-hidden className="pointer-events-none absolute w-0 h-0" />
      {active
        ? createPortal(
            <div
              role="dialog"
              aria-label="Focus timer"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              className={`fixed z-[80] rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] p-2.5 sm:p-3 shadow-lg shadow-slate-900/10 ${className}`}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function WorkDurationControl({
  totalSeconds,
  displayTime,
  disabled,
  onNudge,
  onSetSeconds,
  timeClassName,
  trailing,
}: {
  totalSeconds: number;
  displayTime: string;
  disabled: boolean;
  onNudge: (delta: number) => void;
  onSetSeconds: (seconds: number) => void;
  timeClassName: string;
  trailing?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayTime);
  const secondSteps = totalSeconds <= 60;
  const stepLabel = secondSteps
    ? `${WORK_SECOND_STEP} seconds`
    : `${WORK_MINUTE_STEP} minutes`;

  useEffect(() => {
    if (!editing) setDraft(displayTime);
  }, [displayTime, editing]);

  const commit = () => {
    const next = parseDurationInput(draft);
    if (next == null) {
      setDraft(displayTime);
      setEditing(false);
      return;
    }
    onSetSeconds(next);
    setDraft(formatTimerDisplay(next * 1000));
    setEditing(false);
  };

  const nudgeBtn =
    "w-6 h-6 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-40";

  return (
    <span className={`${FOCUS_STRIP_CHIP_FRAME} shrink-0 px-0.5 gap-0`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNudge(-WORK_MINUTE_STEP);
        }}
        disabled={disabled || totalSeconds <= MIN_WORK_SECONDS}
        className={nudgeBtn}
        aria-label={`Decrease duration by ${stepLabel}`}
        title={`−${secondSteps ? `${WORK_SECOND_STEP}s` : `${WORK_MINUTE_STEP} min`}`}
      >
        <span className="text-base leading-none font-semibold" aria-hidden>
          −
        </span>
      </button>
      {editing ? (
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          autoFocus
          aria-label="Work duration. Type minutes, or 0:30 for 30 seconds"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft(displayTime);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-16 h-7 border-0 bg-transparent text-sm font-semibold tabular-nums text-center text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-400 rounded-sm"
        />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          disabled={disabled}
          className={`${timeClassName} min-w-[2.75rem] px-0.5 hover:bg-slate-100/80 dark:hover:bg-white/5 rounded-sm`}
          aria-label={`Work duration ${formatWorkDurationAria(totalSeconds)}. Click to type a new length.`}
          title="Click to type minutes, or 0:30 for seconds"
        >
          {displayTime}
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNudge(WORK_MINUTE_STEP);
        }}
        disabled={disabled || totalSeconds >= MAX_WORK_SECONDS}
        className={nudgeBtn}
        aria-label={`Increase duration by ${stepLabel}`}
        title={`+${secondSteps ? `${WORK_SECOND_STEP}s` : `${WORK_MINUTE_STEP} min`}`}
      >
        <span className="text-base leading-none font-semibold" aria-hidden>
          +
        </span>
      </button>
      {trailing}
    </span>
  );
}

function DurationAndAlarmBlock({
  workDurationMs,
  timerStatus,
  onSelectWorkPreset,
  onSetWorkSeconds,
  afterFinish,
}: {
  workDurationMs: number;
  timerStatus: string;
  onSelectWorkPreset: (minutes: number) => void;
  onSetWorkSeconds: (seconds: number) => void;
  afterFinish: boolean;
}) {
  const durationLocked = timerStatus === "running" || timerStatus === "break";
  const [draft, setDraft] = useState(formatTimerDisplay(workDurationMs));
  const inputId = React.useId();

  useEffect(() => {
    setDraft(formatTimerDisplay(workDurationMs));
  }, [workDurationMs]);

  const commitDraft = () => {
    const next = parseDurationInput(draft);
    if (next == null) {
      setDraft(formatTimerDisplay(workDurationMs));
      return;
    }
    onSetWorkSeconds(next);
    setDraft(formatTimerDisplay(next * 1000));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#131d30] rounded-lg border border-slate-200 dark:border-[#243350]">
        {WORK_DURATION_PRESETS.map((minutes) => {
          const active = workDurationMs === minutes * 60 * 1000;
          return (
            <button
              key={minutes}
              type="button"
              onClick={() => onSelectWorkPreset(minutes)}
              disabled={durationLocked}
              className={`flex-1 px-2 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                active
                  ? "bg-white dark:bg-[#1a2d4a] text-blue-700 dark:text-blue-300"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {minutes}m
            </button>
          );
        })}
        <label className="sr-only" htmlFor={inputId}>
          Custom duration (minutes or 0:30 for seconds)
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={draft}
          disabled={durationLocked}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          aria-label="Custom work duration. Type minutes, or 0:30 for 30 seconds"
          title="Minutes, or 0:30 / 30s for seconds"
          className="w-16 shrink-0 px-1 py-1 rounded-md text-xs sm:text-sm font-semibold tabular-nums text-center bg-white dark:bg-[#1a2d4a] border border-transparent text-slate-700 dark:text-slate-200 disabled:opacity-40"
        />
      </div>
      <TimerAlarmPicker compact afterFinish={afterFinish} />
    </div>
  );
}

export interface FocusDockProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  displayTime: string;
  isRunning: boolean;
  isBreak: boolean;
  readyToFocus: boolean;
  activeTaskId: string | null;
  activeTaskTitle: string;
  onClearTask: () => void;
  onStartPause: () => void;
  onReset: () => void;
  onToggleFocusMode: () => void;
  onShowShortcuts: () => void;
  focusMode: boolean;
  remainingTime: number;
  workDuration: number;
  breakDuration: number;
  label: string;
  statusText: string;
  timerStatus: string;
  workDurationMs: number;
  onSelectWorkPreset: (minutes: number) => void;
  onSetWorkSeconds: (seconds: number) => void;
  onNudgeWorkMinutes: (deltaMinutes: number) => void;
  lastQuote?: string | null;
  emphasizeStart: boolean;
  /** Compact inline expand inside the focus strip column (no full card chrome). */
  compactStrip?: boolean;
}

export function FocusDockToolbar({
  expanded,
  onToggleExpanded,
  displayTime,
  isRunning,
  isBreak,
  activeTaskTitle,
  onStartPause,
  onReset,
  emphasizeStart,
  embedded = false,
  sessions,
  onShowShortcuts,
  remainingTime,
  workDurationMs,
  showReset = true,
  timerStatus,
  onSelectWorkPreset,
  onSetWorkSeconds,
  onNudgeWorkMinutes,
}: Pick<
  FocusDockProps,
  | "expanded"
  | "onToggleExpanded"
  | "displayTime"
  | "isRunning"
  | "isBreak"
  | "activeTaskTitle"
  | "onStartPause"
  | "onReset"
  | "emphasizeStart"
  | "timerStatus"
  | "onSelectWorkPreset"
  | "onSetWorkSeconds"
  | "onNudgeWorkMinutes"
> & {
  embedded?: boolean;
  sessions?: { count: number; goal: number; streak: number };
  onShowShortcuts?: () => void;
  remainingTime?: number;
  workDurationMs?: number;
  showReset?: boolean;
}) {
  const [showShortcutHint, setShowShortcutHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowShortcutHint(localStorage.getItem("foci-shortcuts-hint-seen") !== "1");
  }, []);

  const dismissShortcutHint = () => {
    localStorage.setItem("foci-shortcuts-hint-seen", "1");
    setShowShortcutHint(false);
  };

  const sessionProgress =
    sessions && sessions.goal > 0
      ? Math.min(100, Math.round((sessions.count / sessions.goal) * 100))
      : 0;

  const timerProgress =
    workDurationMs && workDurationMs > 0 && remainingTime !== undefined
      ? Math.max(0, Math.min(1, (workDurationMs - remainingTime) / workDurationMs))
      : 0;
  const arcR = 8;
  const arcCircumference = 2 * Math.PI * arcR;
  const arcOffset = arcCircumference * (1 - timerProgress);

  const embeddedChrome =
    isBreak
      ? "rounded-md px-1 text-emerald-800 dark:text-emerald-200"
      : isRunning
        ? "rounded-md px-1 text-blue-800 dark:text-blue-200"
        : "rounded-md px-0.5";

  const sessionsLink = sessions ? (
    <Link
      href="/stats"
      className={
        embedded
          ? "shrink-0 group/sess min-w-0"
          : "flex flex-col items-center gap-0.5 shrink-0 group min-w-0 px-0.5"
      }
      title={`${sessions.count} of ${sessions.goal} focus sessions today — view stats`}
      aria-label={`${sessions.count} of ${sessions.goal} focus sessions today`}
    >
      {embedded ? (
        <span className="flex items-center gap-1.5 leading-none whitespace-nowrap min-w-0">
          {sessions.goal <= 8 ? (
            /* Pip dots for visual session progress */
            <span className="flex items-center gap-[3px]" aria-hidden>
              {Array.from({ length: sessions.goal }, (_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    i < sessions.count
                      ? "bg-blue-500 dark:bg-blue-400"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              ))}
            </span>
          ) : (
            <span className="text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400 group-hover/sess:underline">
              {sessions.count}/{sessions.goal}
            </span>
          )}
          {sessions.streak > 0 && (
            <span
              className="text-xs font-medium text-orange-600 dark:text-orange-400 shrink-0"
              title={`${sessions.streak}-day streak`}
            >
              🔥
            </span>
          )}
        </span>
      ) : (
        <>
          <span className="flex items-center gap-1 tabular-nums text-xs sm:text-sm font-semibold leading-none whitespace-nowrap">
            <span className="text-blue-600 dark:text-blue-400 group-hover:underline">
              {sessions.count}/{sessions.goal}
            </span>
            {sessions.streak > 0 && (
              <span
                className="hidden sm:inline text-orange-600 dark:text-orange-400 text-xs font-medium"
                title={`${sessions.streak}-day streak`}
              >
                🔥 {sessions.streak}d
              </span>
            )}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-none">
            focus sessions
          </span>
          <span
            className="hidden sm:block w-full min-w-[2.25rem] h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
            aria-hidden
          >
            <span
              className="block h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${sessionProgress}%` }}
            />
          </span>
        </>
      )}
    </Link>
  ) : null;

  const workSeconds = Math.max(0, Math.round((workDurationMs ?? 0) / 1000));
  const canAdjustDuration =
    timerStatus === "idle" && !isBreak && !!onNudgeWorkMinutes && !!onSetWorkSeconds && workSeconds >= MIN_WORK_SECONDS;

  const timeClassName = `${embedded ? "text-xs" : "text-sm sm:text-base"} font-semibold tabular-nums leading-none shrink-0 ${
    isBreak
      ? "text-green-700 dark:text-green-300"
      : isRunning
        ? "text-blue-600 dark:text-blue-400"
        : "text-slate-800 dark:text-slate-100"
  }`;

  const chipExpand = (
    <button
      type="button"
      onClick={onToggleExpanded}
      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse focus timer" : "Expand focus timer"}
      title={
        expanded
          ? "Collapse timer"
          : showShortcutHint
            ? "Expand timer — press ? for shortcuts"
            : "Expand timer"
      }
    >
      <FocusStripChipChevron open={expanded} />
    </button>
  );

  const timerLabelCluster = (
    <div className={`flex items-center gap-1.5 shrink-0 min-w-0 ${embedded ? "" : "flex-1 sm:flex-initial"}`}>
      {embedded && workDurationMs ? (
        <span className="relative shrink-0 w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 20 20" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="10" cy="10" r={arcR} fill="none" strokeWidth="2" className="stroke-slate-300 dark:stroke-slate-500" />
            <circle
              cx="10" cy="10" r={arcR} fill="none"
              stroke={isBreak ? "var(--success-green)" : isRunning ? "var(--primary-blue)" : "currentColor"}
              strokeWidth="2"
              strokeDasharray={arcCircumference}
              strokeDashoffset={isRunning || isBreak ? arcOffset : 0}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
        </span>
      ) : null}
      <span
        className={`app-section-label ${
          isBreak ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {isBreak ? "Break" : "Timer"}
      </span>
      {canAdjustDuration ? (
        <WorkDurationControl
          totalSeconds={workSeconds}
          displayTime={displayTime}
          disabled={false}
          onNudge={onNudgeWorkMinutes}
          onSetSeconds={onSetWorkSeconds}
          timeClassName={timeClassName}
          trailing={embedded ? chipExpand : undefined}
        />
      ) : (
        <span className={`${FOCUS_STRIP_CHIP_FRAME} ${embedded ? "pl-2 pr-0.5" : "px-2"}`}>
          <span className={timeClassName}>{displayTime}</span>
          {embedded ? chipExpand : null}
        </span>
      )}
      {activeTaskTitle ? (
        <span className="min-w-0 hidden lg:inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300 truncate max-w-[7rem] xl:max-w-[12rem]">
          <span className="shrink-0 text-blue-500 dark:text-blue-400" aria-hidden>
            ↳
          </span>
          <span className="truncate">{activeTaskTitle}</span>
        </span>
      ) : !isRunning && !embedded ? (
        <span className="hidden sm:inline text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
          Select a task ↓
        </span>
      ) : null}
    </div>
  );

  const timerControls = (
    <TimerControls
      isRunning={isRunning}
      onStartPause={onStartPause}
      onReset={onReset}
      compact
      dock={embedded}
      emphasizeStart={emphasizeStart}
      showReset={showReset}
    />
  );

  const settingsButton = (
    <button
      type="button"
      onClick={openTimerSettings}
      className={embedded ? miniDockGhostButtonClass(false) : "touch-target-sm p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"}
      aria-label="Timer settings"
      title="Timer settings"
    >
      <MiniSettingsIcon size={embedded ? "sm" : "md"} />
    </button>
  );

  const shortcutsButton =
    embedded && onShowShortcuts ? (
      <button
        type="button"
        onClick={() => {
          dismissShortcutHint();
          onShowShortcuts();
        }}
        className={miniDockGhostButtonClass(showShortcutHint)}
        aria-label="Keyboard shortcuts"
        title={showShortcutHint ? "Keyboard shortcuts (press ?)" : "Keyboard shortcuts (?)"}
      >
        <span className="text-sm font-semibold leading-none">?</span>
        {showShortcutHint && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-blue-500/30" aria-hidden />
        )}
      </button>
    ) : null;

  const expandChevron = (
    <button
      type="button"
      onClick={onToggleExpanded}
      className={`flex-shrink-0 ${
        embedded
          ? miniDockGhostButtonClass(false)
          : "touch-target-sm p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
      }`}
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse focus timer" : "Expand focus timer"}
      title={
        expanded
          ? "Collapse timer"
          : showShortcutHint
            ? "Expand timer — press ? for shortcuts"
            : "Expand timer"
      }
    >
      <svg
        className={`${embedded ? "w-4 h-4" : "w-3.5 h-3.5"} transition-transform ${expanded ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  if (embedded) {
    const timerRing = workDurationMs ? (
      <span className="relative w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 20 20" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="10" cy="10" r={arcR} fill="none" strokeWidth="2" className="stroke-slate-300 dark:stroke-slate-500" />
          <circle
            cx="10" cy="10" r={arcR} fill="none"
            stroke={isBreak ? "var(--success-green)" : isRunning ? "var(--primary-blue)" : "currentColor"}
            strokeWidth="2"
            strokeDasharray={arcCircumference}
            strokeDashoffset={isRunning || isBreak ? arcOffset : 0}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
          />
        </svg>
      </span>
    ) : (
      <span className="w-4 h-4" aria-hidden />
    );

    const timerMain = canAdjustDuration ? (
      <WorkDurationControl
        totalSeconds={workSeconds}
        displayTime={displayTime}
        disabled={false}
        onNudge={onNudgeWorkMinutes}
        onSetSeconds={onSetWorkSeconds}
        timeClassName={timeClassName}
        trailing={chipExpand}
      />
    ) : (
      <span className={`${FOCUS_STRIP_CHIP_FRAME} pl-2 pr-0.5`}>
        <span className={timeClassName}>{displayTime}</span>
        {chipExpand}
      </span>
    );

    return (
      <div
        className={`${FOCUS_STRIP_ROW} transition-colors ${embeddedChrome}`}
        data-foci-timer-strip
      >
        <div className="flex items-center justify-center w-7 h-7 shrink-0">{timerRing}</div>
        <span
          className={`app-section-label shrink-0 leading-none ${
            isBreak ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {isBreak ? "Break" : "Timer"}
        </span>
        <div className="min-w-0 w-full flex justify-center">{timerMain}</div>
        <div className="flex items-center justify-center w-7 h-7 shrink-0">{timerControls}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 min-w-0 w-full flex-wrap gap-y-1 sm:w-auto px-2 sm:px-2.5 py-1.5 rounded-xl border shadow-sm transition-colors ${
        isBreak
          ? "border-green-300/60 dark:border-green-700/50 bg-green-50/80 dark:bg-green-900/25"
          : isRunning
            ? "border-blue-300/60 dark:border-blue-600/50 bg-blue-50/80 dark:bg-blue-900/25"
            : "border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/90"
      }`}
    >
      {sessionsLink}
      {sessions && (
        <span className="hidden sm:inline text-slate-300 dark:text-slate-600 shrink-0" aria-hidden>
          ·
        </span>
      )}
      <div className="flex-1 sm:flex-initial min-w-0">{timerLabelCluster}</div>
      {timerControls}
      {settingsButton}
      {expandChevron}
    </div>
  );
}

export default function FocusDockPanel({
  expanded,
  onToggleExpanded,
  displayTime,
  isRunning,
  isBreak,
  readyToFocus,
  activeTaskId,
  activeTaskTitle,
  onStartPause,
  onReset,
  onToggleFocusMode,
  onShowShortcuts,
  focusMode,
  remainingTime,
  workDuration,
  breakDuration,
  label,
  statusText,
  timerStatus,
  workDurationMs,
  onSelectWorkPreset,
  onSetWorkSeconds,
  lastQuote,
  emphasizeStart,
  compactStrip = false,
}: FocusDockProps) {
  if (!expanded) {
    return null;
  }

  if (compactStrip) {
    return (
      <CompactTimerPopover
        className={`${isBreak ? "timer-break-mode" : ""} ${activeTaskId ? "timer-linked-from-task" : ""}`}
      >
        {activeTaskId && activeTaskTitle ? (
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate mb-2">{activeTaskTitle}</p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Select a task below to link your session</p>
        )}
        <div className="text-center space-y-0.5 pb-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p
            className={`text-xl sm:text-3xl font-bold tabular-nums leading-none ${
              isBreak
                ? "text-green-700 dark:text-green-300"
                : isRunning
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-900 dark:text-white"
            }`}
          >
            {displayTime}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{statusText}</p>
        </div>
        <div className="flex items-center justify-center gap-2 pb-3">
          <TimerControls
            isRunning={isRunning}
            onStartPause={onStartPause}
            onReset={onReset}
            compact
            dock
            emphasizeStart={emphasizeStart}
            showReset={timerStatus !== "idle"}
          />
        </div>
        <DurationAndAlarmBlock
          workDurationMs={workDurationMs}
          timerStatus={timerStatus}
          onSelectWorkPreset={onSelectWorkPreset}
          onSetWorkSeconds={onSetWorkSeconds}
          afterFinish={timerStatus === "break"}
        />
        <div className="flex items-center justify-center gap-1 pt-2 border-t border-slate-100/90 dark:border-[#243350]/80 mt-2">
          <button
            type="button"
            onClick={openTimerSettings}
            className="btn-ghost px-2.5 py-1.5 text-xs"
            aria-label="Timer settings"
            title="Timer settings"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              focusMode
                ? "bg-blue-700 text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
            }`}
            title="Zen mode — hide distractions (F)"
          >
            Zen
          </button>
          <button
            type="button"
            onClick={onShowShortcuts}
            className="btn-ghost px-2.5 py-1.5 text-xs"
            title="Shortcuts (?)"
          >
            Shortcuts
          </button>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="btn-ghost px-2.5 py-1.5 text-xs"
          >
            Close
          </button>
        </div>
        {lastQuote && (timerStatus === "break" || timerStatus === "idle") && (
          <p className="text-xs italic text-slate-500 dark:text-slate-400 text-center leading-snug pt-2 line-clamp-2">
            &ldquo;{lastQuote}&rdquo;
          </p>
        )}
      </CompactTimerPopover>
    );
  }

  return (
    <div className="pb-2">
      <div
        className={`app-surface rounded-xl overflow-hidden mt-2 ${
          isBreak ? "timer-break-mode" : ""
        } ${readyToFocus ? "ready-to-focus-ring" : ""} ${activeTaskId ? "timer-linked-from-task" : ""}`}
      >
        <header className="panel-header-calm px-3 sm:px-4 py-2 flex items-center justify-between gap-2 rounded-t-xl">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-white">Focus timer</h2>
            {!activeTaskId && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Pick a task below</p>
            )}
            {activeTaskId && activeTaskTitle && (
              <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{activeTaskTitle}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={openTimerSettings}
              className="p-2 rounded-lg text-slate-500 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/10"
              aria-label="Timer settings"
              title="Timer settings"
            >
              <MiniSettingsIcon size="md" />
            </button>
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`p-2 rounded-lg transition-colors ${focusMode ? "bg-blue-700 text-white" : "text-slate-500 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/10"}`}
              aria-label="Toggle Zen mode (F)"
              title="Zen mode — hide distractions (F)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onShowShortcuts}
              className="p-2 rounded-lg text-slate-500 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/10"
              aria-label="Keyboard shortcuts"
              title="Shortcuts (?)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="p-2 rounded-lg text-slate-500 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/10"
              aria-label="Collapse timer"
              title="Collapse"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </header>

        <div className="bg-white dark:bg-[#0d1526] px-4 py-3 border-t border-slate-100 dark:border-[#1e3050]/60">
          <div className="flex items-center justify-center gap-3 sm:gap-5 pb-3">
            <TimerControls
              isRunning={isRunning}
              onStartPause={onStartPause}
              onReset={onReset}
              showReset={false}
              emphasizeStart={emphasizeStart}
            />
            <CircularTimer
              remainingTime={remainingTime}
              totalDuration={isBreak ? breakDuration : workDuration}
              label={label}
              statusText={statusText}
              displayTime={displayTime}
              isBreak={isBreak}
            />
            <TimerControls
              isRunning={isRunning}
              onStartPause={onStartPause}
              onReset={onReset}
              showStartPause={false}
              emphasizeStart={emphasizeStart}
            />
          </div>

          <DurationAndAlarmBlock
            workDurationMs={workDurationMs}
            timerStatus={timerStatus}
            onSelectWorkPreset={onSelectWorkPreset}
            onSetWorkSeconds={onSetWorkSeconds}
            afterFinish={timerStatus === "break"}
          />

          {readyToFocus && timerStatus === "idle" && !isBreak && (
            <p className="text-center text-xs text-blue-700/90 dark:text-blue-300/90 mb-2">
              Press Play or Space to start
            </p>
          )}
        </div>

        {lastQuote && (timerStatus === "break" || timerStatus === "idle") && (
          <div className="px-4 pb-3">
            <p className="text-sm italic text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              &ldquo;{lastQuote}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
