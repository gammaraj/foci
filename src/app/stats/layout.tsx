import type { Metadata } from "next";

const title = "Productivity Stats – Foci";
const description =
  "Track your focus sessions with detailed productivity analytics: session heatmaps, per-project time charts, streak history, and daily/weekly/monthly breakdowns.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "productivity stats",
    "focus analytics",
    "session tracking",
    "productivity dashboard",
    "time tracking",
    "work session heatmap",
    "productivity charts",
    "streak tracking",
    "daily goals",
    "focus metrics",
  ],
  alternates: { canonical: "/stats" },
  openGraph: {
    title,
    description,
    url: "https://usefoci.com/stats",
    type: "website",
    siteName: "Foci",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
