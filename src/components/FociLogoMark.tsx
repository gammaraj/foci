import {
  FOCI_LOGO_BG,
  FOCI_LOGO_DOT,
  FOCI_LOGO_SHADOW,
  FOCI_RING,
  FOCI_RING_COLORS,
  FOCI_TAGLINE_FOCUS,
  FOCI_WORDMARK_GRADIENT_CSS,
} from "@/lib/logo-brand";

/** Shared Foci ring-and-dot mark — keep in sync with public/favicon.svg */
export function FociLogoMark({
  size = 32,
  className,
  idPrefix = "mark",
}: {
  size?: number;
  className?: string;
  idPrefix?: string;
}) {
  const p = idPrefix;
  const { dim, mid, bright } = FOCI_RING_COLORS;
  const { r, stroke, dash, innerR, dotR, tileRx } = FOCI_RING;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      shapeRendering="geometricPrecision"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${p}-ring`} x1="9" y1="25" x2="25" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={dim} />
          <stop offset="50%" stopColor={mid} />
          <stop offset="100%" stopColor={bright} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx={tileRx} fill={FOCI_LOGO_BG} />
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

/** Lowercase wordmark — pair with FociLogoMark */
export function FociWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-semibold tracking-tight lowercase bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage: FOCI_WORDMARK_GRADIENT_CSS }}
    >
      foci
    </span>
  );
}

/** Mark + wordmark + optional focus tagline (landing, marketing) */
export function FociBrandLockup({
  markSize = 48,
  showTagline = false,
  idPrefix = "lockup",
  className = "",
}: {
  markSize?: number;
  showTagline?: boolean;
  idPrefix?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 sm:gap-3.5 ${className}`}>
      <FociLogoMark
        size={markSize}
        idPrefix={idPrefix}
        className={`flex-shrink-0 rounded-xl sm:rounded-2xl ${FOCI_LOGO_SHADOW}`}
      />
      <div className="flex flex-col items-start gap-0.5 min-w-0">
        <FociWordmark className="text-2xl sm:text-3xl font-bold leading-none" />
        {showTagline && (
          <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.18em] uppercase text-orange-500/85 dark:text-orange-400/85">
            {FOCI_TAGLINE_FOCUS}
          </p>
        )}
      </div>
    </div>
  );
}

export { FOCI_LOGO_SHADOW };
