"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useTimer } from "@/hooks/useTimer";
import CircularTimer from "@/components/CircularTimer";
import TimerControls from "@/components/TimerControls";
import SatTutoringPromo from "@/components/SatTutoringPromo";
import TaskList from "@/components/TaskList";
import Navbar from "@/components/Navbar";
import NotificationBell from "@/components/NotificationBell";
import CollaborationInvitesButton from "@/components/CollaborationInvitesButton";
import AppMessageQueue from "@/components/AppMessageQueue";
import MobileTimerBar from "@/components/MobileTimerBar";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import SessionCelebration from "@/components/SessionCelebration";
import { useAuth } from "@/components/AuthProvider";
import { loadTasks } from "@/lib/storage";
import { getFocusModeAuto } from "@/lib/focus-mode";
import Link from "next/link";

const SettingsPanel = dynamic(() => import("@/components/SettingsPanel"), { ssr: false });
const AmbientSounds = dynamic(() => import("@/components/AmbientSounds"));
const OnboardingTour = dynamic(() => import("@/components/OnboardingTour"));
const DueDateReminders = dynamic(() => import("@/components/DueDateReminders"));
const WeatherTime = dynamic(() => import("@/components/WeatherTime"));

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

const WORK_DURATION_PRESETS = [15, 25, 30, 45] as const;

