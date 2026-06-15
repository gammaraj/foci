import { ImageResponse } from "next/og";
import { OgLogoMark } from "@/lib/og-logo-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<OgLogoMark size={180} />, { ...size });
}
