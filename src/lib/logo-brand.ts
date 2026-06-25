/** Foci brand — darker cyan ring & dot. Keep SVG, React, and OG assets in sync. */

export const FOCI_LOGO_BG = "#0b1121";

/** Primary brand color — cyan-600 */
export const FOCI_BRAND_CYAN = "#0891b2";

/** @deprecated renamed to FOCI_BRAND_CYAN */
export const FOCI_BRAND_ORANGE = FOCI_BRAND_CYAN;

export const FOCI_RING_COLORS = {
  dim: "#0e7490",    // cyan-700 — dim arc segment
  mid: "#0891b2",    // cyan-600 — main arc
  bright: "#06b6d4", // cyan-500 — highlight
  glow: "#a5f3fc",   // cyan-200 — glow/shimmer
} as const;

/** Aperture center dot — wordmark "i" tittle matches this on all surfaces */
export const FOCI_LOGO_DOT = "#06b6d4"; // cyan-500

/** Wordmark on white/light pages — cyan-700, ~5.4:1 on #fff (AA) */
export const FOCI_WORDMARK_ON_LIGHT = "#0e7490";

/** Wordmark on dark nav — cyan-400, ~7:1 on #0b1121 (AAA) */
export const FOCI_WORDMARK_ON_DARK = "#22d3ee";

/** Decorative wordmark gradient for OG / social (dark backgrounds only) */
export const FOCI_WORDMARK_GRADIENT_DARK_BG_CSS =
  "linear-gradient(90deg, #06b6d4 0%, #0891b2 55%, #0e7490 100%)";

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_WORDMARK_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_LOGO_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

export const FOCI_LOGO_SVG_STOPS = FOCI_RING_COLORS;

/** Cyan glow — dark chrome, hero on navy, OG tiles */
export const FOCI_LOGO_SHADOW_DARK =
  "shadow-[0_2px_10px_rgba(0,0,0,0.35),0_0_22px_rgba(6,182,212,0.38)] ring-1 ring-cyan-400/40";

/** Flat frame — light pages, app store, PWA prompt (no muddy glow) */
export const FOCI_LOGO_SHADOW_LIGHT =
  "shadow-md shadow-slate-900/10 ring-1 ring-cyan-600/25";

/** @deprecated Prefer getFociLogoShadow(surface) */
export const FOCI_LOGO_SHADOW = FOCI_LOGO_SHADOW_DARK;

export function getFociLogoShadow(surface: "dark" | "light"): string {
  return surface === "light" ? FOCI_LOGO_SHADOW_LIGHT : FOCI_LOGO_SHADOW_DARK;
}

export const FOCI_TAGLINE_FOCUS = "FOCUS · FLOW · FINISH";
export const FOCI_TAGLINE_CALM = "deep work, one calm window";

/** Wordmark typography — +10% vs standard Tailwind text steps (nav, lockup, mockup, inline). */
export const FOCI_WORDMARK_NAV = "text-[1.375rem] sm:text-[1.65rem] font-bold leading-none";
export const FOCI_WORDMARK_LOCKUP = "text-[1.65rem] sm:text-[2.0625rem] font-bold leading-none";
export const FOCI_WORDMARK_MOCKUP = "text-[1.2375rem] sm:text-[1.375rem] font-bold leading-none";
export const FOCI_WORDMARK_INLINE = "text-[0.9625rem] font-semibold";
export const FOCI_WORDMARK_OG_PX = 79;

/** Tagline typography — clearly subordinate to wordmark (lighter weight, tighter tracking). */
export const FOCI_TAGLINE_NAV =
  "text-[7px] sm:text-[8px] font-medium tracking-[0.14em] sm:tracking-[0.15em] uppercase leading-none";
export const FOCI_TAGLINE_LOCKUP =
  "text-[8px] sm:text-[9px] font-medium tracking-[0.14em] sm:tracking-[0.15em] uppercase leading-none";
export const FOCI_TAGLINE_MOCKUP =
  "text-[6.5px] sm:text-[7.5px] font-medium tracking-[0.13em] uppercase leading-none";
export const FOCI_TAGLINE_OG_PX = 11;

/** Ring geometry for 32×32 viewBox */
export const FOCI_RING = {
  r: 10,
  stroke: 3.2,
  dash: "47.1 15.7",
  innerR: 6.5,
  dotR: 2.75,
  tileRx: 8,
} as const;
