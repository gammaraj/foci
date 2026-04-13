import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Validate GA measurement ID format to prevent script injection
const SAFE_GA_ID = GA_ID && /^G-[A-Z0-9]+$/.test(GA_ID) ? GA_ID : undefined;

const siteUrl = "https://usefoci.com";
const title = "Foci – Your Focus System: Timer, Tasks, Smart Plan & Ambient Music";
const description =
  "Foci is a free all-in-one focus system: Pomodoro timer, task tracking, Smart Plan scheduling, daily goals, streak stats, and built-in ambient music. Everything you need to stay productive, in one window.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s – Foci",
  },
  applicationName: "Foci",
  description,
  keywords: [
    "focus system",
    "pomodoro timer",
    "focus timer",
    "productivity app",
    "task tracker",
    "daily goals",
    "streak tracker",
    "ambient music for focus",
    "lo-fi focus music",
    "focus sounds",
    "online timer",
    "time management",
    "foci app",
    "pomodoro technique",
    "study timer",
    "concentration timer",
    "work session timer",
    "free pomodoro app",
    "focus app",
    "deep work timer",
    "productivity tracker",
    "time tracking",
    "work break timer",
    "tomato timer",
    "brown noise for studying",
    "brown noise focus",
    "ambient sounds for studying",
    "deep work app",
    "AI productivity",
    "focus music",
    "adhd focus tools",
    "white noise study",
    "import tasks from google tasks",
    "import tasks from todoist",
    "import tasks from asana",
    "import tasks from notion",
    "export tasks csv json",
    "task migration tool",
    "todoist alternative",
    "google tasks alternative",
    "asana alternative for individuals",
    "notion task manager alternative",
    "smart task scheduler",
    "task planning tool",
    "daily task planner",
    "project color coding",
    "due date tracker",
    "task prioritization",
    "focus analytics",
    "productivity stats dashboard",
    "time blocking",
    "time blocking method",
    "digital detox",
    "screen time productivity",
    "morning routine productivity",
    "task batching",
    "context switching",
    "2 minute rule",
    "GTD getting things done",
    "atomic habits",
    "procrastination tips",
    "recurring tasks",
    "repeating tasks",
    "task recurrence",
    "subtask due dates",
    "move tasks between projects",
    "calendar task view",
    "fullscreen focus mode",
    "Indian classical music study",
    "Indian ambient music focus",
    "due date reminders",
    "task templates",
    "timer presets",
    "onboarding tour",
    "weather widget",
    "Spotify focus playlists",
    "collapsible timer",
    "daily goal presets",
    "ADHD focus strategies",
    "best music for studying",
    "study music playlists",
    "focus music for ADHD",
    "AI focus assistant",
    "llm productivity tools",
    "focus app 2026",
    "stoicism productivity",
    "mindful productivity",
    "work from home focus",
    "remote work timer",
    "flowtime technique",
    "52 17 rule",
    "ultradian rhythm",
    "body doubling",
    "dopamine detox",
    "attention management",
    "cognitive load",
    "working memory support",
    "executive function tools",
    "study with me",
    "coworking timer",
    "distraction blocker",
    "focus mode app",
  ],
  authors: [{ name: "Foci" }],
  creator: "Foci",
  publisher: "Foci",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Foci",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Foci",
    title,
    description,
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Foci – Focus Timer, Tasks & Ambient Sounds",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/twitter-image`],
  },
  category: "productivity",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  other: {
    "google": "notranslate",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem("foci_theme")||localStorage.getItem("tempo_theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

const swRegisterScript = `if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})}`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const nonce = hdrs.get("x-nonce") ?? "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
        <link rel="help" href="/llms.txt" type="text/plain" />
        <link rel="alternate" href="/llms-full.txt" type="text/plain" title="LLM-optimized full content" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0b1121]">
        {SAFE_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${SAFE_GA_ID}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${SAFE_GA_ID}');
              `}
            </Script>
          </>
        )}
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>
              <AuthProvider>{children}</AuthProvider>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
