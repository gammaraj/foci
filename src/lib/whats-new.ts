/** Bump when shipping user-visible /app changes — shows banner until dismissed. */
export const WHATS_NEW_VERSION = "2026-06";

export const WHATS_NEW_STORAGE_KEY = "foci_whats_new_seen";

export interface WhatsNewFeature {
  title: string;
  description: string;
}

export interface FeatureTourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

export const WHATS_NEW_FEATURES: WhatsNewFeature[] = [
  {
    title: "Bucket view",
    description: "See every project side by side — now the default when you open Tasks.",
  },
  {
    title: "Favorite projects",
    description: "Star projects in the manage menu (⋮) to pin them first in your tabs.",
  },
  {
    title: "Clearer due-date filters",
    description: "Today / Week / Month / Year show only scheduled tasks, with counts and a No due date section.",
  },
  {
    title: "Faster overdue triage",
    description: "Move to today, mark done, or focus — inline on every overdue card.",
  },
];

export const FEATURE_TOUR_STEPS: FeatureTourStep[] = [
  {
    target: "[data-tour='time-filters']",
    title: "Due-date filters",
    description:
      "Today, Week, Month, and Year show tasks due in that window — not your full backlog. Undated tasks appear in a separate section.",
    position: "bottom",
  },
  {
    target: "[data-tour='view-modes']",
    title: "Bucket view",
    description:
      "The columns icon opens bucket view: one column per project. Switch to list or calendar anytime.",
    position: "bottom",
  },
  {
    target: "#tasks-section",
    title: "Tasks & Focus",
    description: "Add a task, pick one, and hit Focus to link it to your timer and start a session.",
    position: "top",
  },
  {
    target: "[data-tour='task-panel-menu']",
    title: "More options",
    description:
      "Open this menu for settings, AI planning, favorites (in list view), templates — and to replay this tour.",
    position: "bottom",
  },
];

export function hasSeenWhatsNew(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(WHATS_NEW_STORAGE_KEY) === WHATS_NEW_VERSION;
}

export function markWhatsNewSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WHATS_NEW_STORAGE_KEY, WHATS_NEW_VERSION);
}

export const FEATURE_TOUR_START_EVENT = "foci-start-feature-tour";
export const WHATS_NEW_SHOW_EVENT = "foci-show-whats-new";

export function startFeatureTour(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FEATURE_TOUR_START_EVENT));
}

export function showWhatsNewBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WHATS_NEW_SHOW_EVENT));
}
