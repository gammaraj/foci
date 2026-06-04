/** Consistent document titles for SEO and GA4 (avoids root layout template doubling). */
export const SITE_NAME = "Foci";

export function absolutePageTitle(title: string): { absolute: string } {
  const trimmed = title.trim();
  const suffix = ` – ${SITE_NAME}`;
  if (trimmed.endsWith(suffix)) {
    return { absolute: trimmed };
  }
  return { absolute: `${trimmed}${suffix}` };
}
