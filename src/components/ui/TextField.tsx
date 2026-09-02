import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldSize = "sm" | "md";

const PAD: Record<FieldSize, string> = {
  sm: "control-field--sm px-2 py-1 text-xs min-h-[1.875rem]",
  md: "px-3 py-1.5 text-sm min-h-[2rem]",
};

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  fieldSize?: FieldSize;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { fieldSize = "md", className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn("control-field w-full app-placeholder", PAD[fieldSize], className)}
      {...rest}
    />
  );
});

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldSize?: FieldSize;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ fieldSize = "md", className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn("control-field w-full app-placeholder", PAD[fieldSize], className)}
        {...rest}
      />
    );
  },
);
