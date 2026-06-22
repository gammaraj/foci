"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { loadTasks } from "@/lib/storage";

type MessageId = "signup" | "first-session" | "notification" | "pwa";

// "notification" hidden until invite push reminders are implemented (due-date only is partial)
const PRIORITY: MessageId[] = ["signup", "first-session", "pwa"];

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface AppMessageQueueProps {
  user: { id: string } | null;
  focusMode?: boolean;
}

export default function AppMessageQueue({ user, focusMode }: AppMessageQueueProps) {
  const [activeId, setActiveId] = useState<MessageId | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<Set<MessageId>>(() => new Set());

  const dismiss = useCallback((id: MessageId) => {
    setDismissed((prev) => new Set(prev).add(id));
    if (id === "signup") sessionStorage.setItem("foci_signup_dismissed", "1");
    if (id === "first-session") {
      localStorage.setItem("foci_first_session_nudge_dismissed", "1");
      localStorage.setItem("foci_sessions_completed", "1");
    }
    if (id === "notification") sessionStorage.setItem("foci_notif_dismissed", "1");
    if (id === "pwa") localStorage.setItem("foci_pwa_dismissed", "1");
  }, []);

  useEffect(() => {
    if (focusMode) {
      setActiveId(null);
      return;
    }

    const evaluate = async () => {
      for (const id of PRIORITY) {
        if (dismissed.has(id)) continue;

        if (id === "signup") {
          if (!user && !sessionStorage.getItem("foci_signup_dismissed")) {
            setActiveId("signup");
            return;
          }
        }

        if (id === "first-session") {
          const dismissedLocal =
            localStorage.getItem("foci_first_session_nudge_dismissed") ||
            localStorage.getItem("tempo_first_session_nudge_dismissed");
          if (dismissedLocal) continue;
          if (localStorage.getItem("foci_sessions_completed")) continue;
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

        if (id === "notification") {
          if (typeof window === "undefined" || !("Notification" in window)) continue;
          if (Notification.permission !== "default") continue;
          if (sessionStorage.getItem("foci_notif_dismissed")) continue;
          setActiveId("notification");
          return;
        }

        if (id === "pwa") {
          if (localStorage.getItem("foci_pwa_dismissed")) continue;
          if (!deferredPrompt) continue;
          setActiveId("pwa");
          return;
        }
      }
      setActiveId(null);
    };

    evaluate();
  }, [user, dismissed, deferredPrompt, focusMode]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!activeId) return null;

  if (activeId === "signup") {
    return (
      <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-sm">
        <div className="app-container py-2 flex items-center justify-between gap-3">
          <p className="flex-1 min-w-0">
            <span className="font-medium">Sign up free</span>
            <span className="hidden sm:inline"> — sync tasks across devices</span>
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/login" className="px-3 py-1.5 bg-white text-cyan-700 font-semibold rounded-lg text-sm hover:bg-cyan-50">
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
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-50 to-indigo-50 dark:from-cyan-900/25 dark:to-indigo-900/25 border border-cyan-200 dark:border-cyan-800 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Ready to start focusing?</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">Add a task, tap Play, and run your first Pomodoro session.</p>
          </div>
          <button type="button" onClick={() => dismiss("first-session")} className="text-sm text-cyan-600 dark:text-cyan-400 font-medium touch-target-sm px-2" aria-label="Dismiss">
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
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-cyan-600 text-white touch-target-sm"
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

  if (activeId === "pwa" && deferredPrompt) {
    return (
      <div className="app-container py-2">
        <div className="p-3 rounded-xl app-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-700 dark:text-slate-200">Install Foci for offline access and a home-screen icon.</p>
          <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 touch-target-sm"
              onClick={async () => {
                await deferredPrompt.prompt();
                dismiss("pwa");
                setDeferredPrompt(null);
              }}
            >
              Install
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
