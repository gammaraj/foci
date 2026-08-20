"use client";

import { useEffect, useRef, useState } from "react";
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
  /** When true, renders no trigger button — only handles the WHATS_NEW_SHOW_EVENT and renders the panel. */
  headless?: boolean;
}

/** Navbar sparkle — badge when unseen; opens a drawer instead of blocking the task workflow. */
export default function WhatsNewBanner({ focusMode, headless }: WhatsNewBannerProps) {
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusMode) {
      setOpen(false);
      return;
    }
    setUnseen(!hasSeenWhatsNew());
  }, [focusMode]);

  useEffect(() => {
    const show = () => {
      setOpen(true);
      setUnseen(!hasSeenWhatsNew());
    };
    window.addEventListener(WHATS_NEW_SHOW_EVENT, show);
    return () => window.removeEventListener(WHATS_NEW_SHOW_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const dismiss = () => {
    markWhatsNewSeen();
    setUnseen(false);
    setOpen(false);
  };

  if (focusMode) return null;

  return (
    <div className="relative" ref={panelRef}>
      {!headless && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="relative nav-icon-btn p-2 rounded-full hover:!text-blue-400"
          aria-label={unseen ? "What's new — unread updates" : "What's new"}
          aria-expanded={open}
          title="What's new"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          {unseen && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#0b1121]" />
          )}
        </button>
      )}

      {open && (
        <div
          className="fixed left-4 right-4 top-14 z-50 max-w-sm mx-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:mx-0 sm:w-80 w-auto rounded-xl border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="What's new"
        >
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-[#243350] bg-blue-50/70 dark:bg-blue-950/20">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">What&apos;s new</p>
                <p className="text-xs text-blue-600 dark:text-blue-300">{WHATS_NEW_VERSION}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <ul className="px-3 py-2 space-y-2 max-h-[min(50vh,280px)] overflow-y-auto">
            {WHATS_NEW_FEATURES.map((feature) => (
              <li key={feature.title} className="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                <span className="font-medium text-slate-800 dark:text-slate-100">{feature.title}</span>
                <span className="text-slate-500 dark:text-slate-400"> — {feature.description}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 dark:border-[#243350]">
            <button
              type="button"
              onClick={() => {
                startFeatureTour();
                setOpen(false);
              }}
              className="btn-primary flex-1 px-2.5 py-1.5 text-sm"
            >
              Take the tour
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="btn-ghost px-2.5 py-1.5 text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
