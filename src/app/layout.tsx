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
  ADSENSE_CLIENT_ID,
} from "@/lib/product-facts";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Validate GA measurement ID format to prevent script injection
const SAFE_GA_ID = GA_ID && /^G-[A-Z0-9]+$/.test(GA_ID) ? GA_ID : undefined;

const siteUrl = SITE_URL;
const title = "Foci App — Free Task Manager & Focus Timer";
const description = FOCI_SHORT_DESCRIPTION;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e3ebf7" },
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

const swRegisterScript = `(function(){if(!("serviceWorker"in navigator))return;var h=location.hostname;var isLocal=h==="localhost"||h==="127.0.0.1"||h.endsWith(".local");var p=location.protocol;if(p==="app:"||p==="file:"||!window.isSecureContext)return;window.addEventListener("load",function(){if(isLocal){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})});if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})})}return}function ping(){var c=navigator.serviceWorker.controller;if(!c)return;var urls=performance.getEntriesByType("resource").map(function(e){return e.name}).filter(function(u){return u.indexOf("/_next/static/")!==-1});urls.push(location.href);c.postMessage({type:"CACHE_URLS",urls:urls})}navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(function(){ping();navigator.serviceWorker.addEventListener("controllerchange",ping)}).catch(function(){})})})()`;

const bootCriticalStyle = `.foci-boot{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;background:#e3ebf7;color:#334155;font-family:system-ui,-apple-system,sans-serif}.dark .foci-boot,html.dark .foci-boot{background:#070b16;color:#e2e8f0}.foci-boot-mark{font-size:1.75rem;font-weight:700;letter-spacing:-.02em}.foci-boot-msg{font-size:.95rem;opacity:.72}#foci-offline-fallback{display:none}html.foci-offline-fallback .foci-boot{display:none!important}html.foci-offline-fallback #foci-offline-fallback{display:block;position:fixed;inset:0;z-index:99998;overflow:auto;background:#e8eef6;color:#0f172a;padding:calc(20px + env(safe-area-inset-top)) 18px 28px;font-family:system-ui,-apple-system,sans-serif}html.dark.foci-offline-fallback #foci-offline-fallback{background:#070b16;color:#e2e8f0}#foci-offline-fallback h1{font-size:1.5rem;margin:0 0 .35rem}#foci-offline-fallback .note{color:#64748b;font-size:.875rem;margin:0 0 1.1rem}html.dark #foci-offline-fallback .note{color:#94a3b8}#foci-offline-fallback ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}#foci-offline-fallback li{background:#fff;border-radius:14px;padding:12px 14px}html.dark #foci-offline-fallback li{background:#132037}#foci-offline-fallback li.done{opacity:.55;text-decoration:line-through}`;

const offlineFallbackScript = `(function(){function start(){var delay=navigator.onLine===false?700:8000;setTimeout(function(){if(document.documentElement.dataset.fociHydrated==="1")return;var path=location.pathname;if(path!=="/app"&&path.indexOf("/app/")!==0&&path!=="/stats")return;function read(key){try{var v=JSON.parse(localStorage.getItem(key)||"null");return Array.isArray(v)?v:null}catch(e){return null}}function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}var tasks=read("foci_cache_tasks")||read("foci_tasks")||read("tempo_tasks");if(!tasks)return;var root=document.getElementById("foci-offline-fallback");if(!root)return;var open=tasks.filter(function(x){return x&&!x.completed&&!x.archivedAt});var done=tasks.filter(function(x){return x&&x.completed&&!x.archivedAt}).slice(0,8);root.innerHTML="<h1>Foci</h1><p class=\\"note\\">You're offline. Showing tasks from the last time this device loaded.</p><ul>"+(open.length||done.length?open.map(function(x){return "<li>"+esc(x.title||"Untitled")+"</li>"}).join("")+done.map(function(x){return "<li class=\\"done\\">"+esc(x.title||"Untitled")+"</li>"}).join(""):"<li>No open tasks saved on this device.</li>")+"</ul>";root.hidden=false;document.documentElement.classList.add("foci-offline-fallback")},delay)}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start()})()`;

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
        <style dangerouslySetInnerHTML={{ __html: bootCriticalStyle }} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: swRegisterScript }} suppressHydrationWarning />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: offlineFallbackScript }} suppressHydrationWarning />
        <link rel="help" href="/llms.txt" type="text/plain" />
        <link rel="alternate" href="/llms-full.txt" type="text/plain" title="LLM-optimized full content" />
        <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
      </head>
      <body className={`${fontSans.className} min-h-screen bg-[var(--page-bg)] dark:bg-[#070b16] antialiased`}>
        {/* SSR + client-dismissed splash — do not remove via DOM APIs (breaks soft nav). */}
        <BootSplash />
        <div id="foci-offline-fallback" hidden />
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
                  var q=new URLSearchParams(location.search);
                  var src=(q.get("utm_source")||q.get("ref")||"").toLowerCase();
                  var self={"foci":1,"foci-header":1,"foci-footer":1,"foci-app":1};
                  var ignoreRef=/accounts\\.google\\.com|supabase\\.co/.test(document.referrer||"");
                  if(self[src]){
                    ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(function(k){q.delete(k)});
                    if(self[(q.get("ref")||"").toLowerCase()]) q.delete("ref");
                    history.replaceState({},"",location.pathname+(q.toString()?"?"+q.toString():"")+location.hash);
                    ignoreRef=true;
                  }
                  gtag('config','${SAFE_GA_ID}',{send_page_view:true,anonymize_ip:true,ignore_referrer:ignoreRef});
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
