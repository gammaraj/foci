"use client";

import { useState, useEffect } from "react";

export default function FirstSessionNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if user has never dismissed and has no completed sessions
    const dismissed = localStorage.getItem("foci_first_session_nudge_dismissed");
    const hasCompletedSession = localStorage.getItem("foci_sessions_completed");
    
    if (!dismissed && !hasCompletedSession) {
      // Delay to let user see the interface first
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("foci_first_session_nudge_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="text-2xl">👋</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Ready to start focusing?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            Select a task below and click the <strong>Start</strong> button to begin your first focus session!
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your work time will be tracked per task</span>
          </div>
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
