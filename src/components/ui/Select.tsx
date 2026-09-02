import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldSize = "sm" | "md";

const CHEVRON =
  "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.3rem_center] bg-no-repeat pr-5";

const PAD: Record<FieldSize, string> = {
  sm: "control-field--sm px-1.5 py-1 text-xs min-h-[2rem]",
  md: "px-2 py-1.5 text-sm min-h-[2rem]",
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  fieldSize?: FieldSize;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { fieldSize = "md", className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn("control-field min-w-0 truncate", CHEVRON, PAD[fieldSize], className)}
      {...rest}
    >
      {children}
    </select>
  );
});

/** Shared class string for selects that can't use the component yet. */
export const SELECT_FIELD_CLASS = cn("control-field min-w-0 truncate", CHEVRON, PAD.sm);
