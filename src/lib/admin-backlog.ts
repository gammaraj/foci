/**
 * Operator backlog for /admin/backlog.
 * Snapshot of stated product goals vs what is still open — not a living issue tracker.
 */

export const BACKLOG_SNAPSHOT = "2026-08-24";

export const BACKLOG_VERDICT = {
  headline: "Core product goals are met.",
  body: "Foci is a complete free focus app: tasks, optional timer, ambient sound, Smart Plan, streaks, guest mode, account sync, sharing, PWA, and SEO. What remains is collaboration polish, test coverage, growth toward the 2–5k user target, and optional Pro — none of which block the live product.",
} as const;

export type GoalStatus = "achieved" | "partial" | "open";

export type ProductGoal = {
  id: string;
  title: string;
  status: GoalStatus;
  detail: string;
};

export const PRODUCT_GOALS: ProductGoal[] = [
  {
    id: "core-workspace",
    title: "Calm focus workspace",
    status: "achieved",
    detail:
      "Tasks, projects, Cards/Buckets/List/Calendar/Plan, optional Pomodoro/Flowtime timer, ambient sounds, Smart Plan, daily goals, streaks, One Thing, and the Done bar are live in /app.",
  },
  {
    id: "guest-and-sync",
    title: "No signup required; optional free sync",
    status: "achieved",
    detail:
      "Guests keep data in the browser. A free account syncs tasks, projects, Smart Plan, settings, and streaks. No credit card.",
  },
  {
    id: "ads-policy",
    title: "Ads stay out of /app",
    status: "achieved",
    detail:
      "Marketing and blog may show AdSense. The focus workspace is ad-free. Do not treat “ads in product” on the draft Free/Pro table as a commitment.",
  },
  {
    id: "pwa",
    title: "Installable PWA",
    status: "achieved",
    detail: "manifest.json, service worker, and install prompt are shipped.",
  },
  {
    id: "import-export",
    title: "Import / export and templates",
    status: "achieved",
    detail:
      "Todoist, Asana, Notion, Google Tasks, and CSV import; JSON/CSV export; project templates including financial packs.",
  },
  {
    id: "seo-engine",
    title: "SEO / AEO acquisition engine",
    status: "achieved",
    detail:
      "Blog, /vs and /alternatives landings, sitemap, IndexNow, llms.txt, and canonical product facts are in place. Traffic is still early versus the 2–5k / 30d target.",
  },
  {
    id: "sharing",
    title: "Project + account sharing without team workspaces",
    status: "partial",
    detail:
      "UI, DB, RLS, viewer/editor roles, and copy-invite are shipped. Invite email is blocked; shared projects poll every 30s instead of Realtime.",
  },
  {
    id: "operator-ops",
    title: "Operator dashboard",
    status: "achieved",
    detail: "Allowlisted /admin with GA4 summary, ops checklist, and draft Free/Pro notes.",
  },
  {
    id: "growth-target",
    title: "2–5k users / 30d (6–12 month target)",
    status: "open",
    detail:
      "Portfolio snapshot was ~563 users / 30d (2026-08-21). Retention and SEO compounding are the path; this is a metric, not a missing feature.",
  },
  {
    id: "optional-pro",
    title: "Optional Pro (later)",
    status: "open",
    detail:
      "No Stripe, entitlements, or /pricing. Draft packaging lives on /admin. Collect share/stats signals before checkout.",
  },
];

export type BacklogStatus = "todo" | "blocked" | "later" | "done" | "wont";
export type BacklogArea =
  | "collaboration"
  | "quality"
  | "monetization"
  | "growth"
  | "ops";
export type BacklogPriority = "p0" | "p1" | "p2" | "p3";

export type BacklogItem = {
  id: string;
  title: string;
  status: BacklogStatus;
  area: BacklogArea;
  priority: BacklogPriority;
  why: string;
  notes: string;
};

