/** Detect inbound links from Wandering Hermit partner integration. */
export function isWanderingHermitInboundLink(searchParams: URLSearchParams): boolean {
  return searchParams.get("utm_source") === "wanderinghermit";
}

export const WANDERING_HERMIT_BASE_URL = "https://www.wanderinghermit.com";

export function wanderingHermitTripPlannerUrl(campaign = "foci-app"): string {
  const params = new URLSearchParams({
    utm_source: "foci",
    utm_medium: "referral",
    utm_campaign: campaign,
  });
  return `${WANDERING_HERMIT_BASE_URL}/?${params.toString()}`;
}
