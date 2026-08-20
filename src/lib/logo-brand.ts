/** Foci brand — ink + electric blue. Keep SVG, React, and OG assets in sync. */

/** Dark logo tile — lifted above page navy (#070b16) so the mark reads as a badge */
export const FOCI_LOGO_BG = "#0f172a";

/** Light-mode logo tile — soft blue-white so the mark matches a light navbar */
export const FOCI_LOGO_BG_LIGHT = "#eff6ff";

/** Primary brand color — blue-600 */
export const FOCI_BRAND_CYAN = "#2563eb";

/** @deprecated renamed to FOCI_BRAND_CYAN (legacy name; value is electric blue) */
export const FOCI_BRAND_ORANGE = FOCI_BRAND_CYAN;

export const FOCI_RING_COLORS = {
  dim: "#2563eb",    // blue-600 — dim arc segment
  mid: "#3b82f6",    // blue-500 — main arc
  bright: "#60a5fa", // blue-400 — highlight
  glow: "#dbeafe",   // blue-100 — glow/shimmer
} as const;

/** Aperture center dot — wordmark "i" tittle matches this on all surfaces */
export const FOCI_LOGO_DOT = "#60a5fa"; // blue-400

/** Wordmark on white/light pages — blue-700, strong on #fff */
export const FOCI_WORDMARK_ON_LIGHT = "#1d4ed8";

/** Solid CTA fill — same as wordmark on light surfaces */
export const FOCI_BUTTON_BG = FOCI_WORDMARK_ON_LIGHT;

/** Wordmark on dark nav — blue-300 */
export const FOCI_WORDMARK_ON_DARK = "#93c5fd";

/** Decorative wordmark gradient for OG / social (dark backgrounds only) */
export const FOCI_WORDMARK_GRADIENT_DARK_BG_CSS =
  "linear-gradient(90deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)";

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_WORDMARK_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

/** @deprecated Use FOCI_WORDMARK_GRADIENT_DARK_BG_CSS — kept for OG exports */
export const FOCI_LOGO_GRADIENT_CSS = FOCI_WORDMARK_GRADIENT_DARK_BG_CSS;

export const FOCI_LOGO_SVG_STOPS = FOCI_RING_COLORS;

/** Blue glow — dark chrome, hero on navy, OG tiles */
export const FOCI_LOGO_SHADOW_DARK =
  "shadow-[0_2px_12px_rgba(0,0,0,0.4),0_0_28px_rgba(59,130,246,0.52)] ring-1 ring-blue-400/55";

/** Flat frame — light pages, app store, PWA prompt (no muddy glow) */
export const FOCI_LOGO_SHADOW_LIGHT =
  "shadow-md shadow-slate-900/10 ring-1 ring-blue-600/30";
/** @deprecated Prefer getFociLogoShadow(surface) */
export const FOCI_LOGO_SHADOW = FOCI_LOGO_SHADOW_DARK;

export function getFociLogoShadow(surface: "dark" | "light"): string {
  return surface === "light" ? FOCI_LOGO_SHADOW_LIGHT : FOCI_LOGO_SHADOW_DARK;
}

export const FOCI_TAGLINE_FOCUS = "FOCUS · FLOW · FINISH";
export const FOCI_TAGLINE_CALM = "deep work, one calm window";

/** Homepage H1 — tasks first; guest use OK, account optional for sync. */
export const FOCI_HERO_HEADLINE = "Plan your day. Finish your tasks.";

/** Wordmark typography — Plus Jakarta Sans; bold not extrabold (less early-2010s chunk). */
export const FOCI_WORDMARK_NAV =
  "font-wordmark text-[1.625rem] sm:text-[1.8125rem] font-bold leading-none tracking-[-0.04em]";
export const FOCI_WORDMARK_LOCKUP =
  "font-wordmark text-[1.75rem] sm:text-[2.125rem] font-bold leading-none tracking-[-0.04em]";
export const FOCI_WORDMARK_MOCKUP =
  "font-wordmark text-[1.375rem] sm:text-[1.5rem] font-bold leading-none tracking-[-0.04em]";
export const FOCI_WORDMARK_INLINE = "font-wordmark text-[1rem] font-semibold tracking-[-0.02em]";
export const FOCI_WORDMARK_OG_PX = 86;

/** Tagline typography — subordinate to the wordmark, still ≥10px. */
export const FOCI_TAGLINE_NAV =
  "text-[0.625rem] sm:text-[0.6875rem] font-medium tracking-[0.12em] sm:tracking-[0.14em] uppercase leading-none";
export const FOCI_TAGLINE_LOCKUP =
  "text-[10px] sm:text-[11px] font-medium tracking-[0.1em] sm:tracking-[0.12em] uppercase leading-none";
export const FOCI_TAGLINE_MOCKUP =
  "text-[0.625rem] sm:text-[0.6875rem] font-medium tracking-[0.12em] uppercase leading-none";
export const FOCI_TAGLINE_OG_PX = 12;

/** Tagline color on dark surfaces — softer than wordmark */
export const FOCI_TAGLINE_ON_DARK = "text-blue-200";
/** Tagline color on light surfaces — softer than wordmark */
export const FOCI_TAGLINE_ON_LIGHT = "text-slate-600";

/** Ring geometry for 32×32 viewBox */
export const FOCI_RING = {
  r: 10,
  stroke: 3.2,
  dash: "47.1 15.7",
  innerR: 6.5,
  dotR: 2.75,
  tileRx: 8,
} as const;
