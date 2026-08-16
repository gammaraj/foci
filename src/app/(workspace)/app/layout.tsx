import type { Metadata } from "next";
import AppSeoShell from "@/components/AppSeoShell";
import { absolutePageTitle } from "@/lib/site-metadata";
import { FOCI_APP_DESCRIPTION, APP_KEYWORDS } from "@/lib/product-facts";
import AppPageClient from "./AppPageClient";

const title = "Free Pomodoro Timer App — Tasks, Sounds & Streaks";
const description = FOCI_APP_DESCRIPTION;

export const metadata: Metadata = {
  title: absolutePageTitle(title),
  description,
  keywords: [...APP_KEYWORDS],
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

/**
 * Keep the tasks workspace mounted in the layout so `/app/cards` ↔ `/app/plan`
 * only changes the URL segment — TaskList state must not remount (that flashed Cards).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSeoShell>
      <AppPageClient />
      {children}
    </AppSeoShell>
  );
}
