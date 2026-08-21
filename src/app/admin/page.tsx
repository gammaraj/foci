import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { fetchAdminGaSummary, type AdminGaSummary } from "@/lib/ga-data-api";
import {
  MONETIZATION_STATUS,
  PLAN_FEATURES,
  PRO_PRICE_DRAFT,
  MONETIZATION_SIGNALS,
  REALISTIC_TARGETS,
} from "@/lib/monetization-plans";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

async function loadGa(): Promise<{ data: AdminGaSummary | null; error: string | null }> {
  try {
    const data = await fetchAdminGaSummary();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!isAdminEmail(user.email)) {
    redirect("/app");
  }

  const { data: ga, error: gaError } = await loadGa();

  return (
    <div className="min-h-screen bg-[var(--page-bg,#e3ebf7)] dark:bg-[#070b16] text-slate-800 dark:text-slate-100">
      <header className="border-b border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#0c1220]/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Foci operator
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Admin</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[14rem]">{user.email}</span>
            <Link
              href="/app"
              className="rounded-lg border border-slate-200 dark:border-[#243350] px-3 py-1.5 font-medium hover:bg-slate-50 dark:hover:bg-white/5"
            >
              App
            </Link>
            <Link
              href="/stats"
              className="rounded-lg border border-slate-200 dark:border-[#243350] px-3 py-1.5 font-medium hover:bg-slate-50 dark:hover:bg-white/5"
            >
              Stats
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* GA */}
        <section aria-labelledby="ga-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="ga-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                Analytics (GA4)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Live Data API · property {ga?.propertyId ?? "—"} · {ga?.measurementId ?? "—"}
              </p>
            </div>
            {ga?.fetchedAt && (
              <p className="text-xs text-slate-400 tabular-nums">
                Fetched {new Date(ga.fetchedAt).toLocaleString()}
              </p>
            )}
          </div>

          {gaError && (
            <p className="rounded-lg border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700/50 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              Could not load GA: {gaError}. Ensure GA4_PROPERTY_ID + service account are set on Vercel.
            </p>
          )}

          {ga && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Users 30d", value: fmt(ga.users30d) },
                  { label: "Users 7d", value: fmt(ga.users7d) },
                  { label: "Sessions 30d", value: fmt(ga.sessions30d) },
                  { label: "Page views 30d", value: fmt(ga.pageViews30d) },
                  { label: "Avg session", value: `${ga.avgSessionSec30d}s` },
                  { label: "Bounce", value: pct(ga.bounceRate30d) },
                  { label: "Engaged sess.", value: fmt(ga.engagedSessions30d) },
                  {
                    label: "Blog 30d",
                    value: `${fmt(ga.blogUsers30d)}u / ${fmt(ga.blogViews30d)}v`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 px-3 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Top events (30d)
                  </h3>
                  <ul className="text-sm space-y-1.5 border border-slate-200/90 dark:border-[#243350] rounded-xl bg-white/60 dark:bg-[#131d30]/60 p-3">
                    {ga.topEvents.map((e) => (
                      <li key={e.name} className="flex justify-between gap-3 tabular-nums">
                        <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                          {e.name}
                        </span>
                        <span className="shrink-0 font-medium">{fmt(e.count)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Top pages (30d)
                  </h3>
                  <ul className="text-sm space-y-1.5 border border-slate-200/90 dark:border-[#243350] rounded-xl bg-white/60 dark:bg-[#131d30]/60 p-3">
                    {ga.topPages.map((p) => (
                      <li key={p.path} className="flex justify-between gap-3">
                        <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                          {p.path}
                        </span>
                        <span className="shrink-0 tabular-nums text-slate-500">
                          {fmt(p.views)} · {fmt(p.users)}u
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Plans */}
        <section aria-labelledby="plans-heading" className="space-y-4">
          <div>
            <h2 id="plans-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
              Free / Pro (draft)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Packaging notes — not live checkout.
            </p>
          </div>

          <dl className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Billing</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{MONETIZATION_STATUS.billing}</dd>
            </div>
            <div className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Positioning</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{MONETIZATION_STATUS.positioning}</dd>
            </div>
            <div className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Near term</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{MONETIZATION_STATUS.nearTerm}</dd>
            </div>
          </dl>

          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-slate-200 dark:border-[#243350] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Feature</th>
                  <th className="px-3 py-2.5 font-semibold">Free</th>
                  <th className="px-3 py-2.5 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b border-slate-100 dark:border-[#1a2740] last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{row.name}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.free}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Draft price:</span>{" "}
            {PRO_PRICE_DRAFT.monthly} · {PRO_PRICE_DRAFT.yearly}. {PRO_PRICE_DRAFT.note}
          </p>
        </section>

        {/* Signals & targets */}
        <section className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">GA signals to watch</h2>
            <ul className="space-y-2 text-sm">
              {MONETIZATION_SIGNALS.map((s) => (
                <li
                  key={s.event}
                  className="rounded-lg border border-slate-200/90 dark:border-[#243350] bg-white/70 dark:bg-[#131d30]/70 px-3 py-2"
                >
                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300">{s.event}</code>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400">{s.why}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Realistic targets</h2>
            <ul className="space-y-2 text-sm">
              {REALISTIC_TARGETS.map((t) => (
                <li
                  key={t.horizon}
                  className="rounded-lg border border-slate-200/90 dark:border-[#243350] bg-white/70 dark:bg-[#131d30]/70 px-3 py-2"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{t.horizon}</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {t.users} · {t.revenue}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Links */}
        <section className="space-y-3 pb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick links</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {[
              { href: "https://analytics.google.com/", label: "GA4 console" },
              { href: "/blog", label: "Blog" },
              { href: "/theme-lab", label: "Theme lab" },
              { href: "https://vercel.com/gtgapps-7137s-projects/foci", label: "Vercel" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex rounded-lg border border-slate-200 dark:border-[#243350] bg-white/80 dark:bg-[#131d30] px-3 py-1.5 font-medium hover:border-blue-400 dark:hover:border-blue-500"
                  {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">
            CLI refresh: <code className="font-mono">npm run report:ga</code>
          </p>
        </section>
      </main>
    </div>
  );
}
