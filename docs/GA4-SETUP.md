# Google Analytics 4 — Foci

Use this checklist when GA4 reports look wrong (referral inflation, duplicate page titles, preview noise).

## Referral traffic looks too high

OAuth and partner redirects often count as **Referral**, not Direct.

In GA4: **Admin → Data collection → Data streams → [Foci web] → Configure tag settings → Show all → List unwanted referrals**, add:

- `accounts.google.com`
- `supabase.co`
- `github.com` (if you test via GitHub links)
- `vercel.app` (preview deployments)

Save, then re-run reports after 24–48h.

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

Mark these as key events in GA4 if you want funnels:

- `session_complete`
- `timer_start`
- `sign_up`

## Reports snapshot (May 7 – Jun 3, 2026)

Healthy signals from the export:

- Strong timer usage (`timer_start` 572, `session_complete` 459)
- Task engagement (`task_completed` 228, `task_added` 189)
- `/app` is the primary surface (778 views)

Watch:

- Referral vs Direct ratio after unwanted-referral exclusions
- Day-17 spike (43 users) — check if a campaign or bot; filter internal/test IPs in GA4 if needed
- Organic Search growth — continue blog internal links from `/app` and homepage