export const BACKLOG_ITEMS: BacklogItem[] = [
  {
    id: "invite-email",
    title: "Invite email via AWS SES",
    status: "blocked",
    area: "collaboration",
    priority: "p1",
    why: "Owners currently copy invite text. Email is the missing piece of the v1 share flow.",
    notes:
      "Blocked on a mailbox on the foci domain. Copy-text remains the shipped workaround. Do not send from a mismatched From address.",
  },
  {
    id: "realtime-shared",
    title: "Supabase Realtime for shared projects",
    status: "done",
    area: "collaboration",
    priority: "p2",
    why: "Collaborators can miss each other’s edits for up to 30 seconds while a shared project is open.",
    notes:
      "Shipped: postgres_changes on tasks (filtered by owner user_id, client-filtered by project_id). Polling retained only as Realtime fallback. Non-goal: Google Docs–style cursors.",
  },
  {
    id: "collab-e2e",
    title: "Collaboration invite E2E",
    status: "todo",
    area: "quality",
    priority: "p1",
    why: "Share/accept/decline is security-sensitive and untested in Playwright.",
    notes:
      "Cover project + account invite create, copy text, accept, decline, and viewer vs editor. Called out in collab Phase 4.",
  },
  {
    id: "rls-live-ci",
    title: "Live RLS tests in CI",
    status: "todo",
    area: "quality",
    priority: "p2",
    why: "Static policy-name checks cannot catch a broken USING/WITH CHECK at runtime.",
    notes:
      "docs/RLS_POLICY_MATRIX.md: needs a test Supabase. Local path is npx supabase db reset plus invite-flow exercise.",
  },
  {
    id: "editor-create-tasks",
    title: "Decide: can editors create tasks?",
    status: "todo",
    area: "collaboration",
    priority: "p2",
    why: "Open design question. Today only owners create/delete; editors update.",
    notes: "If yes, extend RLS INSERT and the Share UI copy. If no, document it in-product so owners are not surprised.",
  },
  {
    id: "collab-limits",
    title: "Collaborator caps (and later Pro headroom)",
    status: "later",
    area: "collaboration",
    priority: "p3",
    why: "Architecture suggests ~10 per project for v1; Free/Pro draft says “Limited (TBD)” vs higher limits.",
    notes: "Ship a cap only if abuse or confusion shows up. Pair with Pro packaging if billing happens.",
  },
  {
    id: "pro-waitlist",
    title: "Soft Pro waitlist",
    status: "later",
    area: "monetization",
    priority: "p2",
    why: "Near-term packaging note: collect intent after share/stats signals, before Stripe.",
    notes: "Do not build /pricing until invite_sent / stats_viewed justify it. trackPricingViewed exists but is unused.",
  },
  {
    id: "stripe-pricing",
    title: "Stripe, entitlements, /pricing",
    status: "later",
    area: "monetization",
    priority: "p3",
    why: "Optional Pro is an explicit later goal, not a launch blocker.",
    notes:
      "No checkout in code. Draft $5–8/mo or $40–60/yr. Keep timer, tasks, and sounds free forever. Wire pricing_viewed / upgrade_clicked when the page exists.",
  },
  {
    id: "pro-stats-export",
    title: "Deeper stats ranges and exports (Pro)",
    status: "later",
    area: "monetization",
    priority: "p3",
    why: "Draft Pro row only. /stats is the free baseline.",
    notes: "Depends on Stripe. Free keeps basic streak/session views.",
  },
  {
    id: "growth-2-5k",
    title: "Compound SEO + retention to 2–5k / 30d",
    status: "todo",
    area: "growth",
    priority: "p1",
    why: "Stated 6–12 month target. Product is ready; distribution is not.",
    notes:
      "Keep shipping comparison/migration posts, IndexNow, and cross-promo. Watch bounce on marketing (~54% in the Aug snapshot) vs /app session quality.",
  },
  {
    id: "collab-doc-hygiene",
    title: "Refresh collaboration architecture checkboxes",
    status: "todo",
    area: "ops",
    priority: "p3",
    why: "Phase 1–2 boxes are unchecked even though UI+DB shipped; the status header is the truth.",
    notes: "docs/COLLABORATION_ARCHITECTURE.md. Hygiene only — no product change.",
  },
  {
    id: "vercel-project-name",
    title: "Vercel project still named lockin",
    status: "later",
    area: "ops",
    priority: "p3",
    why: "Ops confusion when jumping from usefoci.com to the Vercel dashboard.",
    notes: "Rename only with a checklist for env, cron, and GitHub integration. Domain is already usefoci.com.",
  },
  {
    id: "ads-in-app",
    title: "Display ads inside /app",
    status: "wont",
    area: "monetization",
    priority: "p3",
    why: "Draft Free plan says “None (planned)”; ads policy says the workspace stays ad-free.",
    notes: "Treat the policy as source of truth. Monetize later via Pro, not interstitial ads in the timer.",
  },
  {
    id: "team-workspaces",
    title: "Team / workspace management",
    status: "wont",
    area: "collaboration",
    priority: "p3",
    why: "Explicit v1 non-goal. Sharing is invite-based on projects or the whole account.",
    notes: "No orgs, billing seats, or admin roles beyond owner/editor/viewer.",
  },
  {
    id: "live-cursors",
    title: "Google Docs–style collaborative editing",
    status: "wont",
    area: "collaboration",
    priority: "p3",
    why: "Explicit v1 non-goal. Realtime task refresh is enough if we add it.",
    notes: "Also out: comments, activity feeds, and mobile push for collaborator changes.",
  },
];

