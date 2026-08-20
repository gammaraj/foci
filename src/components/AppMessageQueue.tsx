"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { loadProjects, loadTasks } from "@/lib/storage";
import { isTasksAppPath } from "@/lib/task-view-url";
import {
  CLEAR_GUEST_DEMO_EVENT,
  hasClearedGuestDemo,
  hasDismissedGuestSampleBanner,
  isGuestSampleWorkspace,
  markGuestSampleBannerDismissed,
} from "@/lib/guest-demo";
import {
  consumeDeferredInstallPrompt,
  ensureInstallPromptCapture,
  getDeferredInstallPrompt,
  isIosDevice,
  openPwaInstallGuide,
  shouldOfferPwaNudge,
  snoozePwaInstall,
  subscribeInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

type MessageId = "sample-workspace" | "signup" | "first-session" | "notification" | "pwa";

// Soft conversion: get them into a session first, then ask to sync / install.
const PRIORITY: MessageId[] = ["sample-workspace", "first-session", "signup", "pwa"];

interface AppMessageQueueProps {
  user: { id: string } | null;
  focusMode?: boolean;
}

function hasCompletedSession(): boolean {
  return Boolean(
    localStorage.getItem("foci_sessions_completed") ||
      localStorage.getItem("tempo_sessions_completed"),
  );
}

export default function AppMessageQueue({ user, focusMode }: AppMessageQueueProps) {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<MessageId | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<Set<MessageId>>(() => new Set());
  const [sessionTick, setSessionTick] = useState(0);
  const [confirmClearSamples, setConfirmClearSamples] = useState(false);

  const dismiss = useCallback((id: MessageId) => {
    setDismissed((prev) => new Set(prev).add(id));
    if (id === "signup") sessionStorage.setItem("foci_signup_dismissed", "1");
    if (id === "first-session") {
      localStorage.setItem("foci_first_session_nudge_dismissed", "1");
    }
    if (id === "sample-workspace") markGuestSampleBannerDismissed();
    if (id === "notification") sessionStorage.setItem("foci_notif_dismissed", "1");
    if (id === "pwa") snoozePwaInstall();
  }, []);

  useEffect(() => {
    const onSessionComplete = () => setSessionTick((n) => n + 1);
    window.addEventListener("tempo-session-complete", onSessionComplete);
    return () => window.removeEventListener("tempo-session-complete", onSessionComplete);
  }, []);

  useEffect(() => {
    ensureInstallPromptCapture();
    setDeferredPrompt(getDeferredInstallPrompt());
    return subscribeInstallPrompt(() => {
      setDeferredPrompt(getDeferredInstallPrompt());
    });
  }, []);

  useEffect(() => {
    if (focusMode) {
      setActiveId(null);
      return;
    }

    const evaluate = async () => {
      for (const id of PRIORITY) {
        if (dismissed.has(id)) continue;

        if (id === "sample-workspace") {
          if (user) continue;
          if (!isTasksAppPath(pathname)) continue;
          if (hasClearedGuestDemo() || hasDismissedGuestSampleBanner()) continue;
          try {
            const [tasks, projects] = await Promise.all([loadTasks(), loadProjects()]);
            if (isGuestSampleWorkspace(tasks, projects)) {
              setActiveId("sample-workspace");
              return;
            }
          } catch {
            continue;
          }
        }

        if (id === "first-session") {
          const dismissedLocal =
            localStorage.getItem("foci_first_session_nudge_dismissed") ||
            localStorage.getItem("tempo_first_session_nudge_dismissed");
          if (dismissedLocal) continue;
          if (hasCompletedSession()) continue;
          try {
            const tasks = await loadTasks();
            const hasActivity = tasks.some((t) => t.completed || (t.sessions || 0) > 0);
            if (!hasActivity) {
              setActiveId("first-session");
              return;
            }
          } catch {
            setActiveId("first-session");
            return;
          }
        }

        if (id === "signup") {
          // Soft prompt: only after the guest has completed a real focus session.
          if (
            !user &&
            hasCompletedSession() &&
            !sessionStorage.getItem("foci_signup_dismissed")
          ) {
            setActiveId("signup");
            return;
          }
        }

        if (id === "notification") {
          if (typeof window === "undefined" || !("Notification" in window)) continue;
          if (Notification.permission !== "default") continue;
          if (sessionStorage.getItem("foci_notif_dismissed")) continue;
          setActiveId("notification");
          return;
        }

        if (id === "pwa") {
          if (!shouldOfferPwaNudge()) continue;
          setActiveId("pwa");
          return;
        }
      }
      setActiveId(null);
    };

    evaluate();
  }, [user, dismissed, deferredPrompt, focusMode, sessionTick, pathname]);

  if (!activeId) return null;

  if (activeId === "sample-workspace") {
    return (
      <>
        <div className="app-container py-2">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/25 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">These are sample projects</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                Try the cards, then clear them and add your own — nothing here is saved to an account yet.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setConfirmClearSamples(true)}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 touch-target-sm"
              >
                Start fresh
              </button>
              <button
                type="button"
                onClick={() => dismiss("sample-workspace")}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline touch-target-sm"
              >
                Keep exploring
              </button>
            </div>
          </div>
        </div>
        {confirmClearSamples && (
          <ConfirmModal
            title="Clear sample projects?"
            message="This removes the sample projects and tasks so you can add your own. It only affects this browser — you can still sign up later to sync."
            confirmLabel="Clear samples"
            cancelLabel="Cancel"
            variant="danger"
            onConfirm={() => {
              setConfirmClearSamples(false);
              setDismissed((prev) => new Set(prev).add("sample-workspace"));
              window.dispatchEvent(new Event(CLEAR_GUEST_DEMO_EVENT));
            }}
            onCancel={() => setConfirmClearSamples(false)}
          />
        )}
      </>
    );
  }

  if (activeId === "signup") {
    return (
      <div className="bg-blue-600 text-white text-sm">
        <div className="app-container py-2 flex items-center justify-between gap-3">
          <p className="flex-1 min-w-0">
            <span className="font-medium">Nice session</span>
            <span className="hidden sm:inline"> — create a free account to keep your streak across devices</span>
            <span className="sm:hidden"> — sync your streak free</span>
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/login" className="px-3 py-1.5 bg-white text-blue-700 font-semibold rounded-lg text-sm hover:bg-blue-50">
              Sign up
            </Link>
            <button type="button" onClick={() => dismiss("signup")} className="p-1.5 text-white/70 hover:text-white touch-target-sm" aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeId === "first-session") {
    return (
      <div className="app-container py-2">
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/25 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Ready to start focusing?</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">Add a task, tap Play, and run your first Pomodoro session.</p>
          </div>
          <button type="button" onClick={() => dismiss("first-session")} className="text-sm text-blue-600 dark:text-blue-400 font-medium touch-target-sm px-2" aria-label="Dismiss">
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (activeId === "notification") {
    return (
      <div className="app-container py-2">
        <div className="p-3 rounded-xl app-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-700 dark:text-slate-200">Enable reminders for due dates and invites?</p>
          <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white touch-target-sm"
              onClick={async () => {
                await Notification.requestPermission();
                dismiss("notification");
              }}
            >
              Enable
            </button>
            <button type="button" onClick={() => dismiss("notification")} className="px-3 py-1.5 text-sm text-slate-500 touch-target-sm">
              Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeId === "pwa") {
    const ios = isIosDevice();
    const canPrompt = Boolean(deferredPrompt);
    return (
      <div className="app-container py-2">
        <div className="p-3 rounded-xl app-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {ios
              ? "Add Foci to your Home Screen for one-tap access and offline use."
              : "Install Foci for offline access and a home-screen icon."}
          </p>
          <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 touch-target-sm"
              onClick={async () => {
                if (canPrompt && deferredPrompt) {
                  await deferredPrompt.prompt();
                  await deferredPrompt.userChoice;
                  consumeDeferredInstallPrompt();
                  setDeferredPrompt(null);
                  dismiss("pwa");
                  return;
                }
                openPwaInstallGuide();
                dismiss("pwa");
              }}
            >
              {ios ? "How to add" : canPrompt ? "Install" : "Add to Home Screen"}
            </button>
            <button type="button" onClick={() => dismiss("pwa")} className="px-3 py-1.5 text-sm text-slate-500 touch-target-sm">
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
