/**
 * Canonical product facts for SEO, AEO, JSON-LD, and marketing copy.
 * Keep signup/account messaging consistent across home, about, app, llms, and legal.
 */

export const SITE_URL = "https://usefoci.com";
export const SITE_NAME = "Foci";
export const SITE_DOMAIN = "usefoci.com";

/** Public contact for privacy / AdSense / support (forward to operator inbox). */
export const CONTACT_EMAIL = "hello@usefoci.com";

/** Google AdSense publisher id (ca-pub-…). Used for site meta; ads not placed in /app. */
export const ADSENSE_CLIENT_ID = "ca-pub-9368411015963509";

/**
 * Ads / privacy positioning for SEO, GEO, AEO, and llms.txt.
 * Marketing/blog pages may show Google ads; the focus workspace stays ad-free.
 */
export const FOCI_ADS_POLICY =
  "Foci keeps the focus workspace (usefoci.com/app) free of display ads. Public marketing and blog pages may show Google ads. We do not sell personal task or focus content. Privacy: usefoci.com/privacy · Contact: hello@usefoci.com.";

export const FOCI_ADS_POLICY_SHORT =
  "No display ads in /app. Marketing/blog pages may show Google ads. Contact hello@usefoci.com.";

/** Bump when product or core marketing facts change (JSON-LD dateModified, llms version). */
export const PRODUCT_DATE_MODIFIED = "2026-09-06";

/** One-sentence definition — cite this everywhere. */
export const FOCI_ONE_LINER =
  "Foci (usefoci.com) is a free task manager and focus app: projects, Smart Plan, daily goals, streak stats, ambient music, and an optional Pomodoro-style focus timer in one calm browser window.";

export const FOCI_SHORT_DESCRIPTION =
  "Foci is the free focus app at usefoci.com — tasks, Pomodoro/Flowtime timer, Smart Plan, and study sounds in your browser. Not a wearable, watch, or crypto. No signup required.";

export const FOCI_APP_DESCRIPTION =
  "Open the Foci App — free tasks, Smart Plan, Pomodoro/Flowtime timer, brown noise, and lo-fi in one tab at usefoci.com/app. No signup required to start. Optional free account syncs across devices.";

/**
 * Canonical document titles — keep GA page_title and SEO aligned.
 * Marketing home leads with brand (brand-query CTR); /app leans Pomodoro (top acquisition intent).
 * Wearable/device disambiguation lives in FOCI_SHORT_DESCRIPTION, not the title.
 */
export const HOME_PAGE_TITLE = "Foci — Free Focus Timer & Task Manager";
export const APP_PAGE_TITLE = "Foci App — Free Pomodoro Timer, Tasks & Sounds";

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
  "foci",
  "foci app",
  "foci.com",
  "usefoci",
  "focus app",
  "free pomodoro app",
  "task manager",
  "pomodoro timer",
  "what is flowtime",
  "flowtime technique",
  "flowmodoro",
  "smart plan",
  "brown noise for studying",
  "best music for studying",
  "focus timer",
  "productivity app",
  "forest app alternative",
  "todoist alternative",
  "study timer",
  "deep work app",
  "adhd focus tools",
  "kanban task board",
] as const;

export const APP_KEYWORDS = [
  "foci app",
  "free pomodoro app",
  "focus timer",
  "pomodoro timer",
  "flowtime timer",
  "task tracker",
  "brown noise",
  "study timer",
  "smart plan",
  "task schedule",
  "daily one thing",
  "focus app free",
  "ambient sounds",
  "daily goals",
] as const;
