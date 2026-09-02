"use client";

import { reportError } from "@/lib/report-error";
import React, { useState, useEffect, useRef } from "react";
import { Settings, Project } from "@/lib/types";
import { TIMER_PRESETS, GOAL_PRESETS } from "@/lib/templates";
import TaskImportExport, { type ImportResult } from "@/components/TaskImportExport";
import AccountSharingModal from "@/components/AccountSharingModal";
import ShareProjectModal from "@/components/ShareProjectModal";
import { useAuth } from "@/components/AuthProvider";
import { loadProjects, loadTaskViewPreferences, saveTaskViewPreferences, loadCustomQuote, saveCustomQuote } from "@/lib/storage";
import { getFocusModeAuto, setFocusModeAuto, getStartTimerOnFocus, setStartTimerOnFocus } from "@/lib/focus-mode";
import {
  MAX_CUSTOM_QUOTE,
  notifyCustomQuoteChanged,
} from "@/lib/quotes";
import TimerAlarmPicker from "@/components/TimerAlarmPicker";
import {
  DEFAULT_TASK_VIEW_OPTIONS,
  DEFAULT_VIEW_CHANGED_EVENT,
  type DefaultTaskView,
} from "@/lib/task-view-preference";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Button } from "@/components/ui/Button";
import { isStandaloneDisplay } from "@/lib/pwa-install";

interface SettingsPanelProps {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
  onTasksImported?: (result?: ImportResult) => void;
}

type SettingsTab = "timer" | "experience" | "sharing" | "data";

const TABS: { id: SettingsTab; label: string; signedInOnly?: boolean }[] = [
  { id: "timer", label: "Timer" },
  { id: "experience", label: "Experience" },
  { id: "sharing", label: "Sharing", signedInOnly: true },
  { id: "data", label: "Data" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 border-slate-300 dark:border-surface-border rounded"
      />
    </div>
  );
}

