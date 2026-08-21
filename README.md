# Foci

Free focus app: Pomodoro timer, tasks, Smart Plan, ambient sounds, and streak stats. Production site: [usefoci.com](https://usefoci.com).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Supabase** — auth, Postgres, RLS
- **Tailwind CSS 4**
- **Sentry** — error monitoring
- **Vercel** — hosting

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase CLI (for migrations): `npx supabase`

## Setup

```bash
git clone <repo-url>
cd foci
npm ci
cp .env.local.example .env.local
# Fill in Supabase + optional Sentry, GA, IndexNow, Upstash values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works without login (localStorage); sign in to sync via Supabase.

## Environment variables

See [`.env.local.example`](.env.local.example):

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Prod | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod | Supabase anon key |
| `NEXT_PUBLIC_SENTRY_DSN` | Prod | Client error reporting |
| `INDEXNOW_API_SECRET` | Prod | Protects `/api/indexnow` |
| `UPSTASH_REDIS_REST_URL` | Recommended | Distributed rate limiting across Vercel instances |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Upstash token |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics browser tag (`G-…`) |
| `GA4_PROPERTY_ID` | Local only | Numeric GA4 property for `npm run report:ga` |
| `GA_CLIENT_EMAIL` / `GA_PRIVATE_KEY` | Local only | Service account with Viewer on the Foci property |

Without Upstash, rate limiting falls back to in-memory (per serverless instance).
Portfolio traffic: see `docs/GA4-SETUP.md` and `npm run report:ga`.

## Database migrations

```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

RLS policy reference: [`docs/RLS_POLICY_MATRIX.md`](docs/RLS_POLICY_MATRIX.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest unit tests |
| `npm run test` | Playwright E2E tests |
| `npm run check:content-integrity` | SEO/sitemap/llms sync validation |
| `npm run check:ci` | Full CI check locally |

## Testing

```bash
npm run test:unit          # fast — smartplan, parsers, dates, timer utils
npm run test               # E2E — starts built app on :3000
npx playwright test --ui   # interactive E2E
```

## Project structure

```
src/
  app/           # Next.js routes (/, /app, /blog, /stats, API)
  components/    # UI (TaskList, timer, settings, …)
  hooks/         # useTimer
  lib/           # storage adapters, smartplan, SEO, Supabase client
supabase/        # migrations + config
tests/           # Playwright E2E + Vitest unit tests
content/posts/   # MDX blog posts
docs/            # Architecture & ops docs
```

## Uptime monitoring

`GET /api/health` probes Supabase **PostgREST** (the same REST path Foci uses for tasks). It retries briefly on transient failures, then returns `200` when healthy or `503` when PostgREST / the DB path is still failing.

```bash
curl -s https://usefoci.com/api/health | jq
```

Example alert setup (UptimeRobot, Better Stack, Checkly, etc.):

| Setting | Value |
|---------|--------|
| URL | `https://usefoci.com/api/health` |
| Interval | 5 minutes |
| Alert when | HTTP status is not `200` for **2–3 consecutive checks** (avoids paging on a single blip) |
| Also useful | Response body contains `"status":"degraded"` |

`HEAD /api/health` is supported for monitors that only check status codes.

## Supabase keep-alive

Free-tier Supabase pauses after ~7 days without DB traffic. Foci prevents that with:

1. **Vercel cron** — `GET /api/keep-alive` daily at 12:00 UTC (`vercel.json`)
2. **GitHub Actions** — same endpoint twice daily (01:00 and 13:00 UTC)

Both require `CRON_SECRET` in **Vercel** (Production) and **GitHub Actions** secrets (same value). Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when that env var is set.

## Deployment

Push to `main` → Vercel deploy + GitHub Actions CI (build, audit, lint, unit + E2E tests, content integrity).

Ensure production env vars are set in Vercel (`CRON_SECRET`, `INDEXNOW_API_SECRET`, and Upstash for rate limits).

## Docs

- [Collaboration architecture](docs/COLLABORATION_ARCHITECTURE.md)
- [RLS policy matrix](docs/RLS_POLICY_MATRIX.md)
- [IndexNow setup](docs/INDEXNOW.md)
- [Sentry setup](SENTRY_SETUP.md)
