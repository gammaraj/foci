"use client";

import React, { Suspense, useLayoutEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import AppNavbar from "@/components/AppNavbar";
import AppFocusBar from "@/components/AppFocusBar";
import AppMessageQueue from "@/components/AppMessageQueue";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import SessionCelebration from "@/components/SessionCelebration";
import {
  FocusSessionProvider,
  useFocusSession,
} from "@/components/FocusSessionProvider";
import { useAuth } from "@/components/AuthProvider";
import type { ImportResult } from "@/components/TaskImportExport";
import { hasLocalWorkspaceSnapshot } from "@/lib/storage";

const DueDateReminders = dynamic(() => import("@/components/DueDateReminders"));

function WorkspaceChromeInner({
  children,
  onTasksImported,
}: {
  children: ReactNode;
  onTasksImported?: (result?: ImportResult) => void;
}) {
  const { user, loading } = useAuth();
  // Must start false on server + first client paint (no localStorage in useState).
  const [hasSnapshot, setHasSnapshot] = useState(false);
  useLayoutEffect(() => {
    setHasSnapshot(hasLocalWorkspaceSnapshot());
  }, []);
  const {
    focusMode,
    setFocusMode,
    timer,
    showShortcuts,
    setShowShortcuts,
    showCelebration,
    setShowCelebration,
    goalMet,
    timerAnnouncement,
  } = useFocusSession();

  if (loading && !hasSnapshot) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-screen bg-[var(--page-bg)] dark:bg-[#070b16]">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-[#243350] border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen flex flex-col bg-[var(--page-bg)] dark:bg-[#070b16]">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <a href="#focus-dock" className="skip-link">
        Skip to timer
      </a>
      <AppNavbar
        focusMode={focusMode}
        settings={timer.settings}
        onSaveSettings={timer.saveSettings}
        onTasksImported={(result) => {
          onTasksImported?.(result);
          window.dispatchEvent(new CustomEvent("foci-tasks-imported", { detail: result }));
        }}
      />
      <div className="no-print">
        <AppMessageQueue user={user} focusMode={focusMode} />
      </div>
      {focusMode && (
        <div className="no-print app-container py-2">
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm">
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Zen mode — fewer distractions
            </span>
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline touch-target-sm px-2"
            >
              Exit Zen (F)
            </button>
          </div>
        </div>
      )}
      <AppFocusBar />
      <DueDateReminders />
      <div id="main-content" className="flex-1">
        {children}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {timerAnnouncement}
      </div>
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <SessionCelebration
        show={showCelebration}
        goalMet={goalMet}
        streak={timer.dailyGoalData.streak}
        onDismiss={() => setShowCelebration(false)}
      />
    </div>
  );
}

/** Shared signed-in chrome: navbar + App Focus Bar + timer/music session. */
export default function WorkspaceChrome({
  children,
  onTasksImported,
}: {
  children: ReactNode;
  onTasksImported?: (result?: ImportResult) => void;
}) {
  return (
    <FocusSessionProvider>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center gap-3 min-h-screen bg-[var(--page-bg)] dark:bg-[#070b16]">
            <div className="w-8 h-8 border-4 border-slate-200 dark:border-[#243350] border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading…</p>
          </div>
        }
      >
        <WorkspaceChromeInner onTasksImported={onTasksImported}>{children}</WorkspaceChromeInner>
      </Suspense>
    </FocusSessionProvider>
  );
}
