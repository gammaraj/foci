"use client";

import React, { useEffect, useState } from "react";

interface SessionCelebrationProps {
  show: boolean;
  goalMet: boolean;
  streak: number;
  onDismiss: () => void;
  onFeedback?: (rating: "focused" | "distracted" | "break-early") => void;
}

export default function SessionCelebration({
  show,
  goalMet,
  streak,
  onDismiss,
  onFeedback,
}: SessionCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 8000);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [show, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 safe-bottom left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-slide-up">
      <div className="rounded-2xl app-surface dark:bg-[#131d30] border-2 border-cyan-300 dark:border-cyan-600 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">{goalMet ? "🎉" : "✅"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white">
              {goalMet ? "Daily goal reached!" : "Session complete!"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              {streak > 0 ? `${streak}-day streak — keep it going.` : "Nice work. Take a break or start another session."}
            </p>
            {onFeedback && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {([
                  ["focused", "Focused"],
                  ["distracted", "Distracted"],
                  ["break-early", "Ended early"],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { onFeedback(id); onDismiss(); }}
                    className="px-2.5 py-1 text-xs font-medium rounded-full border border-slate-200 dark:border-[#243350] hover:bg-cyan-50 dark:hover:bg-cyan-900/30"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={onDismiss} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
