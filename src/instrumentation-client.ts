// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  SENTRY_DSN,
  sentryBeforeSend,
  sentryReplaysSessionSampleRate,
  sentrySendDefaultPii,
  sentryTracesSampleRate,
} from "@/lib/sentry-options";

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: sentryTracesSampleRate,
  enableLogs: true,
  replaysSessionSampleRate: sentryReplaysSessionSampleRate,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: sentrySendDefaultPii,
  beforeSend: sentryBeforeSend,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
