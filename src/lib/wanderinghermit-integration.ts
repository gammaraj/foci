/** Detect inbound links from Wandering Hermit partner integration. */
export function isWanderingHermitInboundLink(searchParams: URLSearchParams): boolean {
  return searchParams.get("utm_source") === "wanderinghermit";
}
