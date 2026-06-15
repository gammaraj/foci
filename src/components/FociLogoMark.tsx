import { FOCI_LOGO_SHADOW, FOCI_LOGO_SVG_STOPS } from "@/lib/logo-brand";

/** Shared Foci focus-ring logo — keep in sync with public/favicon.svg */
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
  const { highlight, warm, core, deep } = FOCI_LOGO_SVG_STOPS;
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
        <linearGradient id={`${p}-bg`} x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="24%" stopColor={warm} />
          <stop offset="58%" stopColor={core} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`${p}-shine`} x1="10" y1="4" x2="22" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7.5" fill={`url(#${p}-bg)`} />
      <rect width="32" height="32" rx="7.5" fill={`url(#${p}-shine)`} />
      <circle
        cx="16"
        cy="16"
        r="11.2"
        stroke="#ffffff"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="19.8 6.5"
        transform="rotate(-90 16 16)"
      />
      <circle
        cx="16"
        cy="16"
        r="7"
        stroke="#ffffff"
        strokeWidth="1.85"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="12.4 4.1"
        strokeOpacity={0.92}
        transform="rotate(15 16 16)"
      />
      <circle cx="16" cy="16" r="2.8" fill="#ffffff" />
    </svg>
  );
}

export { FOCI_LOGO_SHADOW };