export const BACKLOG_AREAS: { id: BacklogArea; label: string }[] = [
  { id: "collaboration", label: "Collaboration" },
  { id: "quality", label: "Quality" },
  { id: "monetization", label: "Monetization" },
  { id: "growth", label: "Growth" },
  { id: "ops", label: "Ops" },
];

const PRIORITY_RANK: Record<BacklogPriority, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
const STATUS_RANK: Record<BacklogStatus, number> = {
  blocked: 0,
  todo: 1,
  later: 2,
  done: 3,
  wont: 4,
};

export function isActiveBacklogStatus(status: BacklogStatus): boolean {
  return status === "todo" || status === "blocked";
}

function compareBacklogItems(a: BacklogItem, b: BacklogItem): number {
  const status = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (status !== 0) return status;
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}

export function activeBacklogItems(): BacklogItem[] {
  return BACKLOG_ITEMS.filter((item) => isActiveBacklogStatus(item.status)).sort(compareBacklogItems);
}

export function laterBacklogItems(): BacklogItem[] {
  return BACKLOG_ITEMS.filter((item) => item.status === "later").sort(compareBacklogItems);
}

export function doneBacklogItems(): BacklogItem[] {
  return BACKLOG_ITEMS.filter((item) => item.status === "done").sort(compareBacklogItems);
}

export function wontBacklogItems(): BacklogItem[] {
  return BACKLOG_ITEMS.filter((item) => item.status === "wont").sort(compareBacklogItems);
}

export function backlogItemsByArea(items: BacklogItem[]): { area: BacklogArea; label: string; items: BacklogItem[] }[] {
  return BACKLOG_AREAS.map((area) => ({
    area: area.id,
    label: area.label,
    items: items.filter((item) => item.area === area.id),
  })).filter((group) => group.items.length > 0);
}

export function goalCounts(): { achieved: number; partial: number; open: number; total: number } {
  const achieved = PRODUCT_GOALS.filter((g) => g.status === "achieved").length;
  const partial = PRODUCT_GOALS.filter((g) => g.status === "partial").length;
  const open = PRODUCT_GOALS.filter((g) => g.status === "open").length;
  return { achieved, partial, open, total: PRODUCT_GOALS.length };
}

export function backlogCounts(): {
  active: number;
  blocked: number;
  later: number;
  done: number;
  wont: number;
} {
  return {
    active: activeBacklogItems().length,
    blocked: BACKLOG_ITEMS.filter((i) => i.status === "blocked").length,
    later: laterBacklogItems().length,
    done: doneBacklogItems().length,
    wont: wontBacklogItems().length,
  };
}
