/** Foci Concept A — orange ring & dot. Keep SVG, React, and OG assets in sync. */

export const FOCI_LOGO_BG = "#0b1121";

export const FOCI_RING_COLORS = {
  dim: "#7c2d12",
  mid: "#ea580c",
  bright: "#fb923c",
  glow: "#fdba74",
} as const;

export const FOCI_LOGO_DOT = "#f97316";

export const FOCI_WORDMARK_GRADIENT_CSS =
  "linear-gradient(90deg, #fb923c 0%, #f97316 45%, #ea580c 100%)";

/** @deprecated Use FOCI_WORDMARK_GRADIENT_CSS — kept for OG exports */
export const FOCI_LOGO_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_CSS;

export const FOCI_LOGO_SVG_STOPS = FOCI_RING_COLORS;

export const FOCI_LOGO_SHADOW =
  "shadow-[0_2px_10px_rgba(0,0,0,0.35),0_0_18px_rgba(249,115,22,0.22)] ring-1 ring-orange-500/25";

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
