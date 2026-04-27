import type { Metadata } from "next";

const title = "Focus Timer App – Foci | Pomodoro, Tasks & Ambient Sounds";
const description =
  "Start your focus session now: Pomodoro timer with task tracking, Smart Plan scheduling, daily goals, streaks, and built-in ambient sounds like brown noise and rain. Free, no signup required.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "focus timer",
    "pomodoro app",
    "productivity timer",
    "task tracker",
    "ambient sounds",
    "brown noise",
    "study timer",
    "focus music",
    "work session timer",
    "deep work app",
    "free pomodoro",
    "online timer",
    "flowtime technique",
    "52/17 rule timer",
    "pomodoro technique app",
    "focus app free",
    "work break timer",
    "tomato timer",
    "concentration timer",
    "time management app",
  ],
  alternates: { canonical: "/app" },
  openGraph: {
    title,
    description,
    url: "https://usefoci.com/app",
    type: "website",
    siteName: "Foci",
    images: [
      {
        url: "https://usefoci.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Foci Focus Timer App",
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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