export default function AppPage() {
  const { user, loading } = useAuth();
  const timer = useTimer({ authLoading: loading, user });
  const [showSettings, setShowSettings] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);
  const [taskListKey, setTaskListKey] = useState(0);
  const [timerCollapsed, setTimerCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("foci-timer-collapsed");
      if (saved !== null) return saved === "true";
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null);
  const [tasksFullscreen, setTasksFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [timerAnnouncement, setTimerAnnouncement] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [soundsHintDismissed, setSoundsHintDismissed] = useState(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState("");
  const prevTimerStatusRef = useRef(timer.status);

  const announceTimer = useCallback((message: string) => {
    setTimerAnnouncement("");
    requestAnimationFrame(() => setTimerAnnouncement(message));
  }, []);

  const handleFocusProject = useCallback((projectId: string | null) => {
    setFocusProjectId(projectId);
    if (projectId) {
      setTimerCollapsed(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("foci-timer-collapsed", String(timerCollapsed));
  }, [timerCollapsed]);

  useEffect(() => {
    setSoundsHintDismissed(localStorage.getItem("foci_sounds_hint_dismissed") === "1");
  }, []);

  useEffect(() => {
    if (!activeTaskId) {
      setActiveTaskTitle("");
      return;
    }
    loadTasks().then((tasks) => {
      const t = tasks.find((x) => x.id === activeTaskId);
      setActiveTaskTitle(t?.title ?? "");
    });
  }, [activeTaskId]);

  const dismissSoundsHint = useCallback(() => {
    localStorage.setItem("foci_sounds_hint_dismissed", "1");
    setSoundsHintDismissed(true);
  }, []);

  const isRunning = timer.status === "running";
  const displayTime =
    timer.status === "idle"
      ? formatTime(timer.settings.workDuration)
      : formatTime(timer.remainingTime);

  // Keep ref in sync
  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  // Register session-complete callback to increment active task sessions + time
  useEffect(() => {
    timer.setOnSessionCompleteCallback(() => {
      const taskId = activeTaskIdRef.current;
      if (!taskId) return;
      const elapsed = timer.settings.workDuration; // full session completed
      window.dispatchEvent(new CustomEvent("tempo-session-complete", {
        detail: { taskId, elapsed },
      }));
    });
    return () => timer.setOnSessionCompleteCallback(null);
  }, [timer]);

  useEffect(() => {
    const prev = prevTimerStatusRef.current;
    const next = timer.status;
    if (prev === next) return;
    prevTimerStatusRef.current = next;

    // Announce automatic transitions (break start/end) not triggered by handleStartPause
    if (next === "break" && prev === "running") {
      announceTimer("Break time started");
      setShowCelebration(true);
      localStorage.setItem("foci_sessions_completed", "1");
    } else if (next === "idle" && prev === "break") {
      announceTimer("Break finished");
      setFocusMode(false);
    } else if (next === "idle" && prev === "running") {
      announceTimer("Focus session complete");
      setShowCelebration(true);
      setFocusMode(false);
      localStorage.setItem("foci_sessions_completed", "1");
    }
  }, [timer.status, announceTimer]);

  const handleStartPause = useCallback(() => {
    if (timer.status === "break") return;
    if (isRunning) {
      timer.pause();
      announceTimer("Focus timer paused");
    } else {
      if (getFocusModeAuto()) setFocusMode(true);
      timer.start();
      announceTimer("Focus timer started");
    }
  }, [timer, isRunning, announceTimer]);

  const handleReset = useCallback(() => {
    timer.reset();
    setFocusMode(false);
    announceTimer("Focus session reset");
  }, [timer, announceTimer]);

  const handleStartTask = useCallback((taskId: string) => {
    setActiveTaskId(taskId);
    if (timer.status !== "running" && timer.status !== "break") {
      if (getFocusModeAuto()) setFocusMode(true);
      timer.start();
    }
  }, [timer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "?" && !typing) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
      if (typing) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleStartPause();
      } else if (e.key === "r" || e.key === "R") {
        handleReset();
      } else if (e.key === "n" || e.key === "N") {
        document.getElementById("new-task-input")?.focus();
      } else if (e.key === "f" || e.key === "F") {
        setFocusMode((f) => !f);
      } else if (e.key === "Escape") {
        setShowShortcuts(false);
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleStartPause, handleReset]);

  /** Complete the active task: return elapsed time, pause the timer, deselect */
  const handleCompleteTask = useCallback((taskId: string): number => {
    const elapsed = timer.getElapsedWorkTime();
    if (timer.status === "running") {
      timer.pause();
    }
    setActiveTaskId(null);
    return elapsed;
  }, [timer]);

  const handleSelectWorkPreset = useCallback((minutes: number) => {
    const nextDuration = minutes * 60 * 1000;
    if (timer.settings.workDuration === nextDuration) return;
    timer.saveSettings({ ...timer.settings, workDuration: nextDuration });
  }, [timer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-[#243350] border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const goalMet = timer.dailyGoalData.sessionCount >= timer.settings.dailyGoal;
  const readyToFocus = !!activeTaskId && timer.status === "idle";
  const mobileDisplayTime =
    timer.status === "break" ? formatTime(timer.remainingTime) : displayTime;

  return (
    <div className="app-shell min-h-screen flex flex-col bg-[var(--page-bg)] dark:bg-[#0b1121]">
      <a href="#tasks-section" className="skip-link">Skip to tasks</a>
      <a href="#timer-panel" className="skip-link">Skip to timer</a>
      <Navbar
        onOpenSettings={() => setShowSettings(true)}
        toolbarSlot={
          user ? (
            <div className="flex items-center gap-0.5">
              <CollaborationInvitesButton />
              <NotificationBell />
            </div>
          ) : undefined
        }
      />
      <AppMessageQueue user={user} focusMode={focusMode} />
      {focusMode && (
        <div className="px-2 sm:px-4 pt-2">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm">
            <span className="text-blue-800 dark:text-blue-200 font-medium">🎯 Focus mode — fewer distractions</span>
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline touch-target-sm px-2"
            >
              Exit (F)
            </button>
          </div>
        </div>
      )}
      <DueDateReminders />
      {!focusMode && (
      <div className="px-2 sm:px-4 pt-2">
        <div className="max-w-[1280px] mx-auto rounded-xl app-surface dark:bg-[#111827]/85 dark:border-[#243350] px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Today <span className="text-blue-600 dark:text-blue-300">{timer.dailyGoalData.sessionCount}/{timer.settings.dailyGoal}</span> sessions
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
          <span className="truncate">
            {timer.dailyGoalData.streak > 0
              ? `🔥 ${timer.dailyGoalData.streak}-day streak`
              : "Start your streak today"}
          </span>
        </div>
      </div>
      )}
      <div className="flex items-start justify-center flex-1 px-2 pt-2 pb-20 lg:pb-3 sm:p-4 sm:pt-3">
      <div className={`w-full ${tasksFullscreen ? '' : 'max-w-[1280px]'} flex flex-col ${timerCollapsed || tasksFullscreen ? "" : "lg:flex-row"} gap-4 sm:gap-5`}>

        {/* Collapsed timer bar */}
        {timerCollapsed && !tasksFullscreen && (
          <div className="w-full">
            <div
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl app-surface dark:bg-[#111827] dark:border-[#1e3050]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`text-lg font-mono font-bold tabular-nums ${timer.isBreakMode ? "text-green-600 dark:text-green-400" : isRunning ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>
                  {timer.status === "break" ? formatTime(timer.remainingTime) : displayTime}
                </div>
                {timer.label && (
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-300 hidden sm:inline">
                    {timer.label}
                  </span>
                )}
                {activeTaskId && (
                  <ActiveTaskBanner
                    taskId={activeTaskId}
                    onClear={() => setActiveTaskId(null)}
                    isRunning={isRunning}
                    compact
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <TimerControls
                  isRunning={isRunning}
                  onStartPause={handleStartPause}
                  onReset={handleReset}
                  compact
                />
                <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <button
                  onClick={() => setTimerCollapsed(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
                  aria-label="Expand timer"
                  title="Show timer panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task list column */}
        <div id="tasks-section" className="w-full lg:flex-1 min-w-0">
          {!focusMode && <WeatherTime compact />}
          <TaskList
            key={taskListKey}
            activeTaskId={activeTaskId}
            onSelectTask={setActiveTaskId}
            onStartTask={handleStartTask}
            onCompleteTask={handleCompleteTask}
            isTimerRunning={isRunning}
            focusProjectId={focusProjectId}
            onFocusProject={handleFocusProject}
            isFullscreen={tasksFullscreen}
            onToggleFullscreen={() => setTasksFullscreen(f => !f)}
            focusMode={focusMode}
            onOpenSettings={() => setShowSettings(true)}
          />
          {!focusMode && !tasksFullscreen && (
            <div className="mt-4 px-1">
              <SatTutoringPromo variant="inline" />
            </div>
          )}
        </div>

        {/* Timer column — hidden (not unmounted) when collapsed/fullscreen to keep music playing */}
        <div id="timer-panel" className={`w-full lg:w-[400px] lg:flex-shrink-0 scroll-mt-24 ${timerCollapsed || tasksFullscreen ? "hidden" : ""}`}>
          <div className={`app-surface rounded-2xl dark:bg-[#111827] dark:border-[#1e3050] overflow-visible relative ${timer.isBreakMode ? "timer-break-mode" : ""} ${readyToFocus ? "ready-to-focus-ring" : ""} ${activeTaskId ? "timer-linked-from-task" : ""}`}>
            {/* Header */}
            <header
              className="section-header-gradient flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 text-slate-700 dark:text-white rounded-t-2xl"
            >
              <h1 className="text-lg sm:text-xl font-semibold tracking-wide">Focus Timer</h1>

              <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFocusMode((f) => !f)}
                className={`hidden sm:flex text-sm px-2.5 py-1 rounded-lg transition-colors ${focusMode ? "bg-blue-600 text-white" : "text-slate-500 dark:text-white/70 hover:bg-slate-200/60 dark:hover:bg-white/10"}`}
                title="Toggle focus mode (F)"
              >
                Focus
              </button>
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition px-2 py-1.5 rounded-lg border border-slate-200/80 dark:border-white/15 hover:bg-slate-200/60 dark:hover:bg-white/10 touch-target-sm"
                aria-label="Keyboard shortcuts"
                title="Shortcuts — link timer to tasks (press ?)"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
              <button
                onClick={() => setTimerCollapsed(true)}
                className="text-slate-400 dark:text-white/60 hover:text-slate-700 dark:hover:text-white transition p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10"
                aria-label="Collapse timer"
                title="Hide timer panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7m-8-14l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="lg:hidden text-sm text-slate-500 dark:text-white/85 hover:text-slate-700 dark:hover:text-white transition px-3 py-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10"
              >
                Tasks
              </button>
              </div>
            </header>

            {/* Active task indicator */}
            {activeTaskId && (
              <div className="px-4 pt-3 pb-0">
                <ActiveTaskBanner
                  taskId={activeTaskId}
                  onClear={() => setActiveTaskId(null)}
                  isRunning={isRunning}
                />
              </div>
            )}

            {/* Main content */}
            <div className="bg-slate-50/80 dark:bg-[#0d1526] px-4 py-2 border-t border-slate-100 dark:border-[#1e3050]/60">
              <div className="flex items-center justify-center gap-3 sm:gap-5 pb-3">
                <TimerControls
                  isRunning={isRunning}
                  onStartPause={handleStartPause}
                  onReset={handleReset}
                  showReset={false}
                />
                <CircularTimer
                  remainingTime={timer.remainingTime}
                  totalDuration={
                    timer.isBreakMode
                      ? timer.settings.breakDuration
                      : timer.settings.workDuration
                  }
                  label={timer.label}
                  statusText={timer.statusText}
                  displayTime={
                    timer.status === "break"
                      ? formatTime(timer.remainingTime)
                      : displayTime
                  }
                  isBreak={timer.isBreakMode}
                />
                <TimerControls
                  isRunning={isRunning}
                  onStartPause={handleStartPause}
                  onReset={handleReset}
                  showStartPause={false}
                />
              </div>

              <div className="pb-2">
                <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-[#131d30] rounded-lg p-1 border border-slate-200 dark:border-[#243350]">
                  {WORK_DURATION_PRESETS.map((minutes) => {
                    const active = timer.settings.workDuration === minutes * 60 * 1000;
                    return (
                      <button
                        key={minutes}
                        onClick={() => handleSelectWorkPreset(minutes)}
                        disabled={timer.status === "running" || timer.status === "break"}
                        className={`px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                          active
                            ? "bg-white dark:bg-[#1a2d4a] text-blue-700 dark:text-blue-300"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-[#1a2d4a]"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title={`Set work session to ${minutes} minutes`}
                      >
                        {minutes}m
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Idle / ready-to-focus — prominent below timer */}
              {timer.status === "idle" && !timer.isBreakMode && (
                <div
                  className={`mx-1 mb-2 px-3 py-3 rounded-xl border text-center ${
                    readyToFocus
                      ? "border-blue-400 dark:border-blue-500 bg-blue-100/90 dark:bg-blue-900/40 shadow-sm shadow-blue-500/10"
                      : "border-blue-200 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-900/25"
                  }`}
                >
                  <p className={`text-sm sm:text-base font-semibold ${readyToFocus ? "text-blue-900 dark:text-blue-100" : "text-blue-800 dark:text-blue-200"}`}>
                    {readyToFocus ? "Ready to focus" : "Pick a task to begin"}
                  </p>
                  <p className="text-sm text-blue-700/90 dark:text-blue-300/90 mt-1">
                    {readyToFocus
                      ? "Press Play, Space, or ▶ Start on your selected task"
                      : "Select a task in your list, then press Play or Space"}
                  </p>
                </div>
              )}
            </div>

            {!soundsHintDismissed && !focusMode && (
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-sm text-indigo-800 dark:text-indigo-200">
                  <button
                    type="button"
                    className="text-left flex-1 hover:underline"
                    onClick={() => document.getElementById("ambient-sounds")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    🎵 Try ambient sounds for deeper focus
                  </button>
                  <button type="button" onClick={dismissSoundsHint} className="text-indigo-500 hover:text-indigo-700 p-1" aria-label="Dismiss">
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Music & Sounds - moved up for better visibility */}
            <AmbientSounds />

            {timer.lastQuote && (
              <div className="px-4 pb-3 animate-slide-up">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#131d30] dark:to-[#1a2540] rounded-xl p-5 border border-blue-200/80 dark:border-[#243350] text-center shadow-sm">
                  <p className="text-base sm:text-lg italic text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    &ldquo;{timer.lastQuote}&rdquo;
                  </p>
                </div>
              </div>
            )}

            <div className="h-1" />
          </div>
        </div>

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {timerAnnouncement}
        </div>
      </div>
      </div>

      {showSettings && (
        <SettingsPanel
          settings={timer.settings}
          onSave={timer.saveSettings}
          onClose={() => setShowSettings(false)}
          onTasksImported={() => setTaskListKey((k) => k + 1)}
        />
      )}

      <MobileTimerBar
        displayTime={mobileDisplayTime}
        isRunning={isRunning}
        isBreak={timer.isBreakMode}
        status={timer.statusText}
        activeTaskTitle={activeTaskTitle}
        onStartPause={handleStartPause}
        onReset={handleReset}
        onExpandTimer={() => setTimerCollapsed(false)}
        onScrollToTasks={() => document.getElementById("tasks-section")?.scrollIntoView({ behavior: "smooth" })}
      />

      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <SessionCelebration
        show={showCelebration}
        goalMet={goalMet}
        streak={timer.dailyGoalData.streak}
        onDismiss={() => setShowCelebration(false)}
      />

      <OnboardingTour />
    </div>
  );
}

/** Small banner showing which task the timer is focused on */
function ActiveTaskBanner({
  taskId,
  onClear,
  isRunning,
  compact,
}: {
  taskId: string;
  onClear: () => void;
  isRunning: boolean;
  compact?: boolean;
}) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      loadTasks().then((tasks) => {
        if (cancelled) return;
        const t = tasks.find((task) => task.id === taskId);
        setTitle(t?.title ?? "");
      });
    };
    refresh();
    // Only refresh on task-updated if the title might have changed (rename/delete)
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Skip session-complete events — they don’t change the title
      if (detail?.taskId && detail?.elapsed) return;
      refresh();
    };
    window.addEventListener("tempo-tasks-updated", handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("tempo-tasks-updated", handleUpdate);
    };
  }, [taskId]);

  if (!title) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 ${isRunning ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
          {title}
        </span>
        {!isRunning && (
          <button onClick={onClear} className="text-slate-400 hover:text-slate-600 flex-shrink-0" aria-label="Clear active task">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/25 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2.5 border-l-[3px] border-l-blue-500 dark:border-l-blue-400 relative">
      <p className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white shadow-md" aria-hidden title="Linked from tasks">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 leading-none mb-1">
            Linked from tasks
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0 ${isRunning ? 'animate-pulse' : ''}`} />
            <span className="text-base font-semibold text-blue-700 dark:text-blue-100 truncate">
              {title}
            </span>
          </div>
        </div>
        {!isRunning && (
          <button
            onClick={onClear}
            className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0"
            aria-label="Clear active task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
