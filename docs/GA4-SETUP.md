# Google Analytics 4 — Foci

Use this checklist when GA4 reports look wrong (referral inflation, duplicate page titles, preview noise), and for **portfolio traffic pulls** via the Data API.

## Measurement vs property ID

| Kind | Example | Where |
|------|---------|--------|
| Measurement ID (browser tag) | `G-726NCC1ECK` | `NEXT_PUBLIC_GA_MEASUREMENT_ID` on Vercel |
| Property ID (Data API) | `528505183` | `GA4_PROPERTY_ID` on Vercel Production + local `.env.local` |

Pull report creds: `vercel env pull .env.local --environment=production` (includes shared Filantus GA service account + property id). Then `npm run report:ga`.

## Portfolio / 30-day report (Data API)

```bash
# .env.local needs GA4_PROPERTY_ID + GA_CLIENT_EMAIL + GA_PRIVATE_KEY
# (or GOOGLE_APPLICATION_CREDENTIALS_JSON). Grant the service account Viewer on the Foci property.
npm run report:ga
```

Script: `scripts/ga-report.mjs`. Paste active-user counts into `docs/PORTFOLIO.md` (and the canonical [filantus PORTFOLIO](https://github.com/gammaraj/filantus)).

## Referral traffic looks too high

OAuth and partner redirects often count as **Referral**, not Direct.

In GA4: **Admin → Data collection → Data streams → [Foci web] → Configure tag settings → Show all → List unwanted referrals**, add:

- `accounts.google.com`
- `supabase.co`
- `github.com` (if you test via GitHub links)
- `vercel.app` (preview deployments)

Save, then re-run reports after 24–48h.

The site also ignores these **in the browser** so they never become the first-touch source:

- OAuth/backend referrers: `accounts.google.com`, `supabase.co` (`ignore_referrer` on the GA config)
- Self campaign tokens: `utm_source` / `ref` of `foci`, `foci-header`, `foci-footer`, `foci-app` — stripped from the URL before the first `gtag('config')` page_view

Admin unwanted-referrals is still recommended as a belt-and-suspenders filter for older hits.

See `src/lib/ga-attribution.ts` and the bootstrap script in `src/app/layout.tsx`.

## Unassigned channel

Usually `(not set)` attribution from:

- Cross-domain login without linker
- iOS / strict privacy browsers
- Sessions without a clear first-user source

Mitigations: keep canonical host on `usefoci.com`, avoid testing production GA from preview URLs, and use UTM on external campaigns (`utm_source`, `utm_medium`).

## Duplicate page titles (`… – Foci – Foci`)

Caused by the root layout `title.template` plus child titles that already included ` – Foci`. Child routes now use `absolutePageTitle()` from `src/lib/site-metadata.ts`.

## Preview / localhost traffic

The site skips GA on `localhost` and `*.vercel.app` in the client bootstrap script. Production measurement ID should only run on `usefoci.com`.

## Key events

Mark these as key events in GA4 (**Admin → Events → mark as key event**):

- `session_complete`
- `timer_start`
- `sign_up`
- `login`
- `invite_sent`
- `collaborator_added`
- `shared_project_opened`
- `stats_viewed`

## Monetization-signal events (shipped)

| Event | When |
|-------|------|
| `share_modal_opened` | Project or account share modal opens (`scope`) |
| `invite_sent` | Invite saved (`scope`, `role`) |
| `collaborator_added` | Invite accepted (`scope`) |
| `shared_project_opened` | User opens a shared project |
| `stats_viewed` | `/stats` loaded / range toggled (`range_days`) |
| `pricing_viewed` | Ready for `/pricing` (call when page exists) |
| `upgrade_clicked` | Ready for upgrade CTAs (`source`) |

## Reports snapshot (May 7 – Jun 3, 2026)

Healthy signals from the export:

- Strong timer usage (`timer_start` 572, `session_complete` 459)
- Task engagement (`task_completed` 228, `task_added` 189)
- `/app` is the primary surface (778 views)

Watch:

- Referral vs Direct ratio after unwanted-referral exclusions
- Day-17 spike (43 users) — check if a campaign or bot; filter internal/test IPs in GA4 if needed
- Organic Search growth — continue blog internal links from `/app` and homepage
