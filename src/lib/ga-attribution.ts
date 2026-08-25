/** Hosts that should never count as a session source (OAuth / backend hops). */
export const IGNORED_REFERRER_HOSTS = ["accounts.google.com", "supabase.co"] as const;

/** Our own campaign tokens that appear on inbound partner return URLs. */
export const SELF_CAMPAIGN_SOURCES = ["foci", "foci-header", "foci-footer", "foci-app"] as const;

export const TRACKING_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
] as const;

export function referrerHostname(referrer: string): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function shouldIgnoreReferrer(referrer: string): boolean {
  const host = referrerHostname(referrer);
  if (!host) return false;
  return IGNORED_REFERRER_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function isSelfCampaignSource(source: string | null | undefined): boolean {
  if (!source) return false;
  return (SELF_CAMPAIGN_SOURCES as readonly string[]).includes(source.toLowerCase());
}

export function inboundCampaignSource(params: URLSearchParams): string | null {
  return params.get("utm_source") || params.get("ref");
}

export function shouldStripSelfCampaign(params: URLSearchParams): boolean {
  return isSelfCampaignSource(inboundCampaignSource(params));
}

export function stripSelfCampaignParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  if (!shouldStripSelfCampaign(next)) return next;
  for (const key of TRACKING_PARAM_KEYS) next.delete(key);
  const ref = next.get("ref");
  if (ref && isSelfCampaignSource(ref)) next.delete("ref");
  return next;
}

/** Path for GA page_view — keep product params, drop ads/UTM noise. */
export function analyticsPagePath(pathname: string, search: string): string {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  for (const key of TRACKING_PARAM_KEYS) params.delete(key);
  if (isSelfCampaignSource(params.get("ref"))) params.delete("ref");
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function shouldIgnoreLandingAttribution(referrer: string, search: string): boolean {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  return shouldIgnoreReferrer(referrer) || shouldStripSelfCampaign(params);
}
