"use client";

import React, { useEffect, useState } from "react";
import {
  BOOSTLOGIK_DISMISS_KEY,
  boostLogikLinkLabel,
  boostLogikReturnUrl,
  type BoostLogikContext,
} from "@/lib/boostlogik-integration";
import { trackBoostLogikReturnClick } from "@/lib/analytics";

interface BoostLogikPromoProps {
  context: BoostLogikContext;
  className?: string;
}

export default function BoostLogikPromo({
  context,
  className = "",
}: BoostLogikPromoProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const href = boostLogikReturnUrl(context);
  const label = boostLogikLinkLabel(context);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(BOOSTLOGIK_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(BOOSTLOGIK_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (dismissed !== false) return null;

  return (
    <aside
      className={`relative rounded-xl border border-teal-200/80 dark:border-teal-900/50 bg-teal-50/60 dark:bg-teal-950/20 px-4 py-4 ${className}`}
      aria-label="Partner link: BoostLogik SEO workspace"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
        aria-label="Dismiss BoostLogik link"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <p className="app-section-label text-teal-600 dark:text-teal-400">
        Working on SEO from BoostLogik?
      </p>
      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100 text-base">
        Return to your project when your sprint ends
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        Pick up where you left off — audits, checklists, and SEO tools in BoostLogik.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() =>
          trackBoostLogikReturnClick({
            ref: context.ref,
            projectId: context.projectId,
            projectName: context.projectName,
            destination: href,
          })
        }
        className="inline-flex items-center mt-2.5 text-sm font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-200 transition-colors"
      >
        {label} →
      </a>
    </aside>
  );
}
