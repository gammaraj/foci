import type { Metadata } from "next";
import { absolutePageTitle } from "@/lib/site-metadata";

const title = "Free Pomodoro App | Timer, Tasks & Ambient Sounds";
const description =
  "Best free Pomodoro app — timer with task tracking, Smart Plan, daily goals, streaks, brown noise, and lo-fi. Start a focus session at usefoci.com/app, no signup.";

export const metadata: Metadata = {
  title: absolutePageTitle(title),
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
    "free pomodoro app",
    "best free pomodoro app",
    "pomodoro app free",
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
