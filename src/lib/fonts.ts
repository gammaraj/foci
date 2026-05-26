import { Plus_Jakarta_Sans } from "next/font/google";

/** Primary brand typeface — loaded via next/font for consistent rendering. */
export const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
