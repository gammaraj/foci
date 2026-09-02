"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";
import {
  buttonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button-styles";

export type { ButtonSize, ButtonVariant } from "@/components/ui/button-styles";
export { buttonClassName, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button-styles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClassName({ variant, size, className: cn(loading && "gap-2", className) })}
      {...rest}
    >
      {loading ? <Spinner size="sm" className="opacity-90" /> : null}
      {children}
    </button>
  );
});
