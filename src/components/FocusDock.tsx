"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import CircularTimer from "@/components/CircularTimer";
import TimerControls from "@/components/TimerControls";
import { miniDockGhostButtonClass } from "@/components/FocusStripControls";

const WORK_DURATION_PRESETS = [15, 25, 30, 45] as const;

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
> & {
  embedded?: boolean;
  sessions?: { count: number; goal: number; streak: number };
  onShowShortcuts?: () => void;
  remainingTime?: number;
  workDurationMs?: number;
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
      ? "rounded-lg px-1.5 border border-green-300/50 dark:border-green-700/40 bg-green-50/70 dark:bg-green-900/20"
      : isRunning
        ? "rounded-lg px-1.5 border border-blue-300/60 dark:border-blue-600/45 bg-blue-50/70 dark:bg-blue-900/20"
        : "rounded-lg px-1";

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

  const timerLabelButton = (
    <button
      type="button"
      onClick={onToggleExpanded}
      className={`flex items-center gap-1.5 shrink-0 text-left rounded-lg px-1 -mx-1 transition-colors hover:bg-slate-100/80 dark:hover:bg-white/5 ${embedded ? "" : "flex-1 sm:flex-initial min-w-0"}`}
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
      {embedded && workDurationMs ? (
        /* Mini progress arc replaces "Timer/Break" label when in strip */
        <span className="relative shrink-0 w-[1.125rem] h-[1.125rem]" aria-hidden>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 20 20" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="10" cy="10" r={arcR} fill="none" strokeWidth="2.5" className="stroke-slate-200 dark:stroke-slate-600" />
            <circle
              cx="10" cy="10" r={arcR} fill="none"
              stroke={isBreak ? "var(--success-green)" : isRunning ? "var(--primary-blue)" : "#94a3b8"}
              strokeWidth="2.5"
              strokeDasharray={arcCircumference}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
        </span>
      ) : (
        <span
          className={`app-section-label shrink-0 ${
            isBreak
              ? "text-green-600 dark:text-green-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {isBreak ? "Break" : "Timer"}
        </span>
      )}
      <span
        className={`${embedded ? "text-sm sm:text-base" : "text-sm sm:text-base"} font-semibold tabular-nums leading-none shrink-0 ${
          isBreak
            ? "text-green-700 dark:text-green-300"
            : isRunning
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-800 dark:text-slate-100"
        }`}
      >
        {displayTime}
      </span>
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
    </button>
  );

  const timerControls = (
    <TimerControls
      isRunning={isRunning}
      onStartPause={onStartPause}
      onReset={onReset}
      compact
      dock={embedded}
      emphasizeStart={emphasizeStart}
    />
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
          ? `${miniDockGhostButtonClass(false)} hidden sm:flex`
          : "touch-target-sm p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
      }`}
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse focus timer" : "Expand focus timer"}
      title={expanded ? "Collapse timer" : "Expand timer"}
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
    return (
      <div
        className={`group flex items-center gap-1 min-w-0 shrink-0 transition-colors ${embeddedChrome}`}
      >
        {timerLabelButton}
        <div className="flex items-center gap-0.5 shrink-0">
          {timerControls}
          {expandChevron}
        </div>
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
      <div className="flex-1 sm:flex-initial min-w-0">{timerLabelButton}</div>
      {timerControls}
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
  lastQuote,
  emphasizeStart,
  compactStrip = false,
}: FocusDockProps) {
  if (!expanded) {
    return null;
  }

  if (compactStrip) {
    return (
      <div
        className={`absolute left-1/2 top-[calc(100%+0.25rem)] z-50 w-[20rem] max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white dark:bg-[#131d30] p-2.5 sm:p-3 shadow-lg shadow-slate-900/10 ${
          isBreak ? "timer-break-mode" : ""
        } ${activeTaskId ? "timer-linked-from-task" : ""}`}
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
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#131d30] rounded-lg border border-slate-200 dark:border-[#243350]">
          {WORK_DURATION_PRESETS.map((minutes) => {
            const active = workDurationMs === minutes * 60 * 1000;
            return (
              <button
                key={minutes}
                type="button"
                onClick={() => onSelectWorkPreset(minutes)}
                disabled={timerStatus === "running" || timerStatus === "break"}
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
        </div>
        <div className="flex items-center justify-center gap-1 pt-2 border-t border-slate-100/90 dark:border-[#243350]/80 mt-2">
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              focusMode
                ? "bg-blue-600 text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
            }`}
            title="Zen mode — hide distractions (F)"
          >
            Zen
          </button>
          <button
            type="button"
            onClick={onShowShortcuts}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
            title="Shortcuts (?)"
          >
            Shortcuts
          </button>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
          >
            Close
          </button>
        </div>
        {lastQuote && (timerStatus === "break" || timerStatus === "idle") && (
          <p className="text-xs italic text-slate-500 dark:text-slate-400 text-center leading-snug pt-2 line-clamp-2">
            &ldquo;{lastQuote}&rdquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div
        className={`app-surface rounded-xl dark:bg-[#111827] dark:border-[#1e3050] overflow-hidden mt-2 ${
          isBreak ? "timer-break-mode" : ""
        } ${readyToFocus ? "ready-to-focus-ring" : ""} ${activeTaskId ? "timer-linked-from-task" : ""}`}
      >
        <header className="panel-header-calm px-3 sm:px-4 py-2 flex items-center justify-between gap-2 rounded-t-xl">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-white">Focus Timer</h2>
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
              onClick={onToggleFocusMode}
              className={`p-2 rounded-lg transition-colors ${focusMode ? "bg-blue-600 text-white" : "text-slate-500 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/10"}`}
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

          <div className="pb-2">
            <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-[#131d30] rounded-lg p-1 border border-slate-200 dark:border-[#243350]">
              {WORK_DURATION_PRESETS.map((minutes) => {
                const active = workDurationMs === minutes * 60 * 1000;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => onSelectWorkPreset(minutes)}
                    disabled={timerStatus === "running" || timerStatus === "break"}
                    className={`px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                      active
                        ? "bg-white dark:bg-[#1a2d4a] text-blue-700 dark:text-blue-300"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {minutes}m
                  </button>
                );
              })}
            </div>
          </div>

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
