"use client";

import React from "react";

import { doneMascotSmile } from "@/lib/done-today";

function mascotMood(todayCount: number, idleDays: number | null) {
  const smile = doneMascotSmile(todayCount, idleDays);
  if (todayCount > 0) return "happy" as const;
  if (smile < -0.4) return "sad" as const;
  return "ready" as const;
}

const MOOD_CLASS = {
  happy: "text-emerald-500 dark:text-emerald-300",
  ready: "text-blue-500 dark:text-sky-300",
  sad: "text-amber-500 dark:text-amber-300",
} as const;

/** Tiny Foci ring-face for the done bar. Smile amount comes from completions vs idle days. */
export function FociDoneMascot({
  todayCount,
  idleDays,
  size = 18,
  className = "",
}: {
  todayCount: number;
  idleDays: number | null;
  size?: number;
  className?: string;
}) {
  const smile = doneMascotSmile(todayCount, idleDays);
  const mood = mascotMood(todayCount, idleDays);
  const mouthY = 12.35;
  const controlY = mouthY + smile;
  const eyeY = smile < -0.9 ? 8.85 : 8.45;
  const eyeR = smile < -1.6 ? 0.85 : 1.05;
  const lid = smile < -0.4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={`shrink-0 ${MOOD_CLASS[mood]} ${className}`.trim()}
      aria-hidden
    >
      <circle cx="10" cy="10" r="7.6" className="fill-current" opacity={0.22} />
      <circle cx="10" cy="10" r="7.35" stroke="currentColor" strokeWidth="1.85" />
      {lid ? (
        <>
          <path
            d={`M ${7.15 - eyeR} ${eyeY} Q 7.15 ${eyeY + 1.15} ${7.15 + eyeR} ${eyeY}`}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d={`M ${12.85 - eyeR} ${eyeY} Q 12.85 ${eyeY + 1.15} ${12.85 + eyeR} ${eyeY}`}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="7.15" cy={eyeY} r={eyeR} fill="currentColor" />
          <circle cx="12.85" cy={eyeY} r={eyeR} fill="currentColor" />
        </>
      )}
      <path
        d={`M 6.55 ${mouthY} Q 10 ${controlY} 13.45 ${mouthY}`}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
