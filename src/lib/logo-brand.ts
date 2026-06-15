/** Foci Concept A — orange ring & dot. Keep SVG, React, and OG assets in sync. */

export const FOCI_LOGO_BG = "#0b1121";

/** Primary brand orange — matches ring mid / dot family */
export const FOCI_BRAND_ORANGE = "#f97316";

export const FOCI_RING_COLORS = {
  dim: "#ea580c",
  mid: FOCI_BRAND_ORANGE,
  bright: "#fb923c",
  glow: "#fde68a",
} as const;

export const FOCI_LOGO_DOT = "#fb923c";

/** Wordmark on dark nav / OG — warm highlight → brand orange */
export const FOCI_WORDMARK_GRADIENT_DARK_BG_CSS =
  "linear-gradient(90deg, #fde68a 0%, #fdba74 30%, #fb923c 65%, #f97316 100%)";

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_WORDMARK_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_LOGO_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

export const FOCI_LOGO_SVG_STOPS = FOCI_RING_COLORS;

export const FOCI_LOGO_SHADOW =
  "shadow-[0_2px_10px_rgba(0,0,0,0.35),0_0_22px_rgba(251,146,60,0.38)] ring-1 ring-orange-400/40";

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
