"use client";

import React, { useState } from "react";
import { Settings } from "@/lib/types";

interface SettingsPanelProps {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  settings,
  onSave,
  onClose,
}: SettingsPanelProps) {
  const [workMin, setWorkMin] = useState(
    Math.floor(settings.workDuration / 60000)
  );
  const [breakMin, setBreakMin] = useState(
    Math.floor(settings.breakDuration / 60000)
  );
  const [inactivityMin, setInactivityMin] = useState(
    Math.floor(settings.inactivityThreshold / 60000)
  );
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal);
  const [autoStart, setAutoStart] = useState(settings.autoStartEnabled);
  const [notifications, setNotifications] = useState(
    settings.notificationsEnabled
  );
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (workMin <= 0 || breakMin <= 0 || inactivityMin <= 0 || dailyGoal <= 0) {
      return;
    }

    const newSettings: Settings = {
      workDuration: workMin * 60 * 1000,
      breakDuration: breakMin * 60 * 1000,
      inactivityThreshold: inactivityMin * 60 * 1000,
      dailyGoal,
      autoStartEnabled: autoStart,
      notificationsEnabled: notifications,
    };

    onSave(newSettings);
    setSaved(true);
    setTimeout(() => {
      onClose();
      setSaved(false);
    }, 600);
  };

  return (
    <>
      {/* Overlay */}
      <div className="settings-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="settings-panel">
        {/* Header */}
        <div
          className="px-4 py-3 text-white flex justify-between items-center"
          style={{
            background: "#1e293b",
          }}
        >
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            Settings
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition p-0.5 rounded hover:bg-white/20"
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          {/* Timer Settings */}
          <div>
            <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1.5" />
              Timer Settings
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {/* Work Duration */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <label
                  htmlFor="workDuration"
                  className="flex text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 items-center"
                >
                  <span className="mr-1">⏱️</span> Work (min)
                </label>
                <input
                  type="number"
                  id="workDuration"
                  min={1}
                  max={120}
                  value={workMin}
                  onChange={(e) => setWorkMin(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-xs bg-white dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              {/* Break Duration */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <label
                  htmlFor="breakDuration"
                  className="flex text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 items-center"
                >
                  <span className="mr-1">🛌</span> Break (min)
                </label>
                <input
                  type="number"
                  id="breakDuration"
                  min={1}
                  max={60}
                  value={breakMin}
                  onChange={(e) => setBreakMin(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-xs bg-white dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              {/* Inactivity Threshold */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <label
                  htmlFor="inactivityThreshold"
                  className="flex text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 items-center"
                >
                  <span className="mr-1">⏸️</span> Inactivity (min)
                </label>
                <input
                  type="number"
                  id="inactivityThreshold"
                  min={1}
                  value={inactivityMin}
                  onChange={(e) => setInactivityMin(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-xs bg-white dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Auto-pause when inactive
                </div>
              </div>

              {/* Daily Goal */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <label
                  htmlFor="dailyGoal"
                  className="flex text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 items-center"
                >
                  <span className="mr-1">🎯</span> Goal (sessions)
                </label>
                <input
                  type="number"
                  id="dailyGoal"
                  min={1}
                  max={20}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-xs bg-white dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5" />
              Preferences
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <span className="text-sm mr-1.5">🚀</span>
                  <label
                    htmlFor="autoStart"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Auto-start sessions
                  </label>
                </div>
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 flex items-center">
              <span className="text-sm mr-1.5">🔔</span>
              Notifications
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <span className="text-sm mr-1.5">💬</span>
                  <label
                    htmlFor="notifications"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Show motivational quotes
                  </label>
                </div>
                <input
                  type="checkbox"
                  id="notifications"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-2">
                Get inspirational quotes as browser notifications after each work
                session
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center text-sm"
            style={{
              background: "#2563eb",
            }}
          >
            {saved ? (
              <>
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Saved!
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
