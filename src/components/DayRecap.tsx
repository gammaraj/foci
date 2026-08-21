"use client";

import React, { useEffect, useState } from "react";
import { BusyBeaver } from "@/components/BusyBeaver";
import { formatDuration } from "@/components/task-list/utils";
import type { DoneTodaySummary } from "@/lib/done-today";

interface DayRecapProps {
  show: boolean;
  summary: DoneTodaySummary;
  onDismiss: () => void;
}

export default function DayRecap({ show, summary, onDismiss }: DayRecapProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 9000);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [show, onDismiss]);

  if (!visible || summary.count === 0) return null;

  const parts: string[] = [`${summary.count} task${summary.count === 1 ? "" : "s"}`];
  if (summary.sessions > 0) {
    parts.push(`${summary.sessions} session${summary.sessions === 1 ? "" : "s"}`);
  }
  if (summary.timeSpent > 0) {
    parts.push(`${formatDuration(summary.timeSpent)} focus`);
  }

  return (
    <div className="fixed bottom-4 safe-bottom left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-slide-up">
      <div className="rounded-2xl app-surface dark:bg-[#131d30] border-2 border-emerald-300 dark:border-emerald-700 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <BusyBeaver alt="" size={44} className="flex-shrink-0 -mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Beavy’s proud of today’s dam
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{parts.join(" · ")}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
