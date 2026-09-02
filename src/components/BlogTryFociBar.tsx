"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";

/** Sticky guest-try CTA so blog visitors don’t have to scroll to the footer. */
export default function BlogTryFociBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-surface-border dark:border-surface-border bg-surface-elevated/95 dark:bg-page/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="app-container py-2.5 flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-2.5 sm:gap-3">
        <p className="min-w-0 text-sm text-slate-700 dark:text-slate-200 sm:truncate">
          <span className="font-semibold">Try Foci in your browser</span>
          <span className="hidden sm:inline"> — timer, tasks, and sounds. No account needed.</span>
        </p>
        <ButtonLink href="/app" size="md" className="w-full min-[400px]:w-auto shrink-0 text-center">
          Open the app
        </ButtonLink>
      </div>
    </div>
  );
}
