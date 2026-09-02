import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "chip" | "chipActive" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  chip: "btn-chip",
  chipActive: "btn-chip-active",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  return cn(BUTTON_VARIANT[variant], BUTTON_SIZE[size], className);
}
