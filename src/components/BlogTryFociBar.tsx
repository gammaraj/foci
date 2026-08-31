"use client";

import Link from "next/link";

/** Sticky guest-try CTA so blog visitors don’t have to scroll to the footer. */
export default function BlogTryFociBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[color:var(--surface-border)] dark:border-[#243350] bg-[color:var(--surface-elevated)]/95 dark:bg-[#0a0f1a]/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="app-container py-2.5 flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-2.5 sm:gap-3">
        <p className="min-w-0 text-sm text-slate-700 dark:text-slate-200 sm:truncate">
          <span className="font-semibold">Try Foci in your browser</span>
          <span className="hidden sm:inline"> — timer, tasks, and sounds. No account needed.</span>
        </p>
        <Link href="/app" className="btn-primary w-full min-[400px]:w-auto px-3.5 py-2 text-sm shrink-0 text-center">
          Open the app
        </Link>
      </div>
    </div>
  );
}
