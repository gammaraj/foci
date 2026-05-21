import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { isAuthLockError } from "@/lib/supabase/auth-errors";

const isProd = process.env.NODE_ENV === "production";

export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ??
  process.env.SENTRY_DSN ??
  "https://76fd9a70e5359a186f57e641d2ad2256@o4510225187012608.ingest.us.sentry.io/4511367785283584";

export const sentryTracesSampleRate = isProd ? 0.1 : 1;
export const sentryReplaysSessionSampleRate = isProd ? 0.1 : 0.1;
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

export function sentryBeforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  if (isAuthLockError(hint.originalException)) {
    return null;
  }
  if (isServiceWorkerRegistrationNoise(hint.originalException)) {
    return null;
  }
  return event;
}
