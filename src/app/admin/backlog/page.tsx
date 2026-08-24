import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ADMIN_SHELL } from "@/components/admin/admin-shell";
import {
  BACKLOG_ITEMS,
  BACKLOG_SNAPSHOT,
  BACKLOG_VERDICT,
  PRODUCT_GOALS,
  activeBacklogItems,
  backlogCounts,
  backlogItemsByArea,
  goalCounts,
  laterBacklogItems,
  wontBacklogItems,
  type BacklogItem,
  type BacklogPriority,
  type BacklogStatus,
  type GoalStatus,
} from "@/lib/admin-backlog";

export const metadata: Metadata = {
  title: "Backlog",
  robots: { index: false, follow: false },
};

const GOAL_TONE: Record<GoalStatus, string> = {
  achieved:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  partial: "bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  open: "bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
};

const STATUS_TONE: Record<BacklogStatus, string> = {
  todo: "bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
  blocked: "bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  later: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  wont: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
};

const STATUS_LABEL: Record<BacklogStatus, string> = {
  todo: "To do",
  blocked: "Blocked",
  later: "Later",
  wont: "Won't",
};

const GOAL_LABEL: Record<GoalStatus, string> = {
  achieved: "Achieved",
  partial: "Partial",
  open: "Open",
};

const PRIORITY_LABEL: Record<BacklogPriority, string> = {
  p0: "P0",
  p1: "P1",
  p2: "P2",
  p3: "P3",
};

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function ItemCard({ item }: { item: BacklogItem }) {
  return (
    <article className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill className={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Pill>
        <Pill className="bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {PRIORITY_LABEL[item.priority]}
        </Pill>
      </div>
      <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">{item.title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.why}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.notes}</p>
    </article>
  );
}

function ItemSection({
  heading,
  description,
  items,
}: {
  heading: string;
  description: string;
  items: BacklogItem[];
}) {
  if (items.length === 0) return null;
  const groups = backlogItemsByArea(items);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{heading}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      {groups.map((group) => (
        <div key={group.area} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {group.label}
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {group.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function AdminBacklogPage() {
  const goals = goalCounts();
  const counts = backlogCounts();
  const active = activeBacklogItems();
  const later = laterBacklogItems();
  const wont = wontBacklogItems();

  return (
    <main className={`${ADMIN_SHELL} py-8 space-y-10`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Snapshot {BACKLOG_SNAPSHOT}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Backlog
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          {BACKLOG_VERDICT.headline} {BACKLOG_VERDICT.body}
        </p>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        {[
          { label: "Goals achieved", value: `${goals.achieved}/${goals.total}` },
          { label: "Open now", value: String(counts.active) },
          { label: "Blocked", value: String(counts.blocked) },
          { label: "Later / won’t", value: `${counts.later} / ${counts.wont}` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 px-3 py-3"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {stat.label}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="goals-heading" className="space-y-3">
        <div>
          <h2 id="goals-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
            Stated goals
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {goals.achieved} achieved · {goals.partial} partial · {goals.open} still open. Sharing is the only incomplete product goal; growth and Pro are later.
          </p>
        </div>
        <ol className="space-y-2">
          {PRODUCT_GOALS.map((goal) => (
            <li
              key={goal.id}
              className="rounded-xl border border-slate-200/90 dark:border-[#243350] bg-white/80 dark:bg-[#131d30]/80 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Pill className={GOAL_TONE[goal.status]}>{GOAL_LABEL[goal.status]}</Pill>
                <h3 className="font-semibold text-slate-900 dark:text-white">{goal.title}</h3>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{goal.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <ItemSection
        heading="Open now"
        description={`${active.length} items that would still change the live product or how confidently we ship it.`}
        items={active}
      />

      <ItemSection
        heading="Later"
        description="Optional Pro and ops hygiene. Do not start Stripe until share/stats signals justify checkout."
        items={later}
      />

      <ItemSection
        heading="Out of scope"
        description="v1 non-goals. Ads in /app contradict the workspace ads policy — keep them out."
        items={wont}
      />

      <p className="text-xs text-slate-400 pb-4">
        {BACKLOG_ITEMS.length} tracked items in <code className="font-mono">src/lib/admin-backlog.ts</code>.
      </p>
    </main>
  );
}
