"use client";

import React, { useEffect, useState } from "react";
import {
  CERTSTUD_DISMISS_KEY,
  certStudLinkLabel,
  certStudPracticeUrl,
  type CertStudContext,
} from "@/lib/certstud-integration";
import { trackCertStudReturnClick } from "@/lib/analytics";

interface CertStudStudyPromoProps {
  context: CertStudContext;
  className?: string;
}

export default function CertStudStudyPromo({
  context,
  className = "",
}: CertStudStudyPromoProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const href = certStudPracticeUrl(context);
  const label = certStudLinkLabel(context);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(CERTSTUD_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(CERTSTUD_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (dismissed !== false) return null;

  return (
    <aside
      className={`relative rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-4 ${className}`}
      aria-label="Partner link: CertStud certification practice"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
        aria-label="Dismiss CertStud link"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <p className="app-section-label text-emerald-600 dark:text-emerald-400">
        Studying for a certification?
      </p>
      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100 text-base">
        Pair focus sprints with CertStud practice
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        Return to free practice questions, explanations, and exam simulators when your timer ends.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() =>
          trackCertStudReturnClick({
            ref: context.ref,
            certId: context.certId,
            certCode: context.certCode,
            destination: href,
          })
        }
        className="inline-flex items-center mt-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors"
      >
        {label} →
      </a>
    </aside>
  );
}
