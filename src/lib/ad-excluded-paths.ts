/**
 * High-intent conversion surfaces — hide Filantus header cross-promo so it
 * cannot divert attention from pricing / checkout / auth.
 */
export const CROSS_PROMO_EXCLUDED_PATH_PATTERNS: RegExp[] = [
  /^\/pricing(\/|$)/,
  /^\/checkout(\/|$)/,
  /^\/login(\/|$)/,
];

export function isCrossPromoExcludedPath(pathname: string): boolean {
  return CROSS_PROMO_EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}
