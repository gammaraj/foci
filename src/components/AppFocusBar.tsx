"use client";

import React from "react";
import { createPortal } from "react-dom";
import DailyQuoteBanner from "@/components/DailyQuoteBanner";
import FocusDockPanel, { FocusDockToolbar } from "@/components/FocusDock";
import AmbientSounds from "@/components/AmbientSounds";
import { useFocusSession } from "@/components/FocusSessionProvider";

const TITLE_HOST_ID = "foci-focus-bar-title";
const ACTIONS_HOST_ID = "foci-focus-bar-actions";

/** Portal page title into the shared App Focus Bar. */
export function FocusBarTitle({ children }: { children: React.ReactNode }) {
  const [host, setHost] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setHost(document.getElementById(TITLE_HOST_ID));
    const obs = new MutationObserver(() => setHost(document.getElementById(TITLE_HOST_ID)));
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  if (!host) return null;
  return createPortal(children, host);
}

/** Portal page actions into the shared App Focus Bar. */
export function FocusBarActions({ children }: { children: React.ReactNode }) {
  const [host, setHost] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setHost(document.getElementById(ACTIONS_HOST_ID));
    const obs = new MutationObserver(() => setHost(document.getElementById(ACTIONS_HOST_ID)));
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  if (!host) return null;
  return createPortal(children, host);
}

/**
 * Shared header under the navbar: [page title] · Music/Timer · [page actions].
 * Title/actions are filled by pages via FocusBarTitle / FocusBarActions portals.
 *
 * Layout modes:
 * - title | focus | actions whenever width ≥480 (portrait mid / landscape / desktop)
 * - stacked focus strip only on narrow phones (<480)
 * - roomy (≥640×≥500): desktop navbar + When/Layout chrome
 * - land-compact (≥480×≤500): denser filters, inline search, hide empty One Thing
 */
export default function AppFocusBar() {
  const {
    focusMode,
    timerCollapsed,
    setTimerCollapsed,
    mobileDisplayTime,
    displayTime,
    isRunning,
    readyToFocus,
    activeTaskId,
    activeTaskTitle,
    setActiveTaskId,
    handleStartPause,
    handleReset,
    handleSelectWorkPreset,
    setFocusMode,
    setShowShortcuts,
    timer,
  } = useFocusSession();

  if (focusMode) {
    return (
      <div className="sr-only" aria-hidden>
        <AmbientSounds />
      </div>
    );
  }

  const focusStrip = (
    <DailyQuoteBanner
      variant="embedded"
      timerPanelExpanded={!timerCollapsed}
      onCollapseAll={() => setTimerCollapsed(true)}
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
          remainingTime={timer.remainingTime}
          workDurationMs={timer.settings.workDuration}
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
          displayTime={timer.status === "break" ? mobileDisplayTime : displayTime}
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
  );

  return (
    <div className="no-print border-b border-[color:var(--surface-border)] dark:border-[#243350]/80 bg-white/75 dark:bg-[#0c1424]/90 backdrop-blur-sm">
      <div className="app-container py-1 land-compact:py-0.5">
        <div className="flex items-center justify-between min-w-0 gap-1 panel-header-calm rounded-xl px-2 sm:px-2.5 py-0.5">
          <div id={TITLE_HOST_ID} className="min-w-0 shrink overflow-x-auto scrollbar-hide" />

          {/* Enough width to share the title row (any orientation) */}
          <div className="no-print hidden min-[480px]:flex flex-1 min-w-0 justify-center overflow-hidden px-0.5">
            {focusStrip}
          </div>

          <div id={ACTIONS_HOST_ID} className="no-print flex items-center gap-0.5 flex-shrink-0 justify-end" />
        </div>

        {/* Narrow phones only — focus strip under title */}
        <div className="no-print min-[480px]:hidden mt-0.5 pt-0.5 border-t border-[color:var(--surface-border)] dark:border-[#243350]/70">
          {focusStrip}
        </div>
      </div>
    </div>
  );
}
