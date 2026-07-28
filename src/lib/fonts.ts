import { Inter } from "next/font/google";

/** Primary UI typeface — loaded via next/font for consistent rendering. */
export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});
