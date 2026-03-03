"use client";

import React, { useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import CircularTimer from "@/components/CircularTimer";
import TimerControls from "@/components/TimerControls";
import DailyProgress from "@/components/DailyProgress";
import SettingsPanel from "@/components/SettingsPanel";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function HomePage() {
  const timer = useTimer();
  const [showSettings, setShowSettings] = useState(false);

  const isRunning = timer.status === "running";
  const displayTime =
    timer.status === "idle"
      ? formatTime(timer.settings.workDuration)
      : formatTime(timer.remainingTime);

  const handleStartPause = () => {
    if (timer.status === "break") return; // Can't pause during break
    if (isRunning) {
      timer.pause();
    } else {
      timer.start();
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen p-1 pt-4">
        <div className="w-full max-w-[640px]">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-visible relative">
          {/* Header */}
          <header
            className="flex items-center justify-between px-4 py-5 text-white rounded-t-2xl"
            style={{
              background: "#1e293b",
            }}
          >
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/20">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 14 C10 14, 9 15, 9 16.5 C9 17, 9.2 17.5, 9.5 18 C9.2 18.5, 9 19, 9 19.5 C9 21, 10 22, 11.5 22 L20.5 22 C22 22, 23 21, 23 19.5 C23 19, 22.8 18.5, 22.5 18 C22.8 17.5, 23 17, 23 16.5 C23 15, 22 14, 20.5 14 L19 14 C19 14, 18.5 14.2, 18 14.5 L16 14.5 C15.5 14.2, 15 14, 15 14 L12 14 Z"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 16.5 C14.5 16.8, 15 17, 15.5 17 C16 17, 16.5 16.8, 17 16.5"
                    stroke="white"
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 14V10C14 7.79 15.79 6 18 6H18C20.21 6 22 7.79 22 10V14"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="white"
                    strokeWidth="1"
                    fill="none"
                    opacity="0.3"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold ml-3">LockIn</h1>
            </div>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="text-white hover:text-gray-200 transition p-1.5 rounded-full hover:bg-white/10"
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
          </header>

          {/* Main content */}
          <div className="bg-white dark:bg-gray-900 p-3">
            {/* Circular Timer */}
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

            {/* Timer Controls */}
            <TimerControls
              isRunning={isRunning}
              onStartPause={handleStartPause}
              onReset={timer.reset}
            />
          </div>

          {/* Quote display */}
          {timer.lastQuote && (
            <div className="px-4 pb-2">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs italic text-slate-500 dark:text-slate-400">
                  &ldquo;{timer.lastQuote}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Daily Progress */}
          <DailyProgress
            dailyGoalData={timer.dailyGoalData}
            dailyGoal={timer.settings.dailyGoal}
          />

          {/* Bottom padding */}
          <div className="h-2" />
        </div>

        {/* Screen reader live region */}
        <div className="sr-only" aria-live="polite" aria-atomic="true" />
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          settings={timer.settings}
          onSave={timer.saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
