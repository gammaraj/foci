/** Foci brand — electric indigo ring & dot. Keep SVG, React, and OG assets in sync. */

export const FOCI_LOGO_BG = "#0b1121";

/** Primary brand color — indigo-500 */
export const FOCI_BRAND_INDIGO = "#6366f1";

/** @deprecated renamed to FOCI_BRAND_INDIGO */
export const FOCI_BRAND_ORANGE = FOCI_BRAND_INDIGO;

export const FOCI_RING_COLORS = {
  dim: "#4f46e5",    // indigo-600 — dim arc segment
  mid: "#6366f1",    // indigo-500 — main arc
  bright: "#818cf8", // indigo-400 — highlight
  glow: "#c7d2fe",   // indigo-200 — glow/shimmer
} as const;

/** Aperture center dot — wordmark "i" tittle matches this on all surfaces */
export const FOCI_LOGO_DOT = "#818cf8"; // indigo-400 — vivid on dark bg

/** Wordmark on white/light pages — indigo-700, ~6.1:1 on #fff (AA) */
export const FOCI_WORDMARK_ON_LIGHT = "#4338ca";

/** Wordmark on dark nav — indigo-400, ~7.5:1 on #0b1121 (AAA) */
export const FOCI_WORDMARK_ON_DARK = "#818cf8";

/** Decorative wordmark gradient for OG / social (dark backgrounds only) */
export const FOCI_WORDMARK_GRADIENT_DARK_BG_CSS =
  "linear-gradient(90deg, #818cf8 0%, #6366f1 55%, #4f46e5 100%)";

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_WORDMARK_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_LOGO_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

export const FOCI_LOGO_SVG_STOPS = FOCI_RING_COLORS;

/** Indigo glow — dark chrome, hero on navy, OG tiles */
export const FOCI_LOGO_SHADOW_DARK =
  "shadow-[0_2px_10px_rgba(0,0,0,0.35),0_0_22px_rgba(129,140,248,0.40)] ring-1 ring-indigo-400/40";

/** Flat frame — light pages, app store, PWA prompt (no muddy glow) */
export const FOCI_LOGO_SHADOW_LIGHT =
  "shadow-md shadow-slate-900/10 ring-1 ring-indigo-500/25";

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
