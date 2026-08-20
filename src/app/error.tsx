"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { BusyBeaver } from "@/components/BusyBeaver";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] px-4">
      <div className="max-w-md text-center">
        <BusyBeaver
          alt="Busy the Beaver looking concerned"
          size={140}
          className="mx-auto mb-5"
          priority
        />
        <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
          Busy lost focus for a second
        </h2>
        <p className="mb-6 text-slate-600 dark:text-slate-400">
          We&apos;ve been notified and will fix this as soon as possible.
        </p>
        <button
          onClick={() => reset()}
          className="btn-primary px-6 py-3"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
