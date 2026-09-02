import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

export type IconSize = "sm" | "md" | "lg";

const SIZE: Record<IconSize, string> = {
  sm: "icon-sm",
  md: "icon-md",
  lg: "icon-lg",
};

/** Shared stroke icon wrapper — default weight 2, sizes sm/md/lg. */
export function Icon({
  size = "md",
  strokeWidth = 2,
  className,
  children,
  ...rest
}: SVGProps<SVGSVGElement> & {
  size?: IconSize;
  children: ReactNode;
}) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
      strokeWidth={strokeWidth}
      className={cn(SIZE[size], "shrink-0", className)}
      {...rest}
    >
      {children}
    </svg>
  );
}
