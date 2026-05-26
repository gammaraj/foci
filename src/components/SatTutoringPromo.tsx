"use client";

import React, { useEffect, useState } from "react";
import { SAT_TUTORING_DISMISS_KEY, SAT_TUTORING_URL } from "@/lib/partner-promos";

interface SatTutoringPromoProps {
  variant?: "sidebar" | "inline" | "footer";
  className?: string;
}

export default function SatTutoringPromo({
  variant = "sidebar",
  className = "",
}: SatTutoringPromoProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(SAT_TUTORING_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(SAT_TUTORING_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (variant !== "footer" && dismissed !== false) return null;

  if (variant === "footer") {
    return (
      <p className={`text-xs text-slate-400 dark:text-slate-500 ${className}`}>
        Prepping for the SAT?{" "}
        <a
          href={SAT_TUTORING_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline"
        >
          Digital SAT tutoring from a 1590 scorer
        </a>
        {" "}· College Decider
      </p>
    );
  }

  const card = (
    <>
      <p className="app-section-label text-violet-600 dark:text-violet-400">
        Prepping for the SAT?
      </p>
      <p className={`mt-1 font-semibold text-slate-800 dark:text-slate-100 ${variant === "inline" ? "text-base" : "text-sm sm:text-base"}`}>
        1-on-1 Digital SAT tutoring
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        Work with a 1590 scorer heading to Johns Hopkins. From $75/hr · free 15-min consult.
      </p>
      <a
        href={SAT_TUTORING_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-flex items-center mt-2.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-200 transition-colors"
      >
        Learn more at College Decider →
      </a>
    </>
  );

  if (variant === "inline") {
    return (
      <aside
        className={`relative rounded-xl border border-violet-200/80 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/20 px-4 py-4 ${className}`}
        aria-label="Partner offer: SAT tutoring"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
          aria-label="Dismiss SAT tutoring offer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {card}
      </aside>
    );
  }

  return (
    <aside
      className={`relative mx-3 mb-3 rounded-xl border border-violet-200/80 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/20 px-3 py-3 ${className}`}
      aria-label="Partner offer: SAT tutoring"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
        aria-label="Dismiss SAT tutoring offer"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {card}
    </aside>
  );
}