export default function SettingsPanel({
  settings,
  onSave,
  onClose,
  onTasksImported,
}: SettingsPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>(() => {
    if (typeof window === "undefined") return "timer";
    const pending = sessionStorage.getItem("foci-settings-tab");
    if (pending === "sharing" || pending === "timer" || pending === "experience" || pending === "data") {
      sessionStorage.removeItem("foci-settings-tab");
      return pending;
    }
    return "timer";
  });
  const [showAccountSharing, setShowAccountSharing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [shareModalProject, setShareModalProject] = useState<Project | null>(null);
  const [workMin, setWorkMin] = useState(Math.floor(Math.round(settings.workDuration / 1000) / 60));
  const [workSec, setWorkSec] = useState(Math.round(settings.workDuration / 1000) % 60);
  const [breakMin, setBreakMin] = useState(Math.floor(settings.breakDuration / 60000));
  const [inactivityMin, setInactivityMin] = useState(
    Math.floor(settings.inactivityThreshold / 60000),
  );
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal);
  const [autoStart, setAutoStart] = useState(settings.autoStartEnabled);
  const [notifications, setNotifications] = useState(settings.notificationsEnabled);
  const [focusModeAuto, setFocusModeAutoState] = useState(false);
  const [startTimerOnFocus, setStartTimerOnFocusState] = useState(true);
  const [customQuoteDraft, setCustomQuoteDraft] = useState("");
  const [defaultTaskView, setDefaultTaskViewState] = useState<DefaultTaskView>("card");
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>("default");
  const [saved, setSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const visibleTabs = TABS.filter((t) => !t.signedInOnly || user);

  useEffect(() => {
    setFocusModeAutoState(getFocusModeAuto());
    setStartTimerOnFocusState(getStartTimerOnFocus());
    loadCustomQuote()
      .then((q) => setCustomQuoteDraft(q ?? ""))
      .catch((err) => reportError("Failed to load custom quote", err));
    loadTaskViewPreferences()
      .then((prefs) => setDefaultTaskViewState(prefs.defaultTaskView))
      .catch((err) => reportError("Failed to load task view preference", err));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPerm(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (
      notifications &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().then((result) => setBrowserPerm(result));
    }
  }, [notifications]);

  useEffect(() => {
    if (!user || tab !== "sharing") return;
    const loadProjectsData = async () => {
      setLoadingProjects(true);
      try {
        const allProjects = await loadProjects();
        setProjects(allProjects.filter((p) => !p.archived && p.id !== "__general__"));
      } catch (err) {
        reportError("Failed to load projects", err);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjectsData();
  }, [user, tab]);

  useEffect(() => {
    if (tab === "sharing" && !user) setTab("timer");
  }, [tab, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const markDirty = () => setDirty(true);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setBrowserPerm(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    const workTotalSec = workMin * 60 + workSec;
    if (workMin < 0 || workMin > 120 || workSec < 0 || workSec > 59 || workTotalSec < 1 || workTotalSec > 120 * 60) {
      errors.workMin = "1 second–120 minutes";
    }
    if (breakMin <= 0 || breakMin > 60) errors.breakMin = "Must be 1–60";
    if (inactivityMin <= 0) errors.inactivityMin = "Must be > 0";
    if (dailyGoal <= 0 || dailyGoal > 20) errors.dailyGoal = "Must be 1–20";
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setTab("timer");
      return;
    }

    onSave({
      workDuration: (workMin * 60 + workSec) * 1000,
      breakDuration: breakMin * 60 * 1000,
      inactivityThreshold: inactivityMin * 60 * 1000,
      dailyGoal,
      autoStartEnabled: autoStart,
      notificationsEnabled: notifications,
      alarmEnabled: settings.alarmEnabled,
      alarmSound: settings.alarmSound,
    });
    setDirty(false);
    setSaved(true);
    setTimeout(() => {
      onClose();
      setSaved(false);
    }, 600);
  };

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />

      <div
        className="settings-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-surface-hover transition"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row min-h-0 flex-1">
          {/* Nav */}
          <nav
            className="settings-nav flex sm:flex-col gap-1 p-2 sm:p-3 border-b sm:border-b-0 sm:border-r border-surface-border overflow-x-auto shrink-0"
            aria-label="Settings sections"
          >
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  tab === t.id
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-hover"
                }`}
                aria-current={tab === t.id ? "page" : undefined}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {tab === "timer" && (
                <>
                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Presets
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      One tap to set work and break lengths.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TIMER_PRESETS.map((preset) => {
                        const isActive =
                          workMin === preset.workMin && workSec === 0 && breakMin === preset.breakMin;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setWorkMin(preset.workMin);
                              setWorkSec(0);
                              setBreakMin(preset.breakMin);
                              markDirty();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200"
                                : "bg-surface-elevated dark:bg-surface-recessed border-surface-border text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#3a5070]"
                            }`}
                            title={preset.description}
                          >
                            {preset.label}
                            <span className="ml-1.5 text-xs opacity-60">
                              {preset.workMin}/{preset.breakMin}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Durations
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                          Work
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="workDuration" className="sr-only">
                              Work minutes
                            </label>
                            <input
                              type="number"
                              id="workDuration"
                              min={0}
                              max={120}
                              value={workMin}
                              onChange={(e) => {
                                setWorkMin(Number(e.target.value));
                                markDirty();
                                setValidationErrors((v) => {
                                  const { workMin: _, ...rest } = v;
                                  return rest;
                                });
                              }}
                              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 dark:bg-surface-recessed dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none ${
                                validationErrors.workMin
                                  ? "border-red-400"
                                  : "border-surface-border"
                              }`}
                            />
                            <p className="text-xs text-slate-400 mt-1">min</p>
                          </div>
                          <div>
                            <label htmlFor="workDurationSec" className="sr-only">
                              Work seconds
                            </label>
                            <input
                              type="number"
                              id="workDurationSec"
                              min={0}
                              max={59}
                              value={workSec}
                              onChange={(e) => {
                                setWorkSec(Number(e.target.value));
                                markDirty();
                                setValidationErrors((v) => {
                                  const { workMin: _, ...rest } = v;
                                  return rest;
                                });
                              }}
                              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 dark:bg-surface-recessed dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none ${
                                validationErrors.workMin
                                  ? "border-red-400"
                                  : "border-surface-border"
                              }`}
                            />
                            <p className="text-xs text-slate-400 mt-1">sec</p>
                          </div>
                        </div>
                        <FieldError message={validationErrors.workMin} />
                      </div>
                      <div>
                        <label htmlFor="breakDuration" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                          Break (min)
                        </label>
                        <input
                          type="number"
                          id="breakDuration"
                          min={1}
                          max={60}
                          value={breakMin}
                          onChange={(e) => {
                            setBreakMin(Number(e.target.value));
                            markDirty();
                            setValidationErrors((v) => {
                              const { breakMin: _, ...rest } = v;
                              return rest;
                            });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 dark:bg-surface-recessed dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none ${
                            validationErrors.breakMin
                              ? "border-red-400"
                              : "border-surface-border"
                          }`}
                        />
                        <FieldError message={validationErrors.breakMin} />
                      </div>
                      <div>
                        <label htmlFor="inactivityThreshold" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                          Inactivity pause (min)
                        </label>
                        <input
                          type="number"
                          id="inactivityThreshold"
                          min={1}
                          value={inactivityMin}
                          onChange={(e) => {
                            setInactivityMin(Number(e.target.value));
                            markDirty();
                            setValidationErrors((v) => {
                              const { inactivityMin: _, ...rest } = v;
                              return rest;
                            });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 dark:bg-surface-recessed dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none ${
                            validationErrors.inactivityMin
                              ? "border-red-400"
                              : "border-surface-border"
                          }`}
                        />
                        <FieldError message={validationErrors.inactivityMin} />
                      </div>
                      <div>
                        <label htmlFor="dailyGoal" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                          Daily goal (sessions)
                        </label>
                        <input
                          type="number"
                          id="dailyGoal"
                          min={1}
                          max={20}
                          value={dailyGoal}
                          onChange={(e) => {
                            setDailyGoal(Number(e.target.value));
                            markDirty();
                            setValidationErrors((v) => {
                              const { dailyGoal: _, ...rest } = v;
                              return rest;
                            });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 dark:bg-surface-recessed dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none ${
                            validationErrors.dailyGoal
                              ? "border-red-400"
                              : "border-surface-border"
                          }`}
                        />
                        <FieldError message={validationErrors.dailyGoal} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {GOAL_PRESETS.map((gp) => (
                        <button
                          key={gp.label}
                          type="button"
                          onClick={() => {
                            setDailyGoal(gp.sessions);
                            markDirty();
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                            dailyGoal === gp.sessions
                              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200"
                              : "border-surface-border text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-hover"
                          }`}
                          title={gp.description}
                        >
                          {gp.label} · {gp.sessions}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="border-t border-slate-100 dark:border-surface-border divide-y divide-slate-100 dark:divide-[#243350]">
                    <ToggleRow
                      id="autoStart"
                      label="Auto-start next session"
                      description="Begin the next work or break session automatically when one ends."
                      checked={autoStart}
                      onChange={(next) => {
                        setAutoStart(next);
                        markDirty();
                      }}
                    />
                  </section>

                  <section className="border-t border-slate-100 dark:border-surface-border pt-5">
                    <TimerAlarmPicker
                      onPersist={(alarmEnabled, alarmSound) => {
                        onSave({ ...settings, alarmEnabled, alarmSound });
                      }}
                    />
                  </section>
                </>
              )}

              {tab === "experience" && (
                <>
                  <section className="divide-y divide-slate-100 dark:divide-[#243350]">
                    <ToggleRow
                      id="focusModeAuto"
                      label="Enter Zen mode when timer starts"
                      description="Hides distractions and simplifies the task panel while you work."
                      checked={focusModeAuto}
                      onChange={(next) => {
                        setFocusModeAutoState(next);
                        setFocusModeAuto(next);
                      }}
                    />
                    <ToggleRow
                      id="startTimerOnFocus"
                      label="Start timer when I focus a task"
                      description="Clicking Focus on a task starts the countdown immediately."
                      checked={startTimerOnFocus}
                      onChange={(next) => {
                        setStartTimerOnFocusState(next);
                        setStartTimerOnFocus(next);
                      }}
                    />
                    <ToggleRow
                      id="notifications"
                      label="Motivational quotes after sessions"
                      description="Show an inspirational browser notification when a work session ends."
                      checked={notifications}
                      onChange={(next) => {
                        setNotifications(next);
                        markDirty();
                      }}
                    />
                  </section>

                  <section className="border-t border-slate-100 dark:border-surface-border pt-5 space-y-2">
                    <div>
                      <label
                        htmlFor="custom-quote"
                        className="text-sm font-medium text-slate-800 dark:text-slate-100"
                      >
                        Your quote
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Shown next to One Thing. When set, it stays put and won&apos;t rotate daily.
                        Clear it to go back to the daily quote.
                        {user ? " Synced with your account." : " Saved with your local workspace."}
                      </p>
                    </div>
                    <textarea
                      id="custom-quote"
                      value={customQuoteDraft}
                      maxLength={MAX_CUSTOM_QUOTE}
                      rows={2}
                      placeholder='e.g. Deep work first — then everything else'
                      onChange={(e) => setCustomQuoteDraft(e.target.value)}
                      onBlur={() => {
                        const next = customQuoteDraft.trim().slice(0, MAX_CUSTOM_QUOTE);
                        void saveCustomQuote(next || null)
                          .then(() => {
                            setCustomQuoteDraft(next);
                            notifyCustomQuoteChanged();
                          })
                          .catch((err) => reportError("Failed to save custom quote", err));
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-elevated dark:bg-surface-recessed text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 resize-y min-h-[2.75rem]"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400 tabular-nums">
                        {customQuoteDraft.trim().length}/{MAX_CUSTOM_QUOTE}
                      </span>
                      {customQuoteDraft.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomQuoteDraft("");
                            void saveCustomQuote(null)
                              .then(() => notifyCustomQuoteChanged())
                              .catch((err) => reportError("Failed to clear custom quote", err));
                          }}
                          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          Use daily quote instead
                        </button>
                      )}
                    </div>
                  </section>

                  <section className="border-t border-slate-100 dark:border-surface-border pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <label
                          htmlFor="defaultTaskView"
                          className="text-sm font-medium text-slate-800 dark:text-slate-100"
                        >
                          Default task view
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Opens in this view when you visit Tasks. Switching views in the toolbar also updates this.
                        </p>
                      </div>
                      <select
                        id="defaultTaskView"
                        value={defaultTaskView}
                        onChange={async (e) => {
                          const view = e.target.value as DefaultTaskView;
                          setDefaultTaskViewState(view);
                          try {
                            await saveTaskViewPreferences({
                              defaultTaskView: view,
                              lastTaskView: view,
                              taskViewExplicit: true,
                            });
                            window.dispatchEvent(
                              new CustomEvent(DEFAULT_VIEW_CHANGED_EVENT, { detail: view }),
                            );
                          } catch (err) {
                            reportError("Failed to save task view preference", err);
                          }
                        }}
                        className="shrink-0 px-2.5 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-900 dark:bg-surface-recessed dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                      >
                        {DEFAULT_TASK_VIEW_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  <section className="rounded-lg border border-surface-border px-3 py-2.5">
                    {browserPerm === "granted" ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Browser notifications are enabled
                      </p>
                    ) : browserPerm === "denied" ? (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        Notifications are blocked in your browser site settings
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={requestPermission}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Allow browser notifications
                      </button>
                    )}
                  </section>

                  {!isStandaloneDisplay() && (
                    <section className="rounded-lg border border-surface-border px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          Add to Home Screen
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Install Foci for one-tap access and offline tasks. Full iPhone &amp; Android steps on the install page.
                        </p>
                      </div>
                      <ButtonLink
                        href="/install"
                        onClick={onClose}
                        size="md"
                        className="shrink-0 text-center"
                      >
                        Show how
                      </ButtonLink>
                    </section>
                  )}
                </>
              )}

              {tab === "sharing" && user && (
                <>
                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Share everything
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Give someone access to all current and future projects. Invites are in-app only — copy the invite
                      text and send it yourself (Foci does not email invites yet).
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAccountSharing(true)}
                      className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                    >
                      Manage account sharing
                    </button>
                  </section>

                  <section className="border-t border-slate-100 dark:border-surface-border pt-5">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Share one project
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Invite collaborators to a specific project. Same flow: save invite, copy text, they accept under
                      the people icon.
                    </p>
                    {loadingProjects ? (
                      <div className="flex justify-center py-6">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : projects.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                        No projects to share yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100 dark:divide-[#243350] border border-surface-border rounded-lg overflow-hidden">
                        {projects.map((project) => (
                          <li key={project.id}>
                            <button
                              type="button"
                              onClick={() => setShareModalProject(project)}
                              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-surface-hover transition-colors"
                            >
                              <span className="truncate text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                {project.color && (
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: project.color }}
                                  />
                                )}
                                {project.name}
                              </span>
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                                Share
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}

              {tab === "data" && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    Import &amp; export
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Back up your tasks or bring them in from another tool.
                  </p>
                  <div className="rounded-lg border border-surface-border p-3">
                    <TaskImportExport
                      showDestinationPicker
                      onTasksImported={onTasksImported}
                    />
                  </div>
                </section>
              )}
            </div>

            {/* Footer — save only matters for timer/notification fields */}
            <div className="shrink-0 border-t border-surface-border px-4 sm:px-5 py-3 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-surface-recessed/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {dirty
                  ? "You have unsaved changes"
                  : tab === "timer" || tab === "experience"
                    ? "Save applies timer & notification preferences"
                    : "Sharing and data actions apply immediately"}
              </p>
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="ghost" size="md" onClick={onClose}>
                  {dirty ? "Cancel" : "Close"}
                </Button>
                <Button type="submit" size="md">
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <AccountSharingModal
        isOpen={showAccountSharing}
        onClose={() => setShowAccountSharing(false)}
      />

      {shareModalProject && (
        <ShareProjectModal
          project={shareModalProject}
          isOpen={true}
          onClose={() => setShareModalProject(null)}
        />
      )}
    </>
  );
}
