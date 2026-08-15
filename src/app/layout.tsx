import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { headers } from "next/headers";
import PageViewAnalytics from "@/components/PageViewAnalytics";
import { AuthProvider } from "@/components/AuthProvider";
import BootSplash from "@/components/BootSplash";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";
import { fontSans, fontWordmark } from "@/lib/fonts";
import {
  SITE_URL,
  FOCI_SHORT_DESCRIPTION,
  ROOT_KEYWORDS,
} from "@/lib/product-facts";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Validate GA measurement ID format to prevent script injection
const SAFE_GA_ID = GA_ID && /^G-[A-Z0-9]+$/.test(GA_ID) ? GA_ID : undefined;

const siteUrl = SITE_URL;
const title = "Foci – Free Task Manager & Focus App";
const description = FOCI_SHORT_DESCRIPTION;

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
  keywords: [...ROOT_KEYWORDS],
  authors: [{ name: "Foci" }],
  creator: "Foci",
  publisher: "Foci",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "Foci Blog" }],
    },
  },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
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

// Match app-shell colors immediately so PWA splash → first paint doesn't flash black→white.
const themeScript = `(function(){try{var t=localStorage.getItem("foci_theme")||localStorage.getItem("tempo_theme");var dark=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);var root=document.documentElement;if(dark){root.classList.add("dark");root.style.backgroundColor="#070b16";root.style.colorScheme="dark"}else{root.classList.remove("dark");root.style.backgroundColor="#e8eef6";root.style.colorScheme="light"}}catch(e){}})()`;

const swRegisterScript = `(function(){if(!("serviceWorker"in navigator))return;var h=location.hostname;var isLocal=h==="localhost"||h==="127.0.0.1"||h.endsWith(".local");var p=location.protocol;if(p==="app:"||p==="file:"||!window.isSecureContext)return;window.addEventListener("load",function(){if(isLocal){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})});if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})})}return}navigator.serviceWorker.register("/sw.js").catch(function(){})})})()`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const nonce = hdrs.get("x-nonce") ?? "";

  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontWordmark.variable}`}>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: swRegisterScript }} suppressHydrationWarning />
        <link rel="help" href="/llms.txt" type="text/plain" />
        <link rel="alternate" href="/llms-full.txt" type="text/plain" title="LLM-optimized full content" />
      </head>
      <body className={`${fontSans.className} min-h-screen bg-[var(--page-bg)] dark:bg-[#070b16] antialiased`}>
        {/* SSR + client-dismissed splash — do not remove via DOM APIs (breaks soft nav). */}
        <BootSplash />
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
              <AuthProvider>
                {children}
              </AuthProvider>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
