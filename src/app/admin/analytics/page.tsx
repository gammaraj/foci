import type { Metadata } from "next";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { ADMIN_SHELL } from "@/components/admin/admin-shell";
import { fetchAdminGaSummary, type AdminGaSummary } from "@/lib/ga-data-api";

export const metadata: Metadata = {
  title: "Analytics",
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

export default async function AdminAnalyticsPage() {
  const { data: ga, error } = await loadGa();

  return (
    <main className={`${ADMIN_SHELL} py-8 space-y-6`}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Acquisition, landings, campaigns, and product-event clicks from GA4.
        </p>
      </div>
      <AdminAnalyticsPanel ga={ga} error={error} />
    </main>
  );
}
