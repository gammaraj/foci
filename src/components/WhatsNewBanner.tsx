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
  const [expanded, setExpanded] = useState(false);

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

  return (
    <div className="px-2 sm:px-4 pt-1.5">
      <div
        className="max-w-[1280px] mx-auto rounded-lg border border-violet-200/70 dark:border-violet-800/45 bg-gradient-to-r from-violet-50/90 to-indigo-50/80 dark:from-violet-950/25 dark:to-indigo-950/15 overflow-hidden"
        role="region"
        aria-label="Recently updated features"
      >
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[36px]">
          <span className="text-sm flex-shrink-0" aria-hidden>
            ✨
          </span>

          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex-1 min-w-0 text-left flex items-center gap-1.5"
            aria-expanded={expanded}
          >
            <span className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
              What&apos;s new
            </span>
            <span className="text-xs text-violet-600 dark:text-violet-300 whitespace-nowrap">
              {WHATS_NEW_VERSION}
            </span>
            {!expanded && (
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                · {WHATS_NEW_FEATURES.length} updates
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={startFeatureTour}
              className="px-2 py-1 text-xs font-semibold rounded-md bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              Tour
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={expanded ? "Collapse details" : "Expand details"}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {expanded && (
          <ul className="px-3 pb-2 pt-0 space-y-1 border-t border-violet-100/60 dark:border-violet-900/35">
            {WHATS_NEW_FEATURES.map((feature) => (
              <li key={feature.title} className="text-xs text-slate-600 dark:text-slate-300 leading-snug pt-1.5 first:pt-2">
                <span className="font-medium text-slate-800 dark:text-slate-100">{feature.title}</span>
                <span className="text-slate-500 dark:text-slate-400"> — {feature.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
