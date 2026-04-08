"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";
import CircularTimer from "@/components/CircularTimer";
import TimerControls from "@/components/TimerControls";
import DailyProgress from "@/components/DailyProgress";
import SettingsPanel from "@/components/SettingsPanel";
import TaskList from "@/components/TaskList";
import Navbar from "@/components/Navbar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AmbientSounds from "@/components/AmbientSounds";
import OnboardingTour from "@/components/OnboardingTour";
import NotificationPrompt from "@/components/NotificationPrompt";
import DueDateReminders from "@/components/DueDateReminders";
import NotificationBell from "@/components/NotificationBell";
import WeatherTime from "@/components/WeatherTime";
import { useAuth } from "@/components/AuthProvider";
import { loadTasks } from "@/lib/storage";
import Link from "next/link";

function SignUpBanner() {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("foci_signup_dismissed")) {
      setDismissed(true);
    }
  }, []);
  if (dismissed) return null;
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm">
      <div className="max-w-[1280px] mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <p className="flex-1 min-w-0">
          <span className="font-medium">Sign up free</span>
          <span className="hidden sm:inline"> — sync your tasks across devices, never lose your progress</span>
          <span className="sm:hidden"> to sync across devices</span>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/login"
            className="px-3 py-1 bg-white text-blue-700 font-semibold rounded-lg text-xs hover:bg-blue-50 transition-colors"
          >
            Sign up
          </Link>
          <button
            onClick={() => { setDismissed(true); sessionStorage.setItem("foci_signup_dismissed", "1"); }}
            className="p-1 text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function AppPage() {
  const { user, loading } = useAuth();
  const timer = useTimer({ authLoading: loading, user });
  const [showSettings, setShowSettings] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);
  const [taskListKey, setTaskListKey] = useState(0);
  const [timerCollapsed, setTimerCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("foci-timer-collapsed") === "true";
    }
    return false;
  });
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null);
  const [tasksFullscreen, setTasksFullscreen] = useState(false);

  const handleFocusProject = useCallback((projectId: string | null) => {
    setFocusProjectId(projectId);
    if (projectId) {
      setTimerCollapsed(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("foci-timer-collapsed", String(timerCollapsed));
  }, [timerCollapsed]);

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

  const handleStartPause = () => {
    if (timer.status === "break") return;
    if (isRunning) {
      timer.pause();
    } else {
      timer.start();
    }
  };

  const handleStartTask = useCallback((taskId: string) => {
    setActiveTaskId(taskId);
    if (timer.status !== "running" && timer.status !== "break") {
      timer.start();
    }
  }, [timer]);

  /** Complete the active task: return elapsed time, pause the timer, deselect */
  const handleCompleteTask = useCallback((taskId: string): number => {
    const elapsed = timer.getElapsedWorkTime();
    if (timer.status === "running") {
      timer.pause();
    }
    setActiveTaskId(null);
    return elapsed;
  }, [timer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-[#243350] border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1121]">
      <Navbar />
      {!user && !loading && <SignUpBanner />}
      <DueDateReminders />
      <div className="flex items-start justify-center flex-1 px-2 pt-2 pb-3 sm:p-4 sm:pt-3">
      <div className={`w-full ${tasksFullscreen ? '' : 'max-w-[1280px]'} flex flex-col ${timerCollapsed || tasksFullscreen ? "" : "lg:flex-row"} gap-4 sm:gap-5`}>

        {/* Collapsed timer bar */}
        {timerCollapsed && !tasksFullscreen && (
          <div className="w-full">
            <div
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1e3050] bg-white/80 dark:bg-[#111827] backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`text-lg font-mono font-bold tabular-nums ${timer.isBreakMode ? "text-green-600 dark:text-green-400" : isRunning ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}>
                  {timer.status === "break" ? formatTime(timer.remainingTime) : displayTime}
                </div>
                {timer.label && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-400 hidden sm:inline">
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
                  onReset={timer.reset}
                  compact
                />
                <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <NotificationBell />
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors"
                  aria-label="Open settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
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
          <WeatherTime />
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
          />
        </div>

        {/* Timer column — hidden (not unmounted) when collapsed/fullscreen to keep music playing */}
        <div className={`w-full lg:w-[400px] lg:flex-shrink-0 ${timerCollapsed || tasksFullscreen ? "hidden" : ""}`}>
          <div className="bg-white/80 dark:bg-[#111827] backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-[#1e3050] overflow-visible relative">
            {/* Header */}
            <header
              className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 text-white rounded-t-2xl"
              style={{
                background: "linear-gradient(135deg, #0f1b33 0%, #1a2d4a 100%)",
              }}
            >
              <h1 className="text-base font-semibold tracking-wide">Focus Timer</h1>

              <div className="flex items-center gap-1">
              <button
                onClick={() => setTimerCollapsed(true)}
                className="text-white/60 hover:text-white transition p-2 rounded-lg hover:bg-white/10"
                aria-label="Collapse timer"
                title="Hide timer panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7m-8-14l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="lg:hidden text-sm text-white/85 hover:text-white transition px-3 py-2 rounded-lg hover:bg-white/10"
              >
                Tasks
              </button>
              <NotificationBell />
              <button
                onClick={() => setShowSettings(true)}
                className="text-white hover:text-slate-200 transition p-2 rounded-full hover:bg-white/10"
                aria-label="Open settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
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
            <div className="bg-white/60 dark:bg-[#111827] backdrop-blur-sm px-4 py-0 sm:py-2">
              <div className="relative pb-6 sm:pb-0">
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

                {/* On mobile: overlay controls at bottom edge of timer, spread apart */}
                <div className="sm:hidden absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-[85%] flex justify-between">
                  <TimerControls
                    isRunning={isRunning}
                    onStartPause={handleStartPause}
                    onReset={timer.reset}
                    spread
                  />
                </div>
              </div>

              {/* On desktop: controls below timer */}
              <div className="hidden sm:block">
                <TimerControls
                  isRunning={isRunning}
                  onStartPause={handleStartPause}
                  onReset={timer.reset}
                />
              </div>
              {/* No-task nudge: only shown on desktop when idle and no task selected */}
              {!activeTaskId && timer.status === "idle" && (
                <p className="hidden sm:block text-center text-xs text-slate-400 dark:text-slate-400 pb-2 -mt-1">
                  Pick a task on the left to focus your session
                </p>
              )}
            </div>

            {timer.lastQuote && (
              <div className="px-4 pb-3 animate-slide-up">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#131d30] dark:to-[#1a2540] rounded-xl p-5 border border-blue-200/80 dark:border-[#243350] text-center shadow-sm">
                  <p className="text-base sm:text-lg italic text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    &ldquo;{timer.lastQuote}&rdquo;
                  </p>
                </div>
              </div>
            )}

            <DailyProgress
              dailyGoalData={timer.dailyGoalData}
              dailyGoal={timer.settings.dailyGoal}
            />

            <AmbientSounds />

            <div className="h-2" />
          </div>
        </div>

        <div className="sr-only" aria-live="polite" aria-atomic="true" />
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

      <PWAInstallPrompt />
      <NotificationPrompt />
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
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
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
    <div className="bg-blue-50 dark:bg-blue-900/25 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2.5 border-l-[3px] border-l-blue-500 dark:border-l-blue-400">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 leading-none mb-1">
            Focusing on
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0 ${isRunning ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-100 truncate">
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
