"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
        <p className="mb-6 text-gray-600">
          We've been notified and will fix this as soon as possible.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
