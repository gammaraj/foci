"use client";

import { useState, useEffect } from "react";
import { loadTasks } from "@/lib/storage";
import { FociDot } from "@/components/FociDot";

export default function FirstSessionNudge() {
  const [show, setShow] = useState(false);
  const DISMISS_KEYS = ["foci_first_session_nudge_dismissed", "tempo_first_session_nudge_dismissed"] as const;

  useEffect(() => {
    let cancelled = false;

    const evaluateVisibility = async () => {
      const dismissed = DISMISS_KEYS.some((key) => localStorage.getItem(key));
      if (dismissed) {
        if (!cancelled) setShow(false);
        return;
      }

      const hasCompletedSession = localStorage.getItem("foci_sessions_completed") || localStorage.getItem("tempo_sessions_completed");
      if (hasCompletedSession) {
        DISMISS_KEYS.forEach((key) => localStorage.setItem(key, "1"));
        if (!cancelled) setShow(false);
        return;
      }

      try {
        const tasks = await loadTasks();
        const hasHistoricalActivity = tasks.some((t) => t.completed || (t.sessions || 0) > 0 || (t.timeSpent || 0) > 0);
        if (hasHistoricalActivity) {
          DISMISS_KEYS.forEach((key) => localStorage.setItem(key, "1"));
          if (!cancelled) setShow(false);
          return;
        }
      } catch {
        // Ignore storage read errors and fall back to showing the nudge.
      }

      if (!cancelled) setShow(true);
    };

    evaluateVisibility();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    DISMISS_KEYS.forEach((key) => localStorage.setItem(key, "1"));
  };

  if (!show) return null;

  return (
    <div className="mb-3 p-2.5 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <FociDot mood="ready" size={32} className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
            Ready to start focusing?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Pick a task and press <strong>Start</strong> — Beavy’s waiting for your first session.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
