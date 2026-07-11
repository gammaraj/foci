import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { headers } from "next/headers";
import PageViewAnalytics from "@/components/PageViewAnalytics";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";
import { fontSans } from "@/lib/fonts";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Validate GA measurement ID format to prevent script injection
const SAFE_GA_ID = GA_ID && /^G-[A-Z0-9]+$/.test(GA_ID) ? GA_ID : undefined;

const siteUrl = "https://usefoci.com";
const title = "Foci – Free Pomodoro Timer, Tasks & Focus App";
const description =
  "Foci is the free focus app at usefoci.com — Pomodoro timer, task tracking, Smart Plan, daily goals, streak stats, and built-in study music. No signup required.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#070b16" },
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
    "account collaboration",
    "team task sharing",
    "project collaboration invites",
    "share tasks with team",
    "collaborative productivity",
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
    "flowtime vs pomodoro",
    "flowmodoro",
    "52 17 rule",
    "52/17 technique",
    "52/17 rule productivity",
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
    "forest app alternative",
    "foci vs forest",
    "todoist alternative free",
    "foci vs todoist",
    "focus@will alternative",
    "best pomodoro app 2026",
    "free pomodoro app",
    "pomofocus alternative",
    "be focused alternative",
    "toggl track alternative",
    "focus timer comparison",
    "calm focus app",
    "deep work workspace",
    "lofi girl alternative",
    "study focus workspace",
    "pomodoro app worldwide",
    "kanban task board",
    "bucket view tasks",
    "card view tasks",
    "drag reorder tasks",
    "task detail drawer",
    "reorder project tabs",
    "drag reorder projects",
    "task backlog stats",
    "overdue task tracker",
    "print task list",
    "mobile task urgency",
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
      {
        url: "/favicon-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/favicon.ico", sizes: "32x32" },
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
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/twitter-image`],
    creator: "@usefoci",
  },
  category: "productivity",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  other: {
    "google": "notranslate",
    "content-language": "en",
    "geo.placename": "Worldwide",
    "geo.region": "GLOBAL",
    "audience": "all",
    "distribution": "global",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem("foci_theme")||localStorage.getItem("tempo_theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

const swRegisterScript = `(function(){if(!("serviceWorker"in navigator))return;var h=location.hostname;var isLocal=h==="localhost"||h==="127.0.0.1"||h.endsWith(".local");var p=location.protocol;if(p==="app:"||p==="file:"||!window.isSecureContext)return;window.addEventListener("load",function(){if(isLocal){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})});if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})})}return}navigator.serviceWorker.register("/sw.js").catch(function(){})})})()`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const nonce = hdrs.get("x-nonce") ?? "";

  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: swRegisterScript }} suppressHydrationWarning />
        <link rel="help" href="/llms.txt" type="text/plain" />
        <link rel="alternate" href="/llms-full.txt" type="text/plain" title="LLM-optimized full content" />
      </head>
      <body className={`${fontSans.className} min-h-screen bg-slate-50 dark:bg-[#070b16] antialiased`}>
        {SAFE_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${SAFE_GA_ID}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
              {`
                (function(){
                  var h=location.hostname;
                  if(h==="localhost"||h==="127.0.0.1"||h.endsWith(".vercel.app"))return;
                  window.dataLayer=window.dataLayer||[];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag=gtag;
                  gtag('js',new Date());
                  gtag('config','${SAFE_GA_ID}',{send_page_view:true,anonymize_ip:true});
                })();
              `}
            </Script>
            <Suspense fallback={null}>
              <PageViewAnalytics />
            </Suspense>
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
