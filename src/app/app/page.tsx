"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useTimer } from "@/hooks/useTimer";
import TaskList from "@/components/TaskList";
import Navbar from "@/components/Navbar";
import DailyQuoteBanner from "@/components/DailyQuoteBanner";
import FocusDockPanel, { FocusDockToolbar } from "@/components/FocusDock";
import AmbientSounds from "@/components/AmbientSounds";
import NotificationBell from "@/components/NotificationBell";
import CollaborationInvitesButton from "@/components/CollaborationInvitesButton";
import AppMessageQueue from "@/components/AppMessageQueue";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import SessionCelebration from "@/components/SessionCelebration";
import { useAuth } from "@/components/AuthProvider";
import { loadTasks } from "@/lib/storage";
import { getFocusModeAuto, getStartTimerOnFocus } from "@/lib/focus-mode";
const SettingsPanel = dynamic(() => import("@/components/SettingsPanel"), { ssr: false });
const OnboardingTour = dynamic(() => import("@/components/OnboardingTour"));
const WhatsNewBanner = dynamic(() => import("@/components/WhatsNewBanner"));
const FeatureTour = dynamic(() => import("@/components/FeatureTour"));
const DueDateReminders = dynamic(() => import("@/components/DueDateReminders"));
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
  /** false = expanded timer dock below status bar; true = compact in status row only */
  const [timerCollapsed, setTimerCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("foci-timer-dock-expanded");
      if (saved === "1") return false;
      return true;
    }
    return true;
  });
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null);
  const [tasksFullscreen, setTasksFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [timerAnnouncement, setTimerAnnouncement] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
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
    localStorage.setItem("foci-timer-dock-expanded", timerCollapsed ? "0" : "1");
  }, [timerCollapsed]);

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
      if (getStartTimerOnFocus()) timer.start();
    }
  }, [timer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "?" && !typing) {
        e.preventDefault();
        localStorage.setItem("foci-shortcuts-hint-seen", "1");
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
      <a href="#focus-dock" className="skip-link">Skip to timer</a>
      <Navbar
        onOpenSettings={() => setShowSettings(true)}
        toolbarSlot={
          user ? (
            <div className="flex items-center gap-0.5">
              <CollaborationInvitesButton />
              <WhatsNewBanner focusMode={focusMode} />
              <NotificationBell />
            </div>
          ) : undefined
        }
      />
      {!focusMode && (
        <div id="focus-dock">
          <DailyQuoteBanner
            timerToolbar={
              <FocusDockToolbar
                embedded
                expanded={!timerCollapsed}
                onToggleExpanded={() => setTimerCollapsed((c) => !c)}
                displayTime={mobileDisplayTime}
                isRunning={isRunning}
                isBreak={timer.isBreakMode}
                activeTaskTitle={activeTaskTitle}
                onStartPause={handleStartPause}
                onReset={handleReset}
                emphasizeStart={readyToFocus}
                sessions={{
                  count: timer.dailyGoalData.sessionCount,
                  goal: timer.settings.dailyGoal,
                  streak: timer.dailyGoalData.streak,
                }}
                onShowShortcuts={() => setShowShortcuts(true)}
              />
            }
            musicToolbar={<AmbientSounds inline embedded />}
            timerPanel={
              <FocusDockPanel
                compactStrip
                expanded={!timerCollapsed}
                onToggleExpanded={() => setTimerCollapsed(true)}
                displayTime={timer.status === "break" ? formatTime(timer.remainingTime) : displayTime}
                isRunning={isRunning}
                isBreak={timer.isBreakMode}
                readyToFocus={readyToFocus}
                activeTaskId={activeTaskId}
                activeTaskTitle={activeTaskTitle}
                onClearTask={() => setActiveTaskId(null)}
                onStartPause={handleStartPause}
                onReset={handleReset}
                onToggleFocusMode={() => setFocusMode((f) => !f)}
                onShowShortcuts={() => setShowShortcuts(true)}
                focusMode={focusMode}
                remainingTime={timer.remainingTime}
                workDuration={timer.settings.workDuration}
                breakDuration={timer.settings.breakDuration}
                label={timer.label}
                statusText={timer.statusText}
                timerStatus={timer.status}
                workDurationMs={timer.settings.workDuration}
                onSelectWorkPreset={handleSelectWorkPreset}
                lastQuote={timer.lastQuote}
                emphasizeStart={readyToFocus}
              />
            }
          />
        </div>
      )}
      <AppMessageQueue user={user} focusMode={focusMode} />
      {focusMode && (
        <>
          <div className="px-2 sm:px-4 pt-2">
            <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm">
              <span className="text-blue-800 dark:text-blue-200 font-medium">Focus mode — fewer distractions</span>
              <button
                type="button"
                onClick={() => setFocusMode(false)}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline touch-target-sm px-2"
              >
                Exit (F)
              </button>
            </div>
          </div>
          {/* Keep ambient audio mounted while focus mode hides the dock UI */}
          <div className="sr-only" aria-hidden>
            <AmbientSounds />
          </div>
        </>
      )}
      <DueDateReminders />
      <div className="flex items-start justify-center flex-1 px-2 pt-2 pb-3 sm:p-4 sm:pt-3">
      <div className={`w-full ${tasksFullscreen ? "" : "max-w-[1280px]"}`}>

        {/* Tasks — full width */}
        <div id="tasks-section" className="w-full">
          <Suspense fallback={null}>
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
          </Suspense>
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

      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <SessionCelebration
        show={showCelebration}
        goalMet={goalMet}
        streak={timer.dailyGoalData.streak}
        onDismiss={() => setShowCelebration(false)}
      />

      <OnboardingTour />
      <FeatureTour />
    </div>
  );
}

