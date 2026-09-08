import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { isAuthLockError } from "@/lib/supabase/auth-errors";

const isProd = process.env.NODE_ENV === "production";

export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? undefined;

export const sentryTracesSampleRate = isProd ? 0.1 : 1;
/** Session replay is off in production so task titles are not recorded. */
export const sentryReplaysSessionSampleRate = 0;
export const sentryReplaysOnErrorSampleRate = isProd ? 0.1 : 1;
export const sentrySendDefaultPii = !isProd;

function isServiceWorkerRegistrationNoise(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  if (msg !== "rejected" && !msg.includes("serviceworker")) return false;
  const stack = error.stack ?? "";
  return (
    stack.includes("serviceWorker.register") ||
    stack.includes("serviceWorkers.navigator")
  );
}

function causedBy(error: unknown): unknown {
  if (error instanceof Error) return error.cause;
  return undefined;
}

export function sentryBeforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  const original = hint.originalException;
  if (isAuthLockError(original) || isAuthLockError(causedBy(original))) {
    return null;
  }
  if (isServiceWorkerRegistrationNoise(original) || isServiceWorkerRegistrationNoise(causedBy(original))) {
    return null;
  }
  return event;
}
