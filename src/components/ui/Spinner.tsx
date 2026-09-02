import { cn } from "@/lib/cn";

export type SpinnerSize = "sm" | "md" | "lg";

const SIZE: Record<SpinnerSize, string> = {
  sm: "ui-spinner--sm",
  md: "ui-spinner--md",
  lg: "ui-spinner--lg",
};

export function Spinner({
  size = "md",
  className,
  label = "Loading",
}: {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("ui-spinner", SIZE[size], className)}
    />
  );
}
