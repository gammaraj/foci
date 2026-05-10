# Sentry Integration Setup

This project uses [Sentry](https://sentry.io/) for error monitoring and performance tracking.

## Configuration

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io/) and create an account (or log in)
2. Create a new project and select **Next.js** as the platform
3. Note down your DSN (Data Source Name)

### 2. Set Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Sentry credentials:

```bash
cp .env.local.example .env.local
```

Then update these variables:

- `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN (found in Project Settings → Client Keys)
- `SENTRY_ORG`: Your Sentry organization slug
- `SENTRY_PROJECT`: Your Sentry project slug
- `SENTRY_AUTH_TOKEN`: Authentication token for uploading source maps (optional for development)

### 3. Generate Auth Token (Optional - for Source Maps)

To upload source maps for better error tracking in production:

1. Go to Sentry → Settings → Auth Tokens
2. Create a new token with `project:releases` and `org:read` scopes
3. Add it to your `.env.local` as `SENTRY_AUTH_TOKEN`

## Features Enabled

- ✅ Client-side error tracking
- ✅ Server-side error tracking
- ✅ Edge runtime error tracking
- ✅ Session Replay (10% sample rate, 100% on errors)
- ✅ Performance monitoring (100% sample rate - adjust in production)
- ✅ Source map upload (in production builds)
- ✅ Ad-blocker bypass via `/monitoring` tunnel route
- ✅ Global error boundaries

## Testing

To test that Sentry is working:

1. Start the development server: `npm run dev`
2. Trigger a test error in your app
3. Check your Sentry dashboard for the error report

## Configuration Files

- `sentry.client.config.ts`: Client-side Sentry configuration
- `sentry.server.config.ts`: Server-side Sentry configuration
- `sentry.edge.config.ts`: Edge runtime Sentry configuration
- `instrumentation.ts`: Next.js instrumentation hook
- `src/app/error.tsx`: Page-level error boundary
- `src/app/global-error.tsx`: Global error boundary (layout errors)

## Adjusting Sample Rates

For production, consider adjusting these values in the config files:

```typescript
tracesSampleRate: 0.1, // 10% of transactions
replaysSessionSampleRate: 0.01, // 1% of sessions
replaysOnErrorSampleRate: 1.0, // 100% when errors occur
```

## Learn More

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Error Monitoring](https://docs.sentry.io/product/issues/)
- [Sentry Performance](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
