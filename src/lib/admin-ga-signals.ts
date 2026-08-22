/** GA4 event names we track for monetization / product-health decisions. */
export const MONETIZATION_GA_EVENTS = [
  "invite_sent",
  "collaborator_added",
  "shared_project_opened",
  "share_modal_opened",
  "stats_viewed",
  "pricing_viewed",
  "upgrade_clicked",
] as const;

export const PRODUCT_HEALTH_GA_EVENTS = [
  "timer_start",
  "session_complete",
  "task_completed",
  "task_added",
  "sign_up",
  "login",
  "ambient_sound_played",
] as const;

export const ALL_ADMIN_SIGNAL_EVENTS = [
  ...MONETIZATION_GA_EVENTS,
  ...PRODUCT_HEALTH_GA_EVENTS,
] as const;

export type MonetizationGaEvent = (typeof MONETIZATION_GA_EVENTS)[number];

export const MONETIZATION_SIGNAL_META: Record<
  MonetizationGaEvent,
  { label: string; why: string }
> = {
  invite_sent: { label: "Invite sent", why: "Willingness to share — best Pro wedge" },
  collaborator_added: { label: "Collaborator added", why: "Invite accepted → multiplayer demand" },
  shared_project_opened: { label: "Shared project opened", why: "Ongoing shared-work usage" },
  share_modal_opened: { label: "Share modal opened", why: "Interest before invite" },
  stats_viewed: { label: "Stats viewed", why: "Insights depth interest" },
  pricing_viewed: { label: "Pricing viewed", why: "Demand signal (when /pricing exists)" },
  upgrade_clicked: { label: "Upgrade clicked", why: "Ready-to-pay intent" },
};
