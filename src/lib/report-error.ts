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
 * Always capture a wrapper named after the Foci message — raw AbortError /
 * "Failed to fetch" / "Load failed" events are dropped by Sentry defaults
 * and inbound filters, which hid mobile save failures.
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

  const original = error !== undefined ? toError(error) : undefined;
  const exception =
    original && original.message === message
      ? original
      : new Error(message, original ? { cause: original } : undefined);

  Sentry.captureException(exception, {
    extra: {
      message,
      ...(context ?? {}),
      ...(original && original !== exception
        ? { originalErrorName: original.name, originalErrorMessage: original.message }
        : {}),
      ...(error !== undefined && !(error instanceof Error) ? { originalError: error } : {}),
    },
  });
}
