/** Foci brand — ink + electric blue. Keep SVG, React, and OG assets in sync. */

export const FOCI_LOGO_BG = "#070b16";

/** Light-mode logo tile — soft blue-white so the mark matches a light navbar */
export const FOCI_LOGO_BG_LIGHT = "#eff6ff";

/** Primary brand color — blue-600 */
export const FOCI_BRAND_CYAN = "#2563eb";

/** @deprecated renamed to FOCI_BRAND_CYAN (legacy name; value is electric blue) */
export const FOCI_BRAND_ORANGE = FOCI_BRAND_CYAN;

export const FOCI_RING_COLORS = {
  dim: "#1d4ed8",    // blue-700 — dim arc segment
  mid: "#2563eb",    // blue-600 — main arc
  bright: "#3b82f6", // blue-500 — highlight
  glow: "#bfdbfe",   // blue-200 — glow/shimmer
} as const;

/** Aperture center dot — wordmark "i" tittle matches this on all surfaces */
export const FOCI_LOGO_DOT = "#3b82f6"; // blue-500

/** Wordmark on white/light pages — blue-700, strong on #fff */
export const FOCI_WORDMARK_ON_LIGHT = "#1d4ed8";

/** Wordmark on dark nav — blue-400 */
export const FOCI_WORDMARK_ON_DARK = "#60a5fa";

/** Decorative wordmark gradient for OG / social (dark backgrounds only) */
export const FOCI_WORDMARK_GRADIENT_DARK_BG_CSS =
  "linear-gradient(90deg, #3b82f6 0%, #2563eb 55%, #1d4ed8 100%)";

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_WORDMARK_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_LOGO_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

export const FOCI_LOGO_SVG_STOPS = FOCI_RING_COLORS;

/** Blue glow — dark chrome, hero on navy, OG tiles */
export const FOCI_LOGO_SHADOW_DARK =
  "shadow-[0_2px_10px_rgba(0,0,0,0.35),0_0_22px_rgba(59,130,246,0.38)] ring-1 ring-blue-400/40";

/** Flat frame — light pages, app store, PWA prompt (no muddy glow) */
export const FOCI_LOGO_SHADOW_LIGHT =
  "shadow-md shadow-slate-900/10 ring-1 ring-blue-600/25";

/** @deprecated Prefer getFociLogoShadow(surface) */
export const FOCI_LOGO_SHADOW = FOCI_LOGO_SHADOW_DARK;

export function getFociLogoShadow(surface: "dark" | "light"): string {
  return surface === "light" ? FOCI_LOGO_SHADOW_LIGHT : FOCI_LOGO_SHADOW_DARK;
}

export const FOCI_TAGLINE_FOCUS = "FOCUS · FLOW · FINISH";
export const FOCI_TAGLINE_CALM = "deep work, one calm window";

/** Wordmark typography — +10% vs standard Tailwind text steps (nav, lockup, mockup, inline). */
export const FOCI_WORDMARK_NAV = "text-[1.25rem] sm:text-[1.375rem] font-bold leading-none";
export const FOCI_WORDMARK_LOCKUP = "text-[1.65rem] sm:text-[2.0625rem] font-bold leading-none";
export const FOCI_WORDMARK_MOCKUP = "text-[1.2375rem] sm:text-[1.375rem] font-bold leading-none";
export const FOCI_WORDMARK_INLINE = "text-[0.9625rem] font-semibold";
export const FOCI_WORDMARK_OG_PX = 79;

/** Tagline typography — subordinate to wordmark, but readable (≥12px). */
export const FOCI_TAGLINE_NAV =
  "text-[0.6875rem] sm:text-[0.75rem] font-semibold tracking-[0.1em] sm:tracking-[0.12em] uppercase leading-none";
export const FOCI_TAGLINE_LOCKUP =
  "text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] sm:tracking-[0.13em] uppercase leading-none";
export const FOCI_TAGLINE_MOCKUP =
  "text-[7.5px] sm:text-[8.5px] font-semibold tracking-[0.11em] uppercase leading-none";
export const FOCI_TAGLINE_OG_PX = 13;

/** Tagline color on dark surfaces — blue-300 */
export const FOCI_TAGLINE_ON_DARK = "text-blue-300";
/** Tagline color on light surfaces — blue-700 */
export const FOCI_TAGLINE_ON_LIGHT = "text-blue-700";

/** Ring geometry for 32×32 viewBox */
export const FOCI_RING = {
  r: 10,
  stroke: 3.2,
  dash: "47.1 15.7",
  innerR: 6.5,
  dotR: 2.75,
  tileRx: 8,
} as const;
