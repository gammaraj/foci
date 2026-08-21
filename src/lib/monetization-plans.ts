/** Draft Free / Pro packaging for operator reference (not live billing). */

export type PlanFeature = {
  name: string;
  free: string;
  pro: string;
};

export const MONETIZATION_STATUS = {
  billing: "Not wired — no Stripe / entitlements yet",
  positioning: "Keep timer, tasks, and ambient sounds free forever",
  nearTerm: "Collect share/stats signals; soft Pro waitlist later",
} as const;

export const PLAN_FEATURES: PlanFeature[] = [
  { name: "Pomodoro / focus timer", free: "Full", pro: "Full" },
  { name: "Tasks, projects, layouts", free: "Full", pro: "Full" },
  { name: "Ambient sounds", free: "Full", pro: "Full" },
  { name: "Local + signed-in sync", free: "Yes", pro: "Yes" },
  { name: "Project / account sharing", free: "Limited (TBD)", pro: "Higher limits + roles" },
  { name: "Stats & insights", free: "Basic /stats", pro: "Deeper ranges & exports" },
  { name: "Ads in product", free: "None (planned)", pro: "None" },
  { name: "Priority support", free: "Community / email", pro: "Owner queue" },
];

export const PRO_PRICE_DRAFT = {
  monthly: "$5–8 / mo",
  yearly: "$40–60 / yr",
  note: "Draft only — validate with invite/stats usage before shipping checkout.",
} as const;

export const MONETIZATION_SIGNALS = [
  { event: "invite_sent", why: "Willingness to share — best Pro wedge" },
  { event: "collaborator_added", why: "Invite accepted → multiplayer demand" },
  { event: "shared_project_opened", why: "Ongoing shared-work usage" },
  { event: "stats_viewed", why: "Insights depth interest" },
  { event: "pricing_viewed / upgrade_clicked", why: "Ready when /pricing exists" },
] as const;

export const REALISTIC_TARGETS = [
  { horizon: "6–12 mo", users: "2–5k / 30d", revenue: "Waitlist / $0" },
  { horizon: "18–36 mo", users: "15–40k / 30d", revenue: "$1–5k MRR if Pro converts" },
  { horizon: "Stretch", users: "100k+", revenue: "$10–30k MRR needs distribution" },
] as const;
