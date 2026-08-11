import type { Metadata } from "next";
import AppSeoShell from "@/components/AppSeoShell";
import { absolutePageTitle } from "@/lib/site-metadata";
import { FOCI_APP_DESCRIPTION, APP_KEYWORDS } from "@/lib/product-facts";

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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppSeoShell>{children}</AppSeoShell>;
}
