// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  SENTRY_DSN,
  sentryBeforeSend,
  sentryReplaysOnErrorSampleRate,
  sentryReplaysSessionSampleRate,
  sentrySendDefaultPii,
  sentryTracesSampleRate,
} from "@/lib/sentry-options";

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: sentryTracesSampleRate,
  enableLogs: true,
  replaysSessionSampleRate: sentryReplaysSessionSampleRate,
  replaysOnErrorSampleRate: sentryReplaysOnErrorSampleRate,
  sendDefaultPii: sentrySendDefaultPii,
  beforeSend: sentryBeforeSend,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
