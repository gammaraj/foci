/** Consistent document titles for SEO and GA4 (avoids root layout template doubling). */
export const SITE_NAME = "Foci";

export function absolutePageTitle(title: string): { absolute: string } {
  const trimmed = title.trim();
  const suffix = ` – ${SITE_NAME}`;
  if (
    trimmed.endsWith(suffix) ||
    trimmed.endsWith(` | ${SITE_NAME}`) ||
    trimmed.endsWith(` - ${SITE_NAME}`)
  ) {
    return { absolute: trimmed };
  }
  // Titles that already lead with the brand (e.g. "Foci App …") should not become "… – Foci"
  if (/^Foci\b/i.test(trimmed)) {
    return { absolute: trimmed };
  }
  return { absolute: `${trimmed}${suffix}` };
}
