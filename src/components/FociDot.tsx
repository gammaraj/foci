export type FociDotMood =
  | "happy"
  | "ready"
  | "focusing"
  | "meh"
  | "sad"
  | "lost"
  | "worried";

const SMILE: Record<FociDotMood, number> = {
  happy: 2.4,
  ready: 0.9,
  focusing: 0.15,
  meh: 0,
  sad: -2.0,
  lost: -0.5,
  worried: -1.4,
};

const MOOD_CLASS: Record<FociDotMood, string> = {
  happy: "text-emerald-500 dark:text-emerald-300",
  ready: "text-blue-500 dark:text-sky-300",
  focusing: "text-blue-600 dark:text-blue-300",
  meh: "text-slate-500 dark:text-slate-400",
  sad: "text-amber-500 dark:text-amber-300",
  lost: "text-blue-500 dark:text-sky-300",
  worried: "text-amber-500 dark:text-amber-300",
};

/** Beavy the Beaver — small mood face for the Done bar and empty states. Uses currentColor. */
export function FociDot({
  mood = "ready",
  size = 48,
  className = "",
}: {
  mood?: FociDotMood;
  size?: number;
  className?: string;
}) {
  const smile = SMILE[mood];
  const mouthY = 20.6;
  const controlY = mouthY + smile;
  const lookX = mood === "lost" ? 1.5 : 0;
  const eyeY = mood === "sad" || mood === "worried" ? 13.5 : 12.9;
  const eyeR = mood === "focusing" ? 1.15 : mood === "sad" ? 1.2 : 1.45;
  const lid = mood === "sad" || mood === "worried";
  const leftEyeX = 12.0 + lookX;
  const rightEyeX = 20.0 + lookX;
  const showTeeth = smile >= 0.4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 ${MOOD_CLASS[mood]} ${className}`.trim()}
      aria-hidden
    >
      {/* paddle tail */}
      <ellipse
        cx="5.2"
        cy="22.4"
        rx="4.2"
        ry="2.15"
        transform="rotate(-28 5.2 22.4)"
        fill="currentColor"
        opacity={0.18}
      />
      <ellipse
        cx="5.2"
        cy="22.4"
        rx="4.2"
        ry="2.15"
        transform="rotate(-28 5.2 22.4)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* ears */}
      <ellipse cx="9.0" cy="8.4" rx="3.15" ry="3.5" fill="currentColor" opacity={0.18} />
      <ellipse cx="23.0" cy="8.4" rx="3.15" ry="3.5" fill="currentColor" opacity={0.18} />
      <ellipse cx="9.0" cy="8.4" rx="3.15" ry="3.5" stroke="currentColor" strokeWidth="1.7" />
      <ellipse cx="23.0" cy="8.4" rx="3.15" ry="3.5" stroke="currentColor" strokeWidth="1.7" />
      <ellipse cx="9.0" cy="8.7" rx="1.45" ry="1.65" fill="currentColor" opacity={0.35} />
      <ellipse cx="23.0" cy="8.7" rx="1.45" ry="1.65" fill="currentColor" opacity={0.35} />
      {/* head */}
      <ellipse cx="16" cy="17.4" rx="11.1" ry="10.5" fill="currentColor" opacity={0.18} />
      <ellipse cx="16" cy="17.4" rx="10.6" ry="10.0" stroke="currentColor" strokeWidth="2.05" />
      {/* snout */}
      <ellipse cx="16" cy="20.6" rx="5.4" ry="4.0" fill="currentColor" opacity={0.12} />
      {/* nose */}
      <ellipse cx="16" cy="18.15" rx="1.45" ry="1.05" fill="currentColor" />
      {lid ? (
        <>
          <path
            d={`M ${leftEyeX - eyeR} ${eyeY} Q ${leftEyeX} ${eyeY + 1.5} ${leftEyeX + eyeR} ${eyeY}`}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d={`M ${rightEyeX - eyeR} ${eyeY} Q ${rightEyeX} ${eyeY + 1.5} ${rightEyeX + eyeR} ${eyeY}`}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx={leftEyeX} cy={eyeY} r={eyeR} fill="currentColor" />
          <circle cx={rightEyeX} cy={eyeY} r={eyeR} fill="currentColor" />
        </>
      )}
      {mood === "worried" ? (
        <>
          <path
            d={`M ${leftEyeX - 1.8} ${eyeY - 3.0} L ${leftEyeX + 0.4} ${eyeY - 2.1}`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d={`M ${rightEyeX + 1.8} ${eyeY - 3.0} L ${rightEyeX - 0.4} ${eyeY - 2.1}`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {showTeeth ? (
        <>
          <rect x="14.25" y={mouthY + 0.15} width="1.65" height="2.15" rx="0.35" fill="currentColor" />
          <rect x="16.1" y={mouthY + 0.15} width="1.65" height="2.15" rx="0.35" fill="currentColor" />
        </>
      ) : null}
      <path
        d={`M 11.4 ${mouthY} Q 16 ${controlY} 20.6 ${mouthY}`}
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}
