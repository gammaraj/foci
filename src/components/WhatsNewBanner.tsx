"use client";

import { useEffect, useState } from "react";
import {
  WHATS_NEW_FEATURES,
  WHATS_NEW_VERSION,
  WHATS_NEW_SHOW_EVENT,
  hasSeenWhatsNew,
  markWhatsNewSeen,
  startFeatureTour,
} from "@/lib/whats-new";

interface WhatsNewBannerProps {
  focusMode?: boolean;
}

export default function WhatsNewBanner({ focusMode }: WhatsNewBannerProps) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (focusMode) {
      setVisible(false);
      return;
    }
    if (!hasSeenWhatsNew()) setVisible(true);
  }, [focusMode]);

  useEffect(() => {
    const show = () => {
      setVisible(true);
      setExpanded(true);
    };
    window.addEventListener(WHATS_NEW_SHOW_EVENT, show);
    return () => window.removeEventListener(WHATS_NEW_SHOW_EVENT, show);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    markWhatsNewSeen();
    setVisible(false);
  };

  const handleTour = () => {
    startFeatureTour();
  };

  return (
    <div className="px-2 sm:px-4 pt-2">
      <div
        className="max-w-[1280px] mx-auto rounded-xl border border-violet-200/80 dark:border-violet-800/50 bg-gradient-to-r from-violet-50/90 to-indigo-50/80 dark:from-violet-950/30 dark:to-indigo-950/20 overflow-hidden"
        role="region"
        aria-label="Recently updated features"
      >
        <div className="flex items-start gap-3 px-3 sm:px-4 py-3">
          <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden>
            ✨
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-left min-w-0 group"
                aria-expanded={expanded}
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  What&apos;s new
                  <span className="ml-2 text-xs font-normal text-violet-600 dark:text-violet-300">
                    {WHATS_NEW_VERSION}
                  </span>
                </p>
                {!expanded && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {WHATS_NEW_FEATURES.length} recent updates — tap to expand
                  </p>
                )}
              </button>
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {expanded && (
              <ul className="mt-2 space-y-1.5">
                {WHATS_NEW_FEATURES.map((feature) => (
                  <li key={feature.title} className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{feature.title}</span>
                    <span className="text-slate-500 dark:text-slate-400"> — {feature.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-3 sm:px-4 py-2 border-t border-violet-100/80 dark:border-violet-900/40 bg-white/40 dark:bg-black/10">
          <button
            type="button"
            onClick={handleTour}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors touch-target-sm"
          >
            Take a tour
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 touch-target-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
