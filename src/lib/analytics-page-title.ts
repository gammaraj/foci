import { isTimerTabTitle } from "@/lib/timer-utils";

const DATA_ATTR = "data-foci-analytics-title";

/**
 * Remember the real SEO/document title for GA4.
 * Timer countdown titles stay in `document.title` for the tab, but must not
 * leak into page_title on page_view or other events.
 */
export function rememberAnalyticsPageTitle(title: string): void {
  if (typeof document === "undefined") return;
  const trimmed = title.trim();
  if (!trimmed || isTimerTabTitle(trimmed)) return;

  document.documentElement.setAttribute(DATA_ATTR, trimmed);

  if (typeof window.gtag === "function") {
    window.gtag("set", { page_title: trimmed });
  }
}

/** Title to send to GA — never a MM:SS · Focus/Paused/Break tab title. */
export function resolveAnalyticsPageTitle(): string {
  if (typeof document === "undefined") return "";

  const current = document.title.trim();
  if (!isTimerTabTitle(current)) {
    rememberAnalyticsPageTitle(current);
    return current;
  }

  const remembered = document.documentElement.getAttribute(DATA_ATTR)?.trim();
  if (remembered) return remembered;

  const og = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content")
    ?.trim();
  if (og) {
    rememberAnalyticsPageTitle(og);
    return og;
  }

  return "Foci";
}
