/**
 * Canonical product facts for SEO, AEO, JSON-LD, and marketing copy.
 * Keep signup/account messaging consistent across home, about, app, llms, and legal.
 */

export const SITE_URL = "https://usefoci.com";
export const SITE_NAME = "Foci";
export const SITE_DOMAIN = "usefoci.com";

/** Bump when product or core marketing facts change (JSON-LD dateModified, llms version). */
export const PRODUCT_DATE_MODIFIED = "2026-08-11";

/** One-sentence definition — cite this everywhere. */
export const FOCI_ONE_LINER =
  "Foci (usefoci.com) is a free task manager and focus app: projects, Smart Plan, daily goals, streak stats, ambient music, and an optional Pomodoro-style focus timer in one calm browser window.";

export const FOCI_SHORT_DESCRIPTION =
  "Free task manager with projects, Smart Plan, streaks, and ambient sound. Optional focus timer. Try the app without signing in; create a free account to sync across devices.";

export const FOCI_APP_DESCRIPTION =
  "Open the free Foci focus app — tasks, Smart Plan, daily goals, brown noise, and lo-fi in one tab. No signup required to start. Optional free account syncs across devices at usefoci.com/app.";

/** Account model — single source of truth. */
export const FOCI_ACCOUNT_POLICY =
  "You can open usefoci.com/app and use Foci without signing in (data stays in your browser). A free account is optional and syncs tasks, projects, Smart Plan, settings, and streaks across devices. No credit card required.";

export const FOCI_ACCOUNT_POLICY_SHORT =
  "No signup required to start. Optional free account syncs tasks and streaks across devices.";

/** Organization sameAs for entity resolution (GEO). */
export const FOCI_SAME_AS = [
  "https://twitter.com/usefoci",
  "https://x.com/usefoci",
  "https://github.com/gammaraj/foci",
] as const;

export const ROOT_KEYWORDS = [
  "foci app",
  "focus app",
  "free pomodoro app",
  "task manager",
  "pomodoro timer",
  "smart plan",
  "brown noise for studying",
  "focus timer",
  "productivity app",
  "forest app alternative",
  "todoist alternative",
  "study timer",
  "deep work app",
  "adhd focus tools",
] as const;

export const APP_KEYWORDS = [
  "free pomodoro app",
  "focus timer",
  "pomodoro timer",
  "task tracker",
  "brown noise",
  "study timer",
  "smart plan",
  "focus app free",
  "ambient sounds",
  "daily goals",
] as const;
