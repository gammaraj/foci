"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTimer, type TimerState } from "@/hooks/useTimer";
import { useAuth } from "@/components/AuthProvider";
import { loadTasks } from "@/lib/storage";
import { getFocusModeAuto, getStartTimerOnFocus } from "@/lib/focus-mode";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

interface FocusSessionContextValue {
  timer: TimerState;
  activeTaskId: string | null;
  activeTaskTitle: string;
  setActiveTaskId: (id: string | null) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  timerCollapsed: boolean;
  setTimerCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
  displayTime: string;
  mobileDisplayTime: string;
  isRunning: boolean;
  readyToFocus: boolean;
  goalMet: boolean;
  handleStartPause: () => void;
  handleReset: () => void;
  handleStartTask: (taskId: string) => void;
  handleCompleteTask: (taskId: string) => number;
  handleSelectWorkPreset: (minutes: number) => void;
  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;
  showCelebration: boolean;
  setShowCelebration: (v: boolean) => void;
  timerAnnouncement: string;
}

const FocusSessionContext = createContext<FocusSessionContextValue | null>(null);

export function useFocusSession() {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) {
    throw new Error("useFocusSession must be used within FocusSessionProvider");
  }
  return ctx;
}

/** Optional — returns null outside the provider (e.g. marketing pages). */
export function useFocusSessionOptional() {
  return useContext(FocusSessionContext);
}


export function FocusSessionProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const timer = useTimer({ authLoading: loading, user });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);
  const [timerCollapsed, setTimerCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("foci-timer-dock-expanded");
      if (saved === "1") return false;
      return true;
    }
    return true;
  });
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

  useEffect(() => {
    localStorage.setItem("foci-timer-dock-expanded", timerCollapsed ? "0" : "1");
  }, [timerCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 640) setTimerCollapsed(true);
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

  const isRunning = timer.status === "running";
  const displayTime =
    timer.status === "idle"
      ? formatTime(timer.settings.workDuration)
      : formatTime(timer.remainingTime);
  const mobileDisplayTime =
    timer.status === "break" ? formatTime(timer.remainingTime) : displayTime;

  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  useEffect(() => {
    timer.setOnSessionCompleteCallback(() => {
      const taskId = activeTaskIdRef.current;
      if (!taskId) return;
      const elapsed = timer.settings.workDuration;
      window.dispatchEvent(
        new CustomEvent("tempo-session-complete", {
          detail: { taskId, elapsed },
        }),
      );
    });
    return () => timer.setOnSessionCompleteCallback(null);
  }, [timer]);

  useEffect(() => {
    const prev = prevTimerStatusRef.current;
    const next = timer.status;
    if (prev === next) return;
    prevTimerStatusRef.current = next;

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

  const handleStartTask = useCallback(
    (taskId: string) => {
      setActiveTaskId(taskId);
      if (timer.status !== "running" && timer.status !== "break") {
        if (getFocusModeAuto()) setFocusMode(true);
        if (getStartTimerOnFocus()) timer.start();
      }
    },
    [timer],
  );

  const handleCompleteTask = useCallback(
    (taskId: string): number => {
      const elapsed = timer.getElapsedWorkTime();
      if (timer.status === "running") timer.pause();
      setActiveTaskId(null);
      return elapsed;
    },
    [timer],
  );

  const handleSelectWorkPreset = useCallback(
    (minutes: number) => {
      const nextDuration = minutes * 60 * 1000;
      if (timer.settings.workDuration === nextDuration) return;
      timer.saveSettings({ ...timer.settings, workDuration: nextDuration });
    },
    [timer],
  );

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
        window.dispatchEvent(new CustomEvent("foci-close-settings"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleStartPause, handleReset]);

  const goalMet = timer.dailyGoalData.sessionCount >= timer.settings.dailyGoal;
  const readyToFocus = !!activeTaskId && timer.status === "idle";

  const value = useMemo<FocusSessionContextValue>(
    () => ({
      timer,
      activeTaskId,
      activeTaskTitle,
      setActiveTaskId,
      focusMode,
      setFocusMode,
      timerCollapsed,
      setTimerCollapsed,
      displayTime,
      mobileDisplayTime,
      isRunning,
      readyToFocus,
      goalMet,
      handleStartPause,
      handleReset,
      handleStartTask,
      handleCompleteTask,
      handleSelectWorkPreset,
      showShortcuts,
      setShowShortcuts,
      showCelebration,
      setShowCelebration,
      timerAnnouncement,
    }),
    [
      timer,
      activeTaskId,
      activeTaskTitle,
      focusMode,
      timerCollapsed,
      displayTime,
      mobileDisplayTime,
      isRunning,
      readyToFocus,
      goalMet,
      handleStartPause,
      handleReset,
      handleStartTask,
      handleCompleteTask,
      handleSelectWorkPreset,
      showShortcuts,
      showCelebration,
      timerAnnouncement,
    ],
  );

  return <FocusSessionContext.Provider value={value}>{children}</FocusSessionContext.Provider>;
}
