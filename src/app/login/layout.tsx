import type { Metadata } from "next";

const title = "Log In – Foci | Focus Timer & Pomodoro App";
const description =
  "Sign in or create a free Foci account to sync your Pomodoro timer settings, tasks, and streak data across devices.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
  openGraph: {
    title,
    description,
    url: "https://usefoci.com/login",
    type: "website",
    siteName: "Foci",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
