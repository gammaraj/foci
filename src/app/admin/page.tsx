import type { Metadata } from "next";
import Link from "next/link";
import { AdminGaPanel } from "@/components/admin/AdminGaPanel";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { ADMIN_SHELL } from "@/components/admin/admin-shell";
import { fetchAdminGaSummary, type AdminGaSummary } from "@/lib/ga-data-api";
import {
  MONETIZATION_STATUS,
  PLAN_FEATURES,
  PRO_PRICE_DRAFT,
  REALISTIC_TARGETS,
} from "@/lib/monetization-plans";
import { ADSENSE_CLIENT_ID, CONTACT_EMAIL } from "@/lib/product-facts";
import { activeBacklogItems, backlogCounts } from "@/lib/admin-backlog";
import { createClient } from "@/lib/supabase/server";
import type { AdminUserRow } from "@/lib/admin-users";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function loadGa(): Promise<{ data: AdminGaSummary | null; error: string | null }> {
  try {
    const data = await fetchAdminGaSummary();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

async function loadUsers(): Promise<{ users: AdminUserRow[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) return { users: [], error: error.message };
    return { users: data ?? [], error: null };
  } catch (e) {
    return { users: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function AdminPage() {
  const [{ data: ga, error: gaError }, { users, error: usersError }] = await Promise.all([
    loadGa(),
    loadUsers(),
  ]);
  const counts = backlogCounts();
  const topOpen = activeBacklogItems().slice(0, 3);

  return (
    <main className={`${ADMIN_SHELL} py-8 space-y-10`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Traffic, ops, and draft packaging.
          </p>
        </div>
        <Link
          href="/admin/backlog"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#243350] bg-white/80 dark:bg-[#131d30] px-3 py-1.5 text-sm font-medium hover:border-blue-400 dark:hover:border-blue-500"
        >
          Backlog
          <span className="tabular-nums text-slate-400">{counts.active} open</span>
        </Link>
      </div>

      <AdminGaPanel ga={ga} error={gaError} />

      <AdminUsersPanel users={users} error={usersError} />

      {topOpen.length > 0 ? (
        <section aria-labelledby="open-backlog-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="open-backlog-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
              Open now
            </h2>
            <Link href="/admin/backlog" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Full backlog
            </Link>
          </div>
          <ul className="grid md:grid-cols-3 gap-2 text-sm">
            {topOpen.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-slate-200/90 dark:border-[#243350] bg-[color:var(--surface-elevated)]/70 dark:bg-[#131d30]/70 px-3 py-2"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  {item.status === "blocked" ? "Blocked" : "To do"} · {item.why}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid lg:grid-cols-5 gap-8">
        <section aria-labelledby="ops-heading" className="space-y-3 lg:col-span-2">
          <h2 id="ops-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
            Ops checklist
          </h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-1 gap-2 text-sm">
            {[
              {
                label: "AdSense",
                detail: `${ADSENSE_CLIENT_ID} · ads.txt live · no units in /app`,
              },
              {
                label: "Contact",
                detail: CONTACT_EMAIL,
              },
              {
                label: "Billing",
                detail: MONETIZATION_STATUS.billing,
              },
              {
                label: "GA env",
                detail: process.env.GA4_PROPERTY_ID ? "GA4_PROPERTY_ID set" : "Missing on this deploy",
              },
            ].map((item) => (
              <li
                key={item.label}
                className="rounded-lg border border-slate-200/90 dark:border-[#243350] bg-[color:var(--surface-elevated)]/70 dark:bg-[#131d30]/70 px-3 py-2"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="plans-heading" className="space-y-4 lg:col-span-3">
          <div>
            <h2 id="plans-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
              Free / Pro (draft)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Packaging notes — not live checkout.
            </p>
          </div>

          <dl className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-[color:var(--surface-elevated)]/80 dark:bg-[#131d30]/80 px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Billing</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{MONETIZATION_STATUS.billing}</dd>
            </div>
            <div className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-[color:var(--surface-elevated)]/80 dark:bg-[#131d30]/80 px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Positioning</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{MONETIZATION_STATUS.positioning}</dd>
            </div>
            <div className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-[color:var(--surface-elevated)]/80 dark:bg-[#131d30]/80 px-3 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Near term</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{MONETIZATION_STATUS.nearTerm}</dd>
            </div>
          </dl>

          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-[#243350] bg-[color:var(--surface-elevated)]/80 dark:bg-[#131d30]/80">
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
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Realistic targets</h2>
          <ul className="grid sm:grid-cols-3 gap-2 text-sm">
            {REALISTIC_TARGETS.map((t) => (
              <li
                key={t.horizon}
                className="rounded-lg border border-slate-200/90 dark:border-[#243350] bg-[color:var(--surface-elevated)]/70 dark:bg-[#131d30]/70 px-3 py-2"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t.horizon}</p>
                <p className="text-slate-600 dark:text-slate-400">
                  {t.users} · {t.revenue}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 pb-8 lg:pb-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick links</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {[
              { href: "/admin/backlog", label: "Backlog" },
              { href: "https://analytics.google.com/", label: "GA4 console" },
              { href: "https://adsense.google.com/", label: "AdSense" },
              { href: "https://search.google.com/search-console", label: "Search Console" },
              { href: "/ads.txt", label: "ads.txt" },
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
      </div>
    </main>
  );
}
