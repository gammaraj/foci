import * as Sentry from "@sentry/nextjs";
import {
  SENTRY_DSN,
  sentryBeforeSend,
  sentrySendDefaultPii,
  sentryTracesSampleRate,
} from "./src/lib/sentry-options";

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: sentryTracesSampleRate,
  enableLogs: true,
  sendDefaultPii: sentrySendDefaultPii,
  beforeSend: sentryBeforeSend,
});
