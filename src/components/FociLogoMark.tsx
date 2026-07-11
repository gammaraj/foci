import {
  FOCI_LOGO_BG,
  FOCI_LOGO_BG_LIGHT,
  FOCI_LOGO_DOT,
  FOCI_RING,
  FOCI_RING_COLORS,
  FOCI_TAGLINE_FOCUS,
  FOCI_TAGLINE_LOCKUP,
  FOCI_TAGLINE_ON_DARK,
  FOCI_TAGLINE_ON_LIGHT,
  FOCI_WORDMARK_LOCKUP,
  FOCI_WORDMARK_ON_DARK,
  FOCI_WORDMARK_ON_LIGHT,
  getFociLogoShadow,
} from "@/lib/logo-brand";

/** Shared Foci ring-and-dot mark — keep in sync with public/favicon.svg */
export function FociLogoMark({
  size = 32,
  className,
  idPrefix = "mark",
  surface = "dark",
}: {
  size?: number;
  className?: string;
  idPrefix?: string;
  /** "dark" = glow on navy; "light" = light tile for white backgrounds */
  surface?: "dark" | "light";
}) {
  const p = idPrefix;
  const { dim, mid, bright } = FOCI_RING_COLORS;
  const { r, stroke, dash, innerR, dotR, tileRx } = FOCI_RING;
  const shadowClass = getFociLogoShadow(surface);
  const tileFill = surface === "light" ? FOCI_LOGO_BG_LIGHT : FOCI_LOGO_BG;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="geometricPrecision"
      className={`${shadowClass} ${className ?? ""}`.trim()}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${p}-ring`} x1="9" y1="25" x2="25" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={dim} />
          <stop offset="50%" stopColor={mid} />
          <stop offset="100%" stopColor={bright} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx={tileRx} fill={tileFill} />
      <circle cx="16" cy="16" r={r} stroke={mid} strokeOpacity={0.14} strokeWidth={stroke} fill="none" />
      <circle
        cx="16"
        cy="16"
        r={r}
        stroke={`url(#${p}-ring)`}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={dash}
        transform="rotate(-90 16 16)"
      />
      <circle cx="16" cy="16" r={innerR} stroke={mid} strokeOpacity={0.2} strokeWidth={1} fill="none" />
      <circle cx="16" cy="16" r={dotR} fill={FOCI_LOGO_DOT} />
    </svg>
  );
}

/** Lowercase wordmark — saturated orange aligned with icon; “i” tittle echoes aperture dot */
export function FociWordmark({
  className = "",
  tone = "dark",
}: {
  className?: string;
  /** "dark" = on nav/dark chrome; "light" = on white/light pages */
  tone?: "dark" | "light";
}) {
  const color = tone === "light" ? FOCI_WORDMARK_ON_LIGHT : FOCI_WORDMARK_ON_DARK;

  return (
    <span
      className={`font-semibold tracking-tight lowercase inline-flex items-baseline ${className}`}
      aria-label="foci"
    >
      <span style={{ color }}>foc</span>
      <span className="relative inline-block">
        <span
          className="pointer-events-none absolute left-1/2 z-[1] -translate-x-1/2 rounded-full"
          style={{
            width: "0.26em",
            height: "0.26em",
            top: "0.04em",
            backgroundColor: FOCI_LOGO_DOT,
          }}
          aria-hidden
        />
        <span style={{ color }}>i</span>
      </span>
    </span>
  );
}

/** Mark + wordmark + optional focus tagline (landing, marketing) */
export function FociBrandLockup({
  markSize = 48,
  showTagline = false,
  idPrefix = "lockup",
  className = "",
  tone = "light",
}: {
  markSize?: number;
  showTagline?: boolean;
  idPrefix?: string;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className={`flex items-center gap-3 sm:gap-3.5 ${className}`}>
      <FociLogoMark
        size={markSize}
        idPrefix={idPrefix}
        surface={tone}
        className="flex-shrink-0 rounded-xl sm:rounded-2xl"
      />
      <div className="flex flex-col items-start gap-0.5 min-w-0">
        <FociWordmark className={FOCI_WORDMARK_LOCKUP} tone={tone} />
        {showTagline && (
          <p
            className={`${FOCI_TAGLINE_LOCKUP} ${
              tone === "light" ? FOCI_TAGLINE_ON_LIGHT : FOCI_TAGLINE_ON_DARK
            }`}
          >
            {FOCI_TAGLINE_FOCUS}
          </p>
        )}
      </div>
    </div>
  );
}

export { getFociLogoShadow } from "@/lib/logo-brand";
