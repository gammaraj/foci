import type { SVGProps } from "react";
import { Icon, type IconSize } from "@/components/ui/Icon";

/** Common stroke paths used across chrome. */
export function CloseIcon({ size = "lg", ...rest }: { size?: IconSize } & SVGProps<SVGSVGElement>) {
  return (
    <Icon size={size} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </Icon>
  );
}

export function SearchIcon({ size = "sm", ...rest }: { size?: IconSize } & SVGProps<SVGSVGElement>) {
  return (
    <Icon size={size} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </Icon>
  );
}

export function CheckIcon({ size = "md", ...rest }: { size?: IconSize } & SVGProps<SVGSVGElement>) {
  return (
    <Icon size={size} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </Icon>
  );
}
