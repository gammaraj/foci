"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Shared App Focus Bar title recipe:
 * [Back chip] [h1 title] [quiet meta] [trailing] · music/timer · [page action] [icons]
 */
export function FocusBarBackButton({
  label,
  onClick,
  "data-tour": dataTour,
}: {
  label: string;
  onClick: () => void;
  "data-tour"?: string;
}) {
  return (
    <Button
      type="button"
      variant="chipActive"
      size="sm"
      className="no-print gap-1 min-h-[2rem] shrink-0 touch-target-sm"
      onClick={onClick}
      title={`Return to ${label} view`}
      aria-label={`Back to ${label}`}
      data-tour={dataTour}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span className="hidden min-[480px]:inline">Back to </span>
      {label}
    </Button>
  );
}

export function FocusBarMeta({
  children,
  nowrap = false,
  className,
}: {
  children: ReactNode;
  nowrap?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-xs font-medium text-slate-500 dark:text-slate-400 normal-case tracking-normal",
        nowrap ? "shrink-0" : "min-w-0 truncate",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FocusBarHeading({
  back,
  leading,
  children,
  meta,
  trailing,
  title,
}: {
  back?: ReactNode;
  leading?: ReactNode;
  children: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {back}
      <h1 className="text-base sm:text-lg font-semibold tracking-tight flex items-center gap-1.5 min-w-0 text-slate-800 dark:text-white leading-none">
        {leading}
        <span className="truncate min-w-0" title={title}>
          {children}
        </span>
      </h1>
      {meta}
      {trailing}
    </div>
  );
}

/** Right-side focus-bar cluster — page control first, then icon actions. */
export function FocusBarActionRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("no-print flex items-center gap-1.5 flex-shrink-0", className)}>
      {children}
    </div>
  );
}
