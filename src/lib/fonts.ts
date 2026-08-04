import { Inter, Plus_Jakarta_Sans } from "next/font/google";

/** Primary UI typeface — loaded via next/font for consistent rendering. */
export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

/** Brand wordmark — geometric display face; keeps “foci” distinct from UI Inter. */
export const fontWordmark = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-wordmark",
  weight: ["500", "600", "700"],
});
