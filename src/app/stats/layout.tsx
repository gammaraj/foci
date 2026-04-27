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
    "pomodoro stats",
    "work time analysis",
    "focus session history",
    "productivity insights",
    "time management analytics",
    "session goal tracking",
    "focus habit tracking",
  ],
  alternates: { canonical: "/stats" },
  openGraph: {
    title,
    description,
    url: "https://usefoci.com/stats",
    type: "website",
    siteName: "Foci",
    images: [
      {
        url: "https://usefoci.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Foci Productivity Stats Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://usefoci.com/twitter-image"],
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
