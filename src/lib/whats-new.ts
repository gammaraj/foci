/** Bump when shipping user-visible /app changes — shows banner until dismissed. */
export const WHATS_NEW_VERSION = "2026-07-e";

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
    title: "Project templates",
    description:
      "Start a new project with preset tasks — workflows like Dev Sprint and Trip Planning, plus financial packs including Financial Life Plan, Monthly Budget, and Debt Payoff. Open ⋯ → Project templates, or pick one when creating a project.",
  },
  {
    title: "Cards view (default)",
    description:
      "Projects open as cards with top tasks — switch to Buckets, List, or Calendar anytime.",
  },
  {
    title: "Smart Plan",
    description:
      "Day-by-day scheduling from due dates and daily goals. Open it from the task panel menu (⋯).",
  },
  {
    title: "Today's One Thing",
    description:
      "Pick the one task that would make today a success — keep it visible above your list.",
  },
  {
    title: "Import your tools",
    description:
      "Bring tasks from Todoist, Notion, Asana, or Google Tasks via ⋯ → Import tasks, or Settings → Data.",
  },
];

export const FEATURE_TOUR_STEPS: FeatureTourStep[] = [
  {
    target: "[data-tour='view-modes']",
    title: "Views",
    description:
      "Cards is the default. Use Buckets for every project side by side, List to grind through work, or Calendar for due dates.",
    position: "bottom",
  },
  {
    target: "[data-tour='one-thing']",
    title: "Today's One Thing",
    description:
      "Set one priority task for the day so focus stays obvious while you work through the rest.",
    position: "bottom",
  },
  {
    target: "[data-tour='time-filters']",
    title: "Filters & progress",
    description:
      "All / Today / Week / Month / Year filter by due date. The tally shows completions for today, this week, and this month.",
    position: "bottom",
  },
  {
    target: "[data-tour='task-panel-menu']",
    title: "Project templates & more",
    description:
      "Open ⋯ for Project templates (workflows + financial life planning with preset tasks), Import tasks, Settings, What's new, and Take product tour. Smart Plan is under Layout → Plan. Projects in the top nav is where you manage, create, and import.",
    position: "bottom",
  },
  {
    target: "#ambient-sounds",
    title: "Ambient music",
    description:
      "Rain, café, brown noise, Spotify, SoundCloud, and lo-fi — stay in flow without leaving Foci.",
    position: "bottom",
  },
  {
    target: ".pause-button",
    title: "Optional focus timer",
    description:
      "Start a session when it helps — Pomodoro, Deep Work, 52/17, and more. Time logs to the selected task.",
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
