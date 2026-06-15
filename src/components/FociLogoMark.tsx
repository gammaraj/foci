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
        <linearGradient id={`${p}-bg`} x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="65%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id={`${p}-shine`} x1="16" y1="3" x2="16" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
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

export const FOCI_LOGO_SHADOW =
  "shadow-[0_1px_2px_rgba(234,88,12,0.4),0_4px_12px_rgba(251,191,36,0.28)] ring-1 ring-white/30";
