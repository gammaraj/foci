import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** App-wide chip/badge shell — same metrics as task meta chips. */
export const BADGE_CLASS =
  "inline-flex items-center justify-center shrink-0 h-5 min-h-[1.25rem] px-1.5 gap-0.5 rounded border text-xs font-medium tabular-nums leading-none whitespace-nowrap";

export function Badge({
  children,
  toneClassName,
  className,
  title,
  caps = false,
}: {
  children: ReactNode;
  toneClassName?: string;
  className?: string;
  title?: string;
  caps?: boolean;
}) {
  return (
    <span
      title={title}
      className={cn(BADGE_CLASS, caps && "uppercase", toneClassName, className)}
    >
      {children}
    </span>
  );
}
