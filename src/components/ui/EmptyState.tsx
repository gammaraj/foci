import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  body,
  action,
  illustration,
  className,
  titleAs: TitleTag = "h3",
  titleClassName,
  bodyClassName,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  illustration?: ReactNode;
  className?: string;
  titleAs?: "h1" | "h2" | "h3";
  titleClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center gap-3 px-4", className)}>
      {illustration}
      <div className="space-y-1.5 max-w-md">
        <TitleTag
          className={cn(
            "font-semibold text-slate-900 dark:text-white",
            TitleTag === "h1" && "text-4xl font-bold tracking-tight",
            TitleTag === "h2" && "text-2xl font-bold",
            TitleTag === "h3" && "text-base",
            titleClassName,
          )}
        >
          {title}
        </TitleTag>
        {body ? (
          <p className={cn("text-sm app-text-meta leading-relaxed", bodyClassName)}>{body}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
