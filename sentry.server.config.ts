// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://76fd9a70e5359a186f57e641d2ad2256@o4510225187012608.ingest.us.sentry.io/4511367785283584",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Filter out known transient errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out Supabase lock conflicts - these are transient multi-tab issues
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'AbortError' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.includes('Lock broken')
    ) {
      return null; // Don't send to Sentry
    }
    
    return event;
  },
});
