import * as Sentry from "@sentry/nextjs";

export type ReportErrorContext = Record<string, unknown>;

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

/**
 * Log an application error to the console and Sentry.
 * Filtered noise (auth lock conflicts, SW registration, etc.) is dropped in sentryBeforeSend.
 */
export function reportError(
  message: string,
  error?: unknown,
  context?: ReportErrorContext,
): void {
  if (error !== undefined) {
    console.error(`[Foci] ${message}:`, error, context ?? "");
  } else if (context && Object.keys(context).length > 0) {
    console.error(`[Foci] ${message}`, context);
  } else {
    console.error(`[Foci] ${message}`);
  }

  const exception = error !== undefined ? toError(error) : new Error(message);
  Sentry.captureException(exception, {
    extra: {
      message,
      ...(context ?? {}),
      ...(error !== undefined && !(error instanceof Error) ? { originalError: error } : {}),
    },
  });
}
