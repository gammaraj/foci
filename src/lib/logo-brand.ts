/** Foci Concept A — orange ring & dot. Keep SVG, React, and OG assets in sync. */

export const FOCI_LOGO_BG = "#0b1121";

/** Ring mid-tone — icon arc gradient center */
export const FOCI_BRAND_ORANGE = "#f97316";

export const FOCI_RING_COLORS = {
  dim: "#ea580c",
  mid: FOCI_BRAND_ORANGE,
  bright: "#fb923c",
  glow: "#fde68a",
} as const;

/** Aperture center dot — wordmark “i” tittle matches this on all surfaces */
export const FOCI_LOGO_DOT = "#fb923c";

/** Wordmark on white/light pages — ~3.6:1 on #fff (AA large text) */
export const FOCI_WORDMARK_ON_LIGHT = "#ea580c";

/** Wordmark on dark nav — matches icon dot, ~8.3:1 on #0b1121 */
export const FOCI_WORDMARK_ON_DARK = FOCI_LOGO_DOT;

/** Decorative wordmark gradient for OG / social (dark backgrounds only) */
export const FOCI_WORDMARK_GRADIENT_DARK_BG_CSS =
  "linear-gradient(90deg, #fb923c 0%, #f97316 55%, #ea580c 100%)";

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_WORDMARK_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_LOGO_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

export const FOCI_LOGO_SVG_STOPS = FOCI_RING_COLORS;

/** Orange glow — dark chrome, hero on navy, OG tiles */
export const FOCI_LOGO_SHADOW_DARK =
  "shadow-[0_2px_10px_rgba(0,0,0,0.35),0_0_22px_rgba(251,146,60,0.38)] ring-1 ring-orange-400/40";

/** Flat frame — light pages, app store, PWA prompt (no muddy glow) */
export const FOCI_LOGO_SHADOW_LIGHT =
  "shadow-md shadow-slate-900/10 ring-1 ring-orange-500/25";

/** @deprecated Prefer getFociLogoShadow(surface) */
export const FOCI_LOGO_SHADOW = FOCI_LOGO_SHADOW_DARK;

export function getFociLogoShadow(surface: "dark" | "light"): string {
  return surface === "light" ? FOCI_LOGO_SHADOW_LIGHT : FOCI_LOGO_SHADOW_DARK;
}

export const FOCI_TAGLINE_FOCUS = "FOCUS · FLOW · FINISH";
export const FOCI_TAGLINE_CALM = "deep work, one calm window";

/** Ring geometry for 32×32 viewBox */
export const FOCI_RING = {
  r: 10,
  stroke: 3.2,
  dash: "47.1 15.7",
  innerR: 6.5,
  dotR: 2.75,
  tileRx: 8,
} as const;
