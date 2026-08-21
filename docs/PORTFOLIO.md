# Filantus portfolio — ops & business snapshot

**Snapshot date:** 2026-08-06  
**Sources:** Local repos under `~/Projects`, production env configs (secrets omitted), live Stripe API, GA4 Data API where credentials exist.

Canonical copy lives in [gammaraj/filantus](https://github.com/gammaraj/filantus). Product repos may mirror this file under `docs/PORTFOLIO.md`.

---

## Live metrics (as of 2026-08-06)

| Project | Stripe | Active subs | Approx MRR | 30d revenue | GA4 30d users | GA4 7d users |
|---------|--------|-------------|------------|-------------|---------------|--------------|
| **Brakto** | Live `acct_…49hr5` | 0 | $0 (one-time model) | **$973** PI succeeded ($933 charges) | **5,527** | 1,559 |
| **CertStud** | Live `acct_…Qn385` | **58** | **~$806** | **$1,194** paid invoices | **6,849** | 2,549 |
| **CollegeDecider** | Live `acct_…IOFK1` | **2** (+2 trialing) | **~$8** | $0 (90d: $147) | **1,111** | 248 |
| **Foci** | — | — | — | — | **563** (as of 2026-08-21) | **156** |
| **BoostLogik** | — | — | — | — | Measurement ID only | — |

### Stripe balances (available / pending USD)

| Project | Available | Pending |
|---------|-----------|---------|
| Brakto | $110.59 | -$2.62 |
| CertStud | $235.90 | $199.11 |
| CollegeDecider | $0.00 | $0.00 |

### Traffic detail (GA4, last 30 days)

| Project | Property | Sessions | Page views | Avg session | Bounce | Engaged sessions |
|---------|----------|----------|------------|-------------|--------|------------------|
| Brakto | `484284426` / `G-ZJ9DR72461` | 9,359 | 66,257 | 421s | 29.8% | 6,569 |
| CertStud | `490132129` | 10,291 | 49,096 | 602s | 20.4% | 8,193 |
| CollegeDecider | `491223614` / `G-6Q1P5MPZXY` | 2,379 | 4,738 | 109s | 28.4% | 1,703 |
| Foci | `528505183` / `G-726NCC1ECK` | 947 | 3,258 | 356s | 53.7% | 438 |
| BoostLogik | — / `G-V7N2WFJVLY` | API creds not in env | | | | |

### CertStud active subscription mix (live)

Notable price buckets among 58 actives (legacy + current catalog coexist):

- ~21 × $14.99/mo, ~9 × $19/mo, smaller counts at $24.99–$69.99/mo  
- Annual / All Access variants ($89.99–$129.99/yr and named All Access Annual $99/yr ×6, etc.)

### CollegeDecider live pricing truth

- **Active:** 2 × Premium Yearly at **$49/year**  
- **Trialing:** 2  
- Code still documents `$14.99 / $39.99 / $99.99`; vision doc cites `$19/mo`. **Treat Stripe live prices as source of truth.**

---

## At a glance — infrastructure

| Project | Status | DB | Email | Hosting | Payments | Auth |
|---------|--------|----|-------|---------|----------|------|
| Brakto | Live / paid | Supabase PG + Prisma | AWS SES | Vercel · brakto.com | Stripe + Connect | Clerk |
| CertStud | Live / paid | Supabase PG + Prisma | AWS SES | Vercel · certstud.com | Stripe (+ Clerk Billing IDs) | Clerk |
| CollegeDecider | Live / growth-gated | Supabase PG + Prisma | AWS SES | Vercel · collegedecider.com | Stripe Premium | Clerk |
| Foci | Live / free | Supabase PG + Auth/RLS | Supabase Auth mail | Vercel (`lockin`) · usefoci.com | None | Supabase Auth |
| BoostLogik | Live / free beta | Supabase PG | AWS SES | Vercel · boostlogik.com | None yet | Clerk |

Shared pattern: Next.js on one Vercel team, Supabase Postgres everywhere, AWS SES (`email-smtp.us-east-1.amazonaws.com`) for product mail where configured.

---

## Per-project detail

### Brakto — tournament management

| Field | Detail |
|-------|--------|
| **Domain / repo** | https://www.brakto.com · `gammaraj/brakto` (private) |
| **Current status** | Production. 2026 Free / Event / Club / Voting pricing shipped; legacy tiers grandfathered. Recent work: Stripe refunds, admin help, GA4 CSP. |
| **Projection** | Grow organizers; Club annual ($790/yr); Event bands $79–$549; Connect player fees; partnership track (IAC / ScholarArena). |
| **Database** | PostgreSQL via Supabase pooler `aws-0-us-east-1.pooler.supabase.com` (Prisma). |
| **Email** | AWS SES SDK + SMTP. From `@filantus.com` / `admin@brakto.com`. |
| **Hosting** | Vercel + Sentry + Vercel Analytics. |
| **Stripe** | Live. Event Small/Med/Large/XL, Voting $149, Club $790/yr. Webhook `/api/webhooks/stripe`. One-time heavy (0 active subs today). |
| **Business plan** | B2C organizers: free ≤16 players; pay-per-event; Club for frequent use. Monetization live (~$2.3k gross charges in 90d). |

### CertStud — certification practice (SkillQuest)

| Field | Detail |
|-------|--------|
| **Domain / repo** | https://certstud.com · `gammaraj/certstud` (private) |
| **Current status** | Production with subscriptions. Content quality / pay-ready authoring still the conversion bottleneck (process ~90/90; purchase-worthiness ongoing). |
| **Projection** | Finish pay-ready banks → convert free-tier practice into paid tracks; then SEO/growth. |
| **Database** | PostgreSQL via Supabase pooler `aws-1-us-east-1.pooler.supabase.com` (Prisma). |
| **Email** | Nodemailer → SES SMTP. From `@certstud.com`. |
| **Hosting** | Vercel project `certstud` + Sentry + Analytics. |
| **Stripe** | Live. ~58 actives / ~$806 MRR / ~$1.2k invoiced last 30d. Catalog env shows Single Track ~$9.99/mo and All Access ~$29.99/mo; live has many legacy price IDs. |
| **Business plan** | Freemium: free sample questions → Single Track / All Access. Strongest revenue product in the portfolio today. |

### CollegeDecider — AI college planning

| Field | Detail |
|-------|--------|
| **Domain / repo** | https://www.collegedecider.com · `gammaraj/collegedecider` (private) |
| **Current status** | MVP live. Checkout repaired (May 2026). Traffic improved vs Jan 2026 monetization report (now 1.1k MAU / 30d) but paid conversion still thin. |
| **Projection** | Vision: free core forever; Premium then Pro/B2B; long-range 1M+ MAU / $10M+ ARR by 2029. Near-term: retention, onboarding, email capture. |
| **Database** | PostgreSQL via Supabase pooler `aws-1-us-east-1.pooler.supabase.com` (Prisma). |
| **Email** | Nodemailer → SES SMTP. From `@collegedecider.com`. |
| **Hosting** | Vercel + Sentry; PWA/Capacitor path documented. |
| **Stripe** | Live Premium yearly $49 ×2 actives (+2 trials). Reconcile code/docs vs live price IDs. |
| **Business plan** | Free search/save/compare; Premium for AI essays/advanced. Vision mix ~70% sub / 25% B2B / 5% marketplace. |

### Foci — focus / productivity (LockIn lineage)

| Field | Detail |
|-------|--------|
| **Domain / repo** | https://usefoci.com · `gammaraj/foci` (public) |
| **Current status** | Free product live. LocalStorage offline; Supabase sync when signed in. Vercel project still named `lockin`. |
| **Projection** | SEO + habit retention; cross-promo CertStud/BoostLogik. Optional Pro later (not in code). |
| **Database** | Supabase Postgres + Auth + RLS (`zpknihgvpkvhfbnxbewr.supabase.co`). |
| **Email** | Supabase Auth only — no product mailer. |
| **Hosting** | Vercel + Sentry; optional Upstash; IndexNow; GA4 tag + local Data API report (`npm run report:ga`). |
| **Stripe** | None. |
| **Business plan** | Free consumer tool / portfolio acquisition. |

### BoostLogik — SEO workspace + light CRM

| Field | Detail |
|-------|--------|
| **Domain / repo** | https://boostlogik.com · `gammaraj/boostlogik` (private) |
| **Current status** | Free/beta live (analyzer, SEO tools, CRM). Pricing page: Free live; Pro/Agency Coming Soon. |
| **Projection** | VISION.md tiers Free → Pro (~$29–$49) → Team/Agency (~$79–$149) → Enterprise; grandfather beta users. |
| **Database** | Supabase Postgres (`jfofgjcnesmnlvrledsi.supabase.co`) + optional Upstash. |
| **Email** | Nodemailer / SES (`@filantus.com`). Docs mention Resend as optional for analyzer reports. |
| **Hosting** | Vercel + Sentry + Analytics + GA4 measurement. |
| **Stripe** | Not integrated. |
| **Business plan** | Free forever core during beta; paid for white-label, portals, scheduled audits, teams. |

---

## Open gaps

1. **CollegeDecider** — Reconcile Premium price IDs across Stripe live, Vercel env, and `lib/subscription-plans.ts`.  
2. **BoostLogik** — Wire Stripe when Pro/Agency leave waitlist; add `GA4_PROPERTY_ID` + service account for portfolio reports.  
3. **Foci** — No billing yet (optional Pro later). GA4 Data API wired (`528505183`); refresh with `npm run report:ga`.  
4. **CertStud** — Continue pay-ready content; consider consolidating legacy Stripe prices.

---

## How to refresh metrics

```bash
# Stripe (from any machine with project env files)
# Use each project's STRIPE_SECRET_KEY against /subscriptions, /invoices, /payment_intents

# GA4 Data API
cd ~/Projects/foci && npm run report:ga          # needs GA4_PROPERTY_ID + GA_CLIENT_EMAIL + GA_PRIVATE_KEY in .env.local
cd ~/Projects/brakto && node scripts/ga-report.mjs
# CollegeDecider: node ga-detailed-30day.js (expects .env.production.check)
```

Do not commit API keys, webhook secrets, or full `.env*` files.
