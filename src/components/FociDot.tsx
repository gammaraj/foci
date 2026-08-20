export type FociDotMood =
  | "happy"
  | "ready"
  | "focusing"
  | "meh"
  | "sad"
  | "lost"
  | "worried";

const SMILE: Record<FociDotMood, number> = {
  happy: 2.6,
  ready: 0.9,
  focusing: 0.15,
  meh: 0,
  sad: -2.1,
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

/** Foci mascot — the logo aperture with a face. Uses currentColor so it works without Tailwind. */
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
  const mouthY = 20.2;
  const controlY = mouthY + smile;
  const lookX = mood === "lost" ? 1.6 : mood === "focusing" ? 0 : 0;
  const eyeY = mood === "sad" || mood === "worried" ? 13.7 : 13.15;
  const eyeR = mood === "focusing" ? 1.15 : mood === "sad" ? 1.2 : 1.45;
  const lid = mood === "sad" || mood === "worried";
  const leftEyeX = 12.2 + lookX;
  const rightEyeX = 19.8 + lookX;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`shrink-0 ${MOOD_CLASS[mood]} ${className}`.trim()}
      aria-hidden
    >
      <circle cx="16" cy="16" r="12.2" fill="currentColor" opacity={0.18} />
      <circle cx="16" cy="16" r="11.6" stroke="currentColor" strokeWidth="2.1" />
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
            d={`M ${leftEyeX - 1.8} ${eyeY - 3.1} L ${leftEyeX + 0.4} ${eyeY - 2.2}`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d={`M ${rightEyeX + 1.8} ${eyeY - 3.1} L ${rightEyeX - 0.4} ${eyeY - 2.2}`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      ) : null}
      <path
        d={`M 11.2 ${mouthY} Q 16 ${controlY} 20.8 ${mouthY}`}
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}
