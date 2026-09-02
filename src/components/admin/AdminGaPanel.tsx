import type { AdminGaSummary } from "@/lib/ga-data-api";
import Link from "next/link";
import {
  MONETIZATION_GA_EVENTS,
  MONETIZATION_SIGNAL_META,
  PRODUCT_HEALTH_GA_EVENTS,
} from "@/lib/admin-ga-signals";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function deltaLabel(current: number, prior: number): { text: string; tone: "up" | "down" | "flat" } {
  if (prior === 0) {
    return current > 0 ? { text: "new", tone: "up" } : { text: "—", tone: "flat" };
  }
  const change = ((current - prior) / prior) * 100;
  if (Math.abs(change) < 1) return { text: "flat", tone: "flat" };
  const sign = change > 0 ? "+" : "";
  return {
    text: `${sign}${change.toFixed(0)}% vs prior 7d`,
    tone: change > 0 ? "up" : "down",
  };
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--surface-border)] dark:border-[#243350] bg-[color:var(--surface-elevated)]/80 dark:bg-[#131d30]/80 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

const DAILY_CHART_BAR_MAX_PX = 96;

function DailyTrend({ rows }: { rows: AdminGaSummary["dailyUsers"] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--surface-border)] dark:border-[#243350] bg-[color:var(--surface-elevated)]/60 dark:bg-[#131d30]/60 p-3">
        <p className="text-sm text-slate-400">No daily data yet.</p>
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.users), 1);

  return (
    <div className="rounded-xl border border-[color:var(--surface-border)] dark:border-[#243350] bg-[color:var(--surface-elevated)]/60 dark:bg-[#131d30]/60 p-3">
      <div className="flex items-end gap-0.5 sm:gap-1" style={{ minHeight: DAILY_CHART_BAR_MAX_PX + 18 }}>
        {rows.map((row) => {
          const barPx =
            row.users === 0 ? 0 : Math.max(3, Math.round((row.users / max) * DAILY_CHART_BAR_MAX_PX));
          const label =
            row.date.length === 8
              ? `${row.date.slice(4, 6)}/${row.date.slice(6, 8)}`
              : row.date;
          return (
            <div
              key={row.date}
              className="flex-1 flex flex-col items-center justify-end min-w-0"
              style={{ height: DAILY_CHART_BAR_MAX_PX + 18 }}
            >
              <div
                className="w-full rounded-t bg-blue-500/80 dark:bg-blue-400/70"
                style={{ height: barPx }}
                title={`${label}: ${row.users} users, ${row.sessions} sessions`}
              />
              <span className="mt-1 text-[9px] text-slate-400 tabular-nums truncate w-full text-center">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReferralList({ rows }: { rows: AdminGaSummary["referralSources"] }) {
  const total = rows.reduce((s, r) => s + r.sessions, 0) || 1;
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
        Referral sources (30d)
      </h3>
      <ul className="text-sm space-y-2 border border-[color:var(--surface-border)] dark:border-[#243350] rounded-xl bg-[color:var(--surface-elevated)]/60 dark:bg-[#131d30]/60 p-3">
        {rows.map((r) => {
          const label = `${r.source} / ${r.medium}`;
          return (
            <li key={label}>
              <div className="flex justify-between gap-3 tabular-nums mb-1">
                <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                  {label}
                </span>
                <span className="shrink-0 text-slate-500">
                  {fmt(r.sessions)} sess · {fmt(r.users)}u
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#1a2740] overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500/70"
                  style={{ width: `${(r.sessions / total) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
        {rows.length === 0 && <li className="text-slate-400">No data</li>}
      </ul>
    </div>
  );
}

function BreakdownList({
  title,
  rows,
}: {
  title: string;
  rows: { channel: string; sessions: number; users: number }[];
}) {
  const total = rows.reduce((s, r) => s + r.sessions, 0) || 1;
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
      <ul className="text-sm space-y-2 border border-[color:var(--surface-border)] dark:border-[#243350] rounded-xl bg-[color:var(--surface-elevated)]/60 dark:bg-[#131d30]/60 p-3">
        {rows.map((r) => (
          <li key={r.channel}>
            <div className="flex justify-between gap-3 tabular-nums mb-1">
              <span className="truncate text-slate-600 dark:text-slate-300">{r.channel}</span>
              <span className="shrink-0 text-slate-500">
                {fmt(r.sessions)} sess · {fmt(r.users)}u
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#1a2740] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500/70"
                style={{ width: `${(r.sessions / total) * 100}%` }}
              />
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-slate-400">No data</li>}
      </ul>
    </div>
  );
}

function SignalTable({
  title,
  events,
  counts,
}: {
  title: string;
  events: readonly string[];
  counts: AdminGaSummary["signalCounts"];
}) {
  const byEvent = new Map(counts.map((c) => [c.event, c]));
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-[color:var(--surface-border)] dark:border-[#243350] bg-[color:var(--surface-elevated)]/60 dark:bg-[#131d30]/60">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-[color:var(--surface-border)] dark:border-[#243350] text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Event</th>
              <th className="px-3 py-2 font-semibold text-right">7d</th>
              <th className="px-3 py-2 font-semibold text-right">30d</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const row = byEvent.get(event);
              const meta = MONETIZATION_SIGNAL_META[event as keyof typeof MONETIZATION_SIGNAL_META];
              const count7 = row?.count7d ?? 0;
              const count30 = row?.count30d ?? 0;
              const zero = count30 === 0 && count7 === 0;
              return (
                <tr
                  key={event}
                  className="border-b border-slate-100 dark:border-[#1a2740] last:border-0"
                >
                  <td className="px-3 py-2">
                    <code className="text-xs font-mono text-blue-700 dark:text-blue-300">{event}</code>
                    {meta ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meta.why}</p>
                    ) : null}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums font-medium ${zero ? "text-slate-400" : ""}`}
                  >
                    {fmt(count7)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums font-medium ${zero ? "text-slate-400" : ""}`}
                  >
                    {fmt(count30)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminGaPanel({ ga, error }: { ga: AdminGaSummary | null; error: string | null }) {
  const wow = ga ? deltaLabel(ga.users7d, ga.usersPrior7d) : null;

  return (
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
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/analytics"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Full measurement
          </Link>
          {ga?.fetchedAt && (
            <p className="text-xs text-slate-400 tabular-nums">
              Fetched {new Date(ga.fetchedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-amber-300/80 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700/50 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Could not load GA: {error}. Ensure GA4_PROPERTY_ID + service account are set on Vercel.
        </p>
      )}

      {ga && (
        <>
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            <StatCard
              label="Users 30d"
              value={fmt(ga.users30d)}
              hint={`${fmt(ga.newUsers30d)} new`}
            />
            <StatCard
              label="Users 7d"
              value={fmt(ga.users7d)}
              hint={
                wow
                  ? wow.text
                  : undefined
              }
            />
            <StatCard label="Sessions 30d" value={fmt(ga.sessions30d)} />
            <StatCard label="Sessions 7d" value={fmt(ga.sessions7d)} />
            <StatCard label="Page views 30d" value={fmt(ga.pageViews30d)} />
            <StatCard label="Page views 7d" value={fmt(ga.pageViews7d)} />
            <StatCard label="Avg session" value={`${ga.avgSessionSec30d}s`} />
            <StatCard label="Engagement" value={pct(ga.engagementRate30d)} hint={`Bounce ${pct(ga.bounceRate30d)}`} />
          </div>

          <div className="grid xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Daily users (14d)
              </h3>
              <DailyTrend rows={ga.dailyUsers} />
            </div>
            <div className="xl:col-span-4 mt-6 xl:mt-0">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Content segments (30d)
              </h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-2">
                {ga.contentSegments.map((seg) => (
                  <div
                    key={seg.segment}
                    className="rounded-lg border border-[color:var(--surface-border)] dark:border-[#243350] bg-[color:var(--surface-elevated)]/70 dark:bg-[#131d30]/70 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-200">{seg.segment}</p>
                    <p className="tabular-nums text-slate-500 mt-0.5">
                      {fmt(seg.users)} users · {fmt(seg.views)} views
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <SignalTable title="Monetization signals" events={MONETIZATION_GA_EVENTS} counts={ga.signalCounts} />
            <SignalTable title="Product health" events={PRODUCT_HEALTH_GA_EVENTS} counts={ga.signalCounts} />
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            <BreakdownList title="Channels (30d)" rows={ga.channels} />
            <ReferralList rows={ga.referralSources} />
            <BreakdownList title="Devices (30d)" rows={ga.devices} />
          </div>

          <div className="grid lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Top events (30d)
              </h3>
              <ul className="text-sm space-y-1.5 border border-[color:var(--surface-border)] dark:border-[#243350] rounded-xl bg-[color:var(--surface-elevated)]/60 dark:bg-[#131d30]/60 p-3">
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
            <div className="2xl:col-span-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Top pages (30d)
              </h3>
              <ul className="text-sm space-y-1.5 border border-[color:var(--surface-border)] dark:border-[#243350] rounded-xl bg-[color:var(--surface-elevated)]/60 dark:bg-[#131d30]/60 p-3">
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
  );
}
